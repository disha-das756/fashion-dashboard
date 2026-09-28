from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from schemas import ProductCreate, ProductResponse, Category as CategorySchema
from database import (
    get_db,
    get_products,
    get_product,
    create_product as db_create_product,
    update_product as db_update_product,
    delete_product as db_delete_product,
    get_categories as db_get_categories,
)
from dependencies import get_current_user

router = APIRouter(tags=["products"])

@router.get("/products", response_model=List[ProductResponse])
def list_products(
    category: Optional[str] = None,
    search: Optional[str] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    category_id: Optional[int] = None,
    db: Session = Depends(get_db),
):
    return get_products(
        db,
        category=category,
        search=search,
        min_price=min_price,
        max_price=max_price,
        category_id=category_id,
    )

@router.get("/products/{product_id}", response_model=ProductResponse)
def get_single_product(product_id: int, db: Session = Depends(get_db)):
    product = get_product(db, product_id)
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return product

@router.post("/products", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_new_product(
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return db_create_product(db, product)

@router.put("/products/{product_id}", response_model=ProductResponse)
def update_existing_product(
    product_id: int,
    product: ProductCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    updated = db_update_product(db, product_id, product)
    if not updated:
        raise HTTPException(status_code=404, detail="Product not found")
    return updated

@router.delete("/products/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_existing_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    deleted = db_delete_product(db, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Product not found")
    return None

@router.get("/categories", response_model=List[CategorySchema])
def list_categories(db: Session = Depends(get_db)):
    return db_get_categories(db)
