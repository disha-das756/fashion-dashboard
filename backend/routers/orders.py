from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from schemas import OrderCreate, OrderResponse, OrderStats, OrderStatus, ApplyDiscountRequest
from database import (
    get_db,
    get_orders,
    get_order,
    create_order as db_create_order,
    update_order_status as db_update_order_status,
    get_order_stats as db_get_order_stats,
    get_discount_by_code,
    apply_discount_to_order as db_apply_discount_to_order,
)
from dependencies import get_current_user

router = APIRouter(prefix="/orders", tags=["orders"])

@router.get("/stats", response_model=OrderStats)
def get_stats(db: Session = Depends(get_db)):
    return db_get_order_stats(db)

@router.get("", response_model=List[OrderResponse])
def list_orders(
    status_filter: Optional[OrderStatus] = None,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    return get_orders(db, status=status_filter)

@router.post("", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
def create_new_order(
    order_data: OrderCreate,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    if order_data.quantity <= 0:
        raise HTTPException(status_code=400, detail="Quantity must be greater than 0")
    order = db_create_order(db, product_id=order_data.product_id, quantity=order_data.quantity)
    if order is None:
        raise HTTPException(status_code=404, detail="Product not found")
    return order

@router.get("/{order_id}", response_model=OrderResponse)
def get_single_order(
    order_id: int,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    order = get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order

@router.patch("/{order_id}/status", response_model=OrderResponse)
def update_status(
    order_id: int,
    new_status: OrderStatus,
    db: Session = Depends(get_db),
    current_user = Depends(get_current_user),
):
    updated = db_update_order_status(db, order_id, new_status)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return updated

@router.post("/apply-discount", response_model=OrderResponse)
def apply_discount_to_order_route(
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
