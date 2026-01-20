from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import jwt
import bcrypt
import os
from databases import Database

app = FastAPI(title="Auth Service")
security = HTTPBearer()
database = Database("postgresql://postgres:password@localhost:5432/trustflow")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str  # buyer, seller, carrier

class UserLogin(BaseModel):
    email: EmailStr
    password: str

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

@app.post("/register")
async def register(user: UserCreate):
    # Verificar si el usuario ya existe
    query = "SELECT id FROM users WHERE email = :email"
    existing = await database.fetch_one(query, {"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_pw = hash_password(user.password)
    query = """INSERT INTO users (email, hashed_password, role, kyc_status, reputation_score, created_at)
               VALUES (:email, :hashed_password, :role, 'pending', 50.0, NOW()) RETURNING id"""
    user_id = await database.execute(query, {"email": user.email, "hashed_password": hashed_pw, "role": user.role})
    return {"user_id": user_id, "message": "User registered. KYC pending."}

@app.post("/login")
async def login(credentials: UserLogin):
    query = "SELECT id, email, hashed_password, role FROM users WHERE email = :email"
    user = await database.fetch_one(query, {"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    access_token = create_access_token(data={"sub": user["email"], "role": user["role"]})
    return {"access_token": access_token, "token_type": "bearer"}

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.get("/me")
async def read_users_me(current_user: str = Depends(get_current_user)):
    return {"email": current_user}