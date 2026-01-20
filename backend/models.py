from sqlalchemy import Column, Integer, String, Float, DateTime, Text, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String)  # buyer, seller, carrier, admin
    kyc_status = Column(String, default="pending")  # pending, verified, rejected
    reputation_score = Column(Float, default=50.0)  # 0-100
    tier = Column(String, default="Bronze") # Bronze, Silver, Gold, Platinum
    created_at = Column(DateTime, default=datetime.datetime.utcnow)

class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    seller_id = Column(Integer, ForeignKey("users.id"))
    title = Column(String, index=True)
    description = Column(Text)
    price = Column(Float)
    category = Column(String)
    trust_score = Column(Float)  # Calculado por IA
    status = Column(String, default="active")  # active, sold, inactive
    images = Column(Text)  # JSON string de URLs

class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    buyer_id = Column(Integer, ForeignKey("users.id"))
    product_id = Column(Integer, ForeignKey("products.id"))
    seller_id = Column(Integer)
    carrier_id = Column(Integer, ForeignKey("users.id"))
    total_amount = Column(Float) # Lo que paga el comprador
    platform_fee = Column(Float, default=0.0) # 5% revenue
    net_amount = Column(Float, default=0.0) # Lo que recibe el vendedor
    escrow_status = Column(String, default="held")  # held, released_to_seller, released_to_buyer
    order_status = Column(String, default="pending")  # pending, shipped, delivered, completed, disputed
    tracking_code = Column(String)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    completed_at = Column(DateTime)

class Review(Base):
    __tablename__ = "reviews"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"))
    reviewer_id = Column(Integer, ForeignKey("users.id"))
    reviewee_id = Column(Integer, ForeignKey("users.id"))
    rating = Column(Integer)  # 1-5
    comment = Column(Text)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"))
    action = Column(String)
    ip_address = Column(String)
    timestamp = Column(DateTime, default=datetime.datetime.utcnow)
