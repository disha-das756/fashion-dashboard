from datetime import datetime
from enum import Enum
from typing import Optional

from pydantic import BaseModel, ConfigDict


# ============================================================
# PRODUCT
# ============================================================

class ProductBase(BaseModel):
    name: str
    price: float
    image: Optional[str] = None
    category_id: int


class ProductCreate(ProductBase):
    pass


class ProductResponse(ProductBase):
    id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# CATEGORY
# ============================================================

class Category(BaseModel):
    id: int
    name: str
    slug: str

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# ORDER
# ============================================================

class OrderStatus(str, Enum):
    pending = "pending"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class OrderCreate(BaseModel):
    product_id: int
    quantity: int


class OrderResponse(BaseModel):
    id: int
    product_id: int
    quantity: int
    total: float
    status: OrderStatus
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class OrderStats(BaseModel):
    total_orders: int
    last_7_days: int
    revenue: float


# ============================================================
# USER / AUTHENTICATION
# ============================================================

class UserCreate(BaseModel):
    username: str
    email: str
    password: str


class UserLogin(BaseModel):
    username: str
    password: str
    email: Optional[str] = None


class UserResponse(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# ============================================================
# FAVOURITES
# ============================================================

class FavouriteResponse(BaseModel):
    id: int
    user_id: int
    product_id: int
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


# ============================================================
# DISCOUNTS
# ============================================================

class DiscountCreate(BaseModel):
    code: str
    percentage: float
    expires_at: datetime


class DiscountResponse(BaseModel):
    id: int
    code: str
    percentage: float
    expires_at: datetime
    created_at: datetime

    model_config = ConfigDict(
        from_attributes=True
    )


class ApplyDiscountRequest(BaseModel):
    order_id: int
    discount_code: str