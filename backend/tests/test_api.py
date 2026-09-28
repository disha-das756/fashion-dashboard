import pytest

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from main import app, get_current_user
from database import Base, get_db


# ============================================================
# TEST DATABASE
# ============================================================

SQLALCHEMY_TEST_DATABASE_URL = "sqlite://"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={
        "check_same_thread": False,
    },
    poolclass=StaticPool,
)

TestingSessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


# ============================================================
# DATABASE OVERRIDE
# ============================================================

def override_get_db():
    db = TestingSessionLocal()

    try:
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db


# ============================================================
# TEST DATABASE SETUP
# ============================================================

@pytest.fixture()
def client():
    Base.metadata.drop_all(
        bind=engine
    )

    Base.metadata.create_all(
        bind=engine
    )

    with TestClient(app) as test_client:
        yield test_client

    Base.metadata.drop_all(
        bind=engine
    )


# ============================================================
# HELPER - REGISTER USER
# ============================================================

def register_user(client):
    response = client.post(
        "/auth/register",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 201

    return response.json()


# ============================================================
# HELPER - LOGIN
# ============================================================

def login_user(client):
    response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 200

    return response.json()["access_token"]


# ============================================================
# HELPER - AUTH HEADERS
# ============================================================

def auth_headers(token):
    return {
        "Authorization": f"Bearer {token}"
    }


# ============================================================
# AUTH TESTS
# ============================================================

def test_register(client):

    response = client.post(
        "/auth/register",
        json={
            "username": "disha",
            "email": "disha@example.com",
            "password": "password123",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["username"] == "disha"
    assert data["email"] == "disha@example.com"
    assert "password_hash" not in data


def test_login(client):

    register_user(client)

    response = client.post(
        "/auth/login",
        json={
            "username": "testuser",
            "email": "test@example.com",
            "password": "testpassword123",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert "access_token" in data
    assert data["token_type"] == "bearer"


def test_auth_required(client):

    response = client.post(
        "/orders",
        json={
            "product_id": 1,
            "quantity": 1,
        },
    )

    assert response.status_code == 401


# ============================================================
# CATEGORY TEST
# ============================================================

def test_get_categories(client):

    from database import Category

    db = TestingSessionLocal()

    try:
        db.add_all([
            Category(
                name="Men",
                slug="men",
            ),
            Category(
                name="Women",
                slug="women",
            ),
            Category(
                name="All",
                slug="all",
            ),
        ])

        db.commit()

    finally:
        db.close()

    response = client.get(
        "/categories"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 3


# ============================================================
# PRODUCT TESTS
# ============================================================

def create_categories():

    from database import Category

    db = TestingSessionLocal()

    men = Category(
        name="Men",
        slug="men",
    )

    women = Category(
        name="Women",
        slug="women",
    )

    all_category = Category(
        name="All",
        slug="all",
    )

    db.add_all([
        men,
        women,
        all_category,
    ])

    db.commit()

    db.refresh(men)
    db.refresh(women)
    db.refresh(all_category)

    db.close()

    return men, women, all_category


def test_create_product(client):

    register_user(client)

    token = login_user(client)

    men, _, _ = create_categories()

    response = client.post(
        "/products",
        headers=auth_headers(token),
        json={
            "name": "Test T-Shirt",
            "price": 50,
            "image": "https://example.com/shirt.jpg",
            "category_id": men.id,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["name"] == "Test T-Shirt"
    assert data["price"] == 50
    assert data["category_id"] == men.id
    assert "id" in data
    assert "created_at" in data


def test_get_products(client):

    men, _, _ = create_categories()

    from database import Product

    db = TestingSessionLocal()

    db.add(
        Product(
            name="Men's Shirt",
            price=50,
            image="shirt.jpg",
            category_id=men.id,
        )
    )

    db.commit()
    db.close()

    response = client.get(
        "/products"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Men's Shirt"


def test_filter_by_category(client):

    men, women, _ = create_categories()

    from database import Product

    db = TestingSessionLocal()

    db.add_all([
        Product(
            name="Men Shirt",
            price=50,
            image="men.jpg",
            category_id=men.id,
        ),
        Product(
            name="Women Dress",
            price=100,
            image="women.jpg",
            category_id=women.id,
        ),
    ])

    db.commit()
    db.close()

    response = client.get(
        "/products?category=men"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Men Shirt"


def test_search_products(client):

    men, _, _ = create_categories()

    from database import Product

    db = TestingSessionLocal()

    db.add_all([
        Product(
            name="Black T-Shirt",
            price=50,
            image="black.jpg",
            category_id=men.id,
        ),
        Product(
            name="Blue Jeans",
            price=80,
            image="jeans.jpg",
            category_id=men.id,
        ),
    ])

    db.commit()
    db.close()

    response = client.get(
        "/products?search=shirt"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Black T-Shirt"


def test_filter_by_price(client):

    men, _, _ = create_categories()

    from database import Product

    db = TestingSessionLocal()

    db.add_all([
        Product(
            name="Cheap Shirt",
            price=30,
            image="cheap.jpg",
            category_id=men.id,
        ),
        Product(
            name="Expensive Shirt",
            price=100,
            image="expensive.jpg",
            category_id=men.id,
        ),
    ])

    db.commit()
    db.close()

    response = client.get(
        "/products?min_price=50&max_price=120"
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["name"] == "Expensive Shirt"


# ============================================================
# ORDER TESTS
# ============================================================

def create_test_product():

    men, _, _ = create_categories()

    from database import Product

    db = TestingSessionLocal()

    product = Product(
        name="Test Product",
        price=100,
        image="test.jpg",
        category_id=men.id,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    product_id = product.id

    db.close()

    return product_id


def test_create_order(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    response = client.post(
        "/orders",
        headers=auth_headers(token),
        json={
            "product_id": product_id,
            "quantity": 2,
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["product_id"] == product_id
    assert data["quantity"] == 2
    assert data["total"] == 200
    assert data["status"] == "pending"


def test_create_order_invalid_product(client):

    register_user(client)

    token = login_user(client)

    response = client.post(
        "/orders",
        headers=auth_headers(token),
        json={
            "product_id": 9999,
            "quantity": 1,
        },
    )

    assert response.status_code == 404


def test_create_order_invalid_quantity(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    response = client.post(
        "/orders",
        headers=auth_headers(token),
        json={
            "product_id": product_id,
            "quantity": 0,
        },
    )

    assert response.status_code == 400


def test_order_stats(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    client.post(
        "/orders",
        headers=auth_headers(token),
        json={
            "product_id": product_id,
            "quantity": 2,
        },
    )

    response = client.get(
        "/orders/stats",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.json()

    assert data["total_orders"] == 1
    assert data["last_7_days"] == 1
    assert data["revenue"] == 200


# ============================================================
# FAVOURITES TESTS
# ============================================================

def test_add_favourite(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    response = client.post(
        f"/favourites/{product_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 201

    data = response.json()

    assert data["id"] == product_id


def test_duplicate_favourite(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    first_response = client.post(
        f"/favourites/{product_id}",
        headers=auth_headers(token),
    )

    assert first_response.status_code == 201

    second_response = client.post(
        f"/favourites/{product_id}",
        headers=auth_headers(token),
    )

    assert second_response.status_code == 409


def test_get_favourites(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    client.post(
        f"/favourites/{product_id}",
        headers=auth_headers(token),
    )

    response = client.get(
        "/favourites",
        headers=auth_headers(token),
    )

    assert response.status_code == 200

    data = response.json()

    assert len(data) == 1
    assert data[0]["id"] == product_id


def test_delete_favourite(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    client.post(
        f"/favourites/{product_id}",
        headers=auth_headers(token),
    )

    response = client.delete(
        f"/favourites/{product_id}",
        headers=auth_headers(token),
    )

    assert response.status_code == 204


# ============================================================
# DISCOUNT TESTS
# ============================================================

def test_create_discount(client):

    register_user(client)

    token = login_user(client)

    response = client.post(
        "/admin/discounts",
        headers=auth_headers(token),
        json={
            "code": "TEST20",
            "percentage": 20,
            "expires_at": "2099-12-31T23:59:59Z",
        },
    )

    assert response.status_code == 201

    data = response.json()

    assert data["code"] == "TEST20"
    assert data["percentage"] == 20


def test_apply_discount(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    order_response = client.post(
        "/orders",
        headers=auth_headers(token),
        json={
            "product_id": product_id,
            "quantity": 2,
        },
    )

    assert order_response.status_code == 201

    order_id = order_response.json()["id"]

    discount_response = client.post(
        "/admin/discounts",
        headers=auth_headers(token),
        json={
            "code": "SAVE20",
            "percentage": 20,
            "expires_at": "2099-12-31T23:59:59Z",
        },
    )

    assert discount_response.status_code == 201

    response = client.post(
        "/orders/apply-discount",
        headers=auth_headers(token),
        json={
            "order_id": order_id,
            "discount_code": "SAVE20",
        },
    )

    assert response.status_code == 200

    data = response.json()

    # Original total = 200
    # 20% discount = 40
    # Final total = 160

    assert data["total"] == 160


def test_invalid_discount(client):

    register_user(client)

    token = login_user(client)

    product_id = create_test_product()

    order_response = client.post(
        "/orders",
        headers=auth_headers(token),
        json={
            "product_id": product_id,
            "quantity": 1,
        },
    )
    assert order_response.status_code == 201

    order_id = order_response.json()["id"]

    response = client.post(
        "/orders/apply-discount",
        headers=auth_headers(token),
        json={
            "order_id": order_id,
            "discount_code": "DOESNOTEXIST",
        },
        
    )

    assert response.status_code == 404