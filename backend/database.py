from datetime import datetime, timedelta, timezone
from pathlib import Path

from sqlalchemy import (
    create_engine,
    Column,
    Integer,
    String,
    Float,
    DateTime,
    ForeignKey,
    UniqueConstraint,
)

from sqlalchemy.orm import (
    declarative_base,
    sessionmaker,
    relationship,
    Session,
)

from schemas import OrderStatus


# ============================================================
# DATABASE CONFIGURATION
# ============================================================

BASE_DIR = Path(__file__).resolve().parent

DATABASE_PATH = BASE_DIR / "fashion.db"

DATABASE_URL = f"sqlite:///{DATABASE_PATH}"

engine = create_engine(
    DATABASE_URL,
    connect_args={
        "check_same_thread": False
    },
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)

Base = declarative_base()


# ============================================================
# CATEGORY MODEL
# ============================================================

class Category(Base):
    __tablename__ = "categories"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    slug = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    products = relationship(
        "Product",
        back_populates="category",
    )


# ============================================================
# PRODUCT MODEL
# ============================================================

class Product(Base):
    __tablename__ = "products"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    name = Column(
        String,
        nullable=False,
    )

    price = Column(
        Float,
        nullable=False,
    )

    image = Column(
        String,
        nullable=True,
    )

    category_id = Column(
        Integer,
        ForeignKey("categories.id"),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    category = relationship(
        "Category",
        back_populates="products",
    )


# ============================================================
# ORDER MODEL
# ============================================================

class Order(Base):
    __tablename__ = "orders"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
    )

    quantity = Column(
        Integer,
        nullable=False,
    )

    total = Column(
        Float,
        nullable=False,
    )

    status = Column(
        String,
        nullable=False,
        default=OrderStatus.pending.value,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    product = relationship("Product")


# ============================================================
# USER MODEL
# ============================================================

class User(Base):
    __tablename__ = "users"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    username = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    email = Column(
        String,
        unique=True,
        nullable=False,
    )

    password_hash = Column(
        String,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


# ============================================================
# FAVOURITE MODEL
# ============================================================

class Favourite(Base):
    __tablename__ = "favourites"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    user_id = Column(
        Integer,
        ForeignKey("users.id"),
        nullable=False,
    )

    product_id = Column(
        Integer,
        ForeignKey("products.id"),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    user = relationship("User")

    product = relationship("Product")

    __table_args__ = (
        UniqueConstraint(
            "user_id",
            "product_id",
            name="unique_user_product_favourite",
        ),
    )


# ============================================================
# DISCOUNT MODEL
# ============================================================

class Discount(Base):
    __tablename__ = "discounts"

    id = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    code = Column(
        String,
        unique=True,
        nullable=False,
        index=True,
    )

    percentage = Column(
        Float,
        nullable=False,
    )

    expires_at = Column(
        DateTime(timezone=True),
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )


# ============================================================
# DATABASE INITIALIZATION
# ============================================================

def init_db():
    Base.metadata.create_all(
        bind=engine
    )


# ============================================================
# DATABASE SESSION
# ============================================================

def get_db():
    db = SessionLocal()

    try:
        yield db

    finally:
        db.close()


# ============================================================
# SEED DATABASE
# ============================================================

def seed_data():
    db = SessionLocal()

    try:

        # ----------------------------------------------------
        # CATEGORIES
        # ----------------------------------------------------

        if db.query(Category).count() == 0:

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

        # ----------------------------------------------------
        # PRODUCTS
        # ----------------------------------------------------

        if db.query(Product).count() == 0:

            men = (
                db.query(Category)
                .filter(
                    Category.slug == "men"
                )
                .first()
            )

            women = (
                db.query(Category)
                .filter(
                    Category.slug == "women"
                )
                .first()
            )

            if men is None or women is None:
                return

            product1 = Product(
                name="WMX Rubber Zebra sandal",
                price=36,
                image=(
                    "https://t3.ftcdn.net/jpg/04/40/76/08/"
                    "240_F_440760885_yIuWdpOefWajboXTxMRMDPfd2HKstzGY.jpg"
                ),
                category_id=men.id,
            )

            product2 = Product(
                name="Super Skinny jogger",
                price=89,
                image=(
                    "https://images.unsplash.com/"
                    "photo-1649134296132-56606326c566"
                    "?q=80&w=1032&auto=format&fit=crop"
                ),
                category_id=women.id,
            )

            db.add_all([
                product1,
                product2,
            ])

            db.commit()

    finally:
        db.close()


# ============================================================
# CATEGORY FUNCTIONS
# ============================================================

def get_categories(db: Session):
    return db.query(Category).all()


def get_category_by_slug(
    db: Session,
    slug: str,
):
    return (
        db.query(Category)
        .filter(
            Category.slug == slug.lower()
        )
        .first()
    )


# ============================================================
# PRODUCT FUNCTIONS
# ============================================================

def get_products(
    db: Session,
    category=None,
    search=None,
    min_price=None,
    max_price=None,
    category_id=None,
):
    query = db.query(Product)

    if category_id is not None:
        query = query.filter(Product.category_id == category_id)

    # Category slug filter
    if category and category.lower() != "all":

        category_obj = get_category_by_slug(
            db,
            category,
        )

        if category_obj is None:
            return []

        query = query.filter(
            Product.category_id == category_obj.id
        )

    # Search filter
    if search:
        query = query.filter(
            Product.name.ilike(
                f"%{search}%"
            )
        )

    # Minimum price
    if min_price is not None:
        query = query.filter(
            Product.price >= min_price
        )

    # Maximum price
    if max_price is not None:
        query = query.filter(
            Product.price <= max_price
        )

    return query.all()


def get_product(
    db: Session,
    product_id: int,
):
    return (
        db.query(Product)
        .filter(
            Product.id == product_id
        )
        .first()
    )


def create_product(
    db: Session,
    data,
):
    product = Product(
        name=data.name,
        price=data.price,
        image=data.image,
        category_id=data.category_id,
    )

    db.add(product)
    db.commit()
    db.refresh(product)

    return product


def update_product(
    db: Session,
    product_id: int,
    data,
):
    product = get_product(
        db,
        product_id,
    )

    if product is None:
        return None

    product.name = data.name
    product.price = data.price
    product.image = data.image
    product.category_id = data.category_id

    db.commit()
    db.refresh(product)

    return product


def delete_product(
    db: Session,
    product_id: int,
):
    product = get_product(
        db,
        product_id,
    )

    if product is None:
        return False

    db.delete(product)
    db.commit()

    return True


# ============================================================
# ORDER FUNCTIONS
# ============================================================

def get_orders(db: Session):
    return db.query(Order).all()


def get_order(
    db: Session,
    order_id: int,
):
    return (
        db.query(Order)
        .filter(
            Order.id == order_id
        )
        .first()
    )


def create_order(
    db: Session,
    product_id: int,
    quantity: int,
):
    product = get_product(
        db,
        product_id,
    )

    if product is None:
        return None

    order = Order(
        product_id=product_id,
        quantity=quantity,
        total=product.price * quantity,
        status=OrderStatus.pending.value,
        created_at=datetime.now(timezone.utc),
    )

    db.add(order)
    db.commit()
    db.refresh(order)

    return order


def update_order_status(
    db: Session,
    order_id: int,
    status: OrderStatus,
):
    order = get_order(
        db,
        order_id,
    )

    if order is None:
        return None

    order.status = status.value

    db.commit()
    db.refresh(order)

    return order


def get_order_stats(db: Session):

    orders = db.query(Order).all()

    seven_days_ago = (
        datetime.now(timezone.utc)
        - timedelta(days=7)
    )

    recent_orders = []

    for order in orders:

        created_at = order.created_at

        if created_at.tzinfo is None:
            created_at = created_at.replace(
                tzinfo=timezone.utc
            )

        if created_at >= seven_days_ago:
            recent_orders.append(order)

    revenue = sum(
        order.total
        for order in orders
    )

    return {
        "total_orders": len(orders),
        "last_7_days": len(recent_orders),
        "revenue": revenue,
    }


# ============================================================
# USER FUNCTIONS
# ============================================================

def get_user_by_username(
    db: Session,
    username: str,
):
    return (
        db.query(User)
        .filter(
            User.username == username
        )
        .first()
    )


def get_user_by_email(
    db: Session,
    email: str,
):
    return (
        db.query(User)
        .filter(
            User.email == email
        )
        .first()
    )


def create_user(
    db: Session,
    username: str,
    email: str,
    password_hash: str,
):
    user = User(
        username=username,
        email=email,
        password_hash=password_hash,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


# ============================================================
# FAVOURITE FUNCTIONS
# ============================================================

def get_favourite(
    db: Session,
    user_id: int,
    product_id: int,
):
    return (
        db.query(Favourite)
        .filter(
            Favourite.user_id == user_id,
            Favourite.product_id == product_id,
        )
        .first()
    )


def create_favourite(
    db: Session,
    user_id: int,
    product_id: int,
):
    favourite = Favourite(
        user_id=user_id,
        product_id=product_id,
    )

    db.add(favourite)
    db.commit()
    db.refresh(favourite)

    return favourite


def delete_favourite(
    db: Session,
    user_id: int,
    product_id: int,
):
    favourite = get_favourite(
        db,
        user_id,
        product_id,
    )

    if favourite is None:
        return False

    db.delete(favourite)
    db.commit()

    return True


def get_favourites(
    db: Session,
    user_id: int,
):
    return (
        db.query(Product)
        .join(
            Favourite,
            Favourite.product_id == Product.id,
        )
        .filter(
            Favourite.user_id == user_id
        )
        .all()
    )


# ============================================================
# DISCOUNT FUNCTIONS
# ============================================================

def get_discount_by_code(
    db: Session,
    code: str,
):
    return (
        db.query(Discount)
        .filter(
            Discount.code == code.upper()
        )
        .first()
    )


def create_discount(
    db: Session,
    code: str,
    percentage: float,
    expires_at: datetime,
):
    discount = Discount(
        code=code.upper(),
        percentage=percentage,
        expires_at=expires_at,
    )

    db.add(discount)
    db.commit()
    db.refresh(discount)

    return discount


def apply_discount_to_order(
    db: Session,
    order: Order,
    discount: Discount,
):
    discount_amount = (
        order.total
        * discount.percentage
        / 100
    )

    order.total = (
        order.total
        - discount_amount
    )

    db.commit()
    db.refresh(order)

    return order