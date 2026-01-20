from fastapi import FastAPI, Depends, HTTPException, status, Request
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from sqlalchemy import or_
from typing import List, Optional
import models
import schemas
import auth
import ai_utils
from datetime import datetime
from database import engine, get_db

# --- Rate Limiting Setup (Fase 6.1) ---
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded

limiter = Limiter(key_func=get_remote_address)

# Create tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="TrustFlow Monolith API")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configurar CORS
origins = [
    "http://localhost:5173",
    "http://localhost:3000",
    "http://127.0.0.1:5173",
    "https://trustflow-app.vercel.app" # Example production domain
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev/demo, restrict in strict production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- Helper: Auditoría (Fase 6.3) ---
def log_audit_action(db: Session, user_id: int, action: str, ip_address: str):
    """Registra acciones sensibles en la base de datos."""
    audit = models.AuditLog(
        user_id=user_id,
        action=action,
        ip_address=ip_address,
        timestamp=datetime.utcnow()
    )
    db.add(audit)
    db.commit()

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudieron validar las credenciales",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
    except auth.JWTError:
        raise credentials_exception
        
    user = db.query(models.User).filter(models.User.email == email).first()
    if user is None:
        raise credentials_exception
    return user

@app.post("/register", response_model=schemas.UserOut)
@limiter.limit("5/minute") # Rate Limiting
def register(request: Request, user: schemas.UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="El correo electrónico ya está registrado")
    
    hashed_password = auth.get_password_hash(user.password)
    new_user = models.User(
        email=user.email,
        hashed_password=hashed_password,
        role=user.role,
        kyc_status="pending",
        tier="Bronze" # Default tier
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    
    log_audit_action(db, new_user.id, "USER_REGISTER", request.client.host)
    
    return new_user

@app.post("/token", response_model=schemas.Token)
@limiter.limit("10/minute") # Rate Limiting
def login_for_access_token(request: Request, form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario o contraseña incorrectos",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    log_audit_action(db, user.id, "USER_LOGIN", request.client.host)
    
    access_token_expires = auth.timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email, "role": user.role}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/users/me", response_model=schemas.UserOut)
def read_users_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@app.post("/users/upgrade", response_model=schemas.UserOut)
def upgrade_subscription(request: Request, upgrade: schemas.UserUpgrade, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Simula el pago y actualización de membresía."""
    if upgrade.tier not in ["Bronze", "Silver", "Gold", "Platinum"]:
        raise HTTPException(status_code=400, detail="Nivel de suscripción inválido")
    
    current_user.tier = upgrade.tier
    db.commit()
    db.refresh(current_user)
    
    log_audit_action(db, current_user.id, f"USER_UPGRADE_{upgrade.tier.upper()}", request.client.host)
    return current_user

@app.get("/users/carriers", response_model=List[schemas.UserOut])
def get_carriers(db: Session = Depends(get_db)):
    return db.query(models.User).filter(models.User.role == "carrier").all()

@app.post("/analyze", response_model=schemas.ProductAnalysisResponse)
def analyze_product(request: schemas.ProductAnalysisRequest, current_user: models.User = Depends(get_current_user)):
    """Endpoint para analizar productos con IA (Llamada Real al Backend)"""
    result = ai_utils.calculate_trust_score(
        title=request.title, 
        description=request.description, 
        price=request.price,
        seller_reputation=current_user.reputation_score
    )
    return result

@app.post("/products", response_model=schemas.ProductOut)
def create_product(product: schemas.ProductCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "seller":
        raise HTTPException(status_code=403, detail="Solo los vendedores pueden publicar productos")
    
    # Run analysis one more time or trust incoming (in prod, re-run analysis here for safety)
    ai_result = ai_utils.calculate_trust_score(product.title, product.description, current_user.reputation_score, product.price)
    trust_score = ai_result.get('trust_score', 50)
    
    new_product = models.Product(
        title=product.title,
        description=product.description,
        price=product.price,
        category=product.category,
        seller_id=current_user.id,
        trust_score=trust_score,
        images=product.images or "[]"
    )
    db.add(new_product)
    db.commit()
    db.refresh(new_product)
    return new_product

@app.get("/products", response_model=List[schemas.ProductOut])
def get_products(skip: int = 0, limit: int = 100, q: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(models.Product).filter(models.Product.status == "active")
    if q:
        search = f"%{q}%"
        query = query.filter(or_(models.Product.title.ilike(search), models.Product.description.ilike(search)))
    return query.offset(skip).limit(limit).all()

@app.post("/orders", response_model=schemas.OrderOut)
def create_order(request: Request, order: schemas.OrderCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    product = db.query(models.Product).filter(models.Product.id == order.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
        
    # --- Monetización Fase 9.2: Comisión del 5% ---
    PLATFORM_FEE_PERCENTAGE = 0.05
    platform_fee = product.price * PLATFORM_FEE_PERCENTAGE
    net_amount = product.price - platform_fee

    # --- Fase 6.2: Detección de Fraude ---
    fraud_probability = ai_utils.detect_fraud_probability(product.price, request.client.host)
    
    seller = db.query(models.User).filter(models.User.id == product.seller_id).first()
    
    order_status = "pending"
    escrow_status = "held"
    
    # Regla estricta: Si es mucha plata o fraude probable, revisión manual.
    if fraud_probability > 0.7 or (product.price > 5000 and seller.reputation_score < 40):
        order_status = "manual_review" 
        escrow_status = "frozen" 
    
    new_order = models.Order(
        buyer_id=current_user.id,
        product_id=order.product_id,
        seller_id=product.seller_id,
        carrier_id=order.carrier_id,
        total_amount=product.price,
        platform_fee=platform_fee,  # Guardamos la comisión
        net_amount=net_amount,      # Guardamos el neto al vendedor
        escrow_status=escrow_status,
        order_status=order_status
    )
    db.add(new_order)
    db.commit()
    db.refresh(new_order)
    
    log_audit_action(db, current_user.id, f"ORDER_CREATE_STATUS_{order_status.upper()}", request.client.host)

    return new_order

@app.post("/orders/{order_id}/confirm", response_model=schemas.OrderOut)
def confirm_delivery(request: Request, order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
    
    if current_user.id != order.buyer_id and current_user.id != order.carrier_id:
        raise HTTPException(status_code=403, detail="No autorizado para confirmar esta orden")

    order.order_status = "delivered"
    order.escrow_status = "released_to_seller"
    order.completed_at = datetime.utcnow()
    
    db.commit()
    db.refresh(order)
    
    log_audit_action(db, current_user.id, "ORDER_CONFIRM_DELIVERY", request.client.host)
    return order

@app.post("/orders/{order_id}/dispute", response_model=schemas.OrderOut)
def raise_dispute(request: Request, order_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")

    if current_user.id != order.buyer_id:
        raise HTTPException(status_code=403, detail="Solo los compradores pueden abrir disputas")

    if order.order_status == "completed":
        raise HTTPException(status_code=400, detail="No se puede disputar una orden completada")

    order.order_status = "disputed"
    order.escrow_status = "disputed" 
    
    db.commit()
    db.refresh(order)
    
    log_audit_action(db, current_user.id, "ORDER_DISPUTE", request.client.host)
    return order

@app.post("/reviews", response_model=schemas.ReviewOut)
def create_review(review: schemas.ReviewCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    order = db.query(models.Order).filter(models.Order.id == review.order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Orden no encontrada")
        
    if current_user.id != order.buyer_id:
        raise HTTPException(status_code=403, detail="Solo el comprador puede dejar una reseña")
        
    new_review = models.Review(
        order_id=review.order_id,
        reviewer_id=current_user.id,
        reviewee_id=order.seller_id,
        rating=review.rating,
        comment=review.comment
    )
    db.add(new_review)
    
    seller = db.query(models.User).filter(models.User.id == order.seller_id).first()
    if seller:
        seller_reviews = db.query(models.Review).filter(models.Review.reviewee_id == seller.id).all()
        total_score = sum(r.rating for r in seller_reviews) + review.rating
        count = len(seller_reviews) + 1
        average_rating = total_score / count
        seller.reputation_score = average_rating * 20 
        
    db.commit()
    db.refresh(new_review)
    return new_review