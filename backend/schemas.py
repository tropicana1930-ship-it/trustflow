from pydantic import BaseModel, EmailStr
from datetime import datetime
from typing import Optional, List

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserUpgrade(BaseModel):
    tier: str

class UserOut(BaseModel):
    id: int
    email: EmailStr
    role: str
    kyc_status: str
    reputation_score: float
    tier: str

    class Config:
        from_attributes = True

class ProductCreate(BaseModel):
    title: str
    description: str
    price: float
    category: str = "General"
    images: Optional[str] = None

class ProductOut(BaseModel):
    id: int
    seller_id: int
    title: str
    description: Optional[str] = None
    price: float
    trust_score: Optional[float]
    status: str
    images: Optional[str] = "[]"

    class Config:
        from_attributes = True

class ProductAnalysisRequest(BaseModel):
    title: str
    description: str
    price: float

class ProductAnalysisResponse(BaseModel):
    trust_score: int
    risk_level: str
    red_flags: List[str]
    reasoning: str
    recommended_escrow: bool

class OrderCreate(BaseModel):
    product_id: int
    carrier_id: int

class OrderOut(BaseModel):
    id: int
    buyer_id: int
    product_id: int
    total_amount: float
    platform_fee: float
    net_amount: float
    escrow_status: str
    order_status: str

    class Config:
        from_attributes = True

class ReviewCreate(BaseModel):
    order_id: int
    rating: int # 1-5
    comment: str

class ReviewOut(BaseModel):
    id: int
    rating: int
    comment: str
    reviewer_id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str
