from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from schemas import ProductResponse
from database import (
    get_db,
    get_favourite,
    create_favourite as db_create_favourite,
    delete_favourite as db_delete_favourite,
    get_favourites as db_get_favourites,
)
from dependencies import get_current_user

router = APIRouter(prefix="/favourites", tags=["favourites"])

@router.get("", response_model=List[ProductResponse])
def get_user_favourites(
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return db_get_favourites(db, user_id=current_user.id)

@router.post("/{product_id}", status_code=status.HTTP_201_CREATED)
def add_favourite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    fav = get_favourite(db, current_user.id, product_id)
    if fav:
        raise HTTPException(status_code=409, detail="Product already in favourites")
    db_create_favourite(db, current_user.id, product_id)
    return {"id": product_id, "user_id": current_user.id, "product_id": product_id}

@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favourite(
    product_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    deleted = db_delete_favourite(db, current_user.id, product_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Favourite not found")
    return None
