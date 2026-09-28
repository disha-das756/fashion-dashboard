from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from schemas import DiscountCreate, DiscountResponse, ApplyDiscountRequest, OrderResponse
from database import (
    get_db,
    get_discount_by_code,
    create_discount as db_create_discount,
    get_order,
    apply_discount_to_order as db_apply_discount_to_order,
)
from dependencies import get_current_user

router = APIRouter(tags=["discounts"])

@router.post("/admin/discounts", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
@router.post("/discounts", response_model=DiscountResponse, status_code=status.HTTP_201_CREATED)
def create_new_discount(
    discount_data: DiscountCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    if get_discount_by_code(db, discount_data.code):
        raise HTTPException(status_code=400, detail="Discount code already exists")
    return db_create_discount(
        db,
        code=discount_data.code,
        percentage=discount_data.percentage,
        expires_at=discount_data.expires_at,
    )

@router.post("/discounts/apply", response_model=OrderResponse)
def apply_discount(
    payload: ApplyDiscountRequest,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    order = get_order(db, payload.order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    discount = get_discount_by_code(db, payload.discount_code)
    if not discount:
        raise HTTPException(status_code=404, detail="Discount code not found")
    return db_apply_discount_to_order(db, order, discount)
