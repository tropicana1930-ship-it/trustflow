from fastapi import FastAPI, Depends, HTTPException
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel
from databases import Database
import os
import jwt
# import aio_pika # Commented out as it requires RabbitMQ infrastructure

app = FastAPI(title="Orders Service")
security = HTTPBearer()
database = Database("postgresql://postgres:password@localhost:5432/trustflow")

SECRET_KEY = os.getenv("SECRET_KEY", "your-secret-key-change-in-production")
ALGORITHM = "HS256"

class OrderCreate(BaseModel):
    product_id: str
    buyer_id: str
    carrier_id: str

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
        return email
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")

@app.on_event("startup")
async def startup():
    await database.connect()

@app.on_event("shutdown")
async def shutdown():
    await database.disconnect()

@app.post("/orders")
async def create_order(order: OrderCreate, current_user: str = Depends(get_current_user)):
    # 1. Obtener detalles del producto y vendedor
    product_query = "SELECT seller_id, price FROM products WHERE id = :product_id"
    product = await database.fetch_one(product_query, {"product_id": order.product_id})
    
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # 2. Crear orden con estado 'pending' y fondos en escrow (simulado)
    order_query = """
        INSERT INTO orders (buyer_id, product_id, seller_id, carrier_id, total_amount, escrow_status, order_status, created_at)
        VALUES (:buyer_id, :product_id, :seller_id, :carrier_id, :total_amount, 'held', 'pending', NOW())
        RETURNING id
    """
    order_id = await database.execute(order_query, {
        "buyer_id": order.buyer_id,
        "product_id": order.product_id,
        "seller_id": product["seller_id"],
        "carrier_id": order.carrier_id,
        "total_amount": product["price"]
    })
    
    # 3. Publicar evento para análisis de fraude (Simulado)
    # connection = await aio_pika.connect_robust("amqp://guest:guest@localhost/")
    # channel = await connection.channel()
    # await channel.default_exchange.publish(
    #     aio_pika.Message(body=f"order_created:{order_id}".encode()),
    #     routing_key="order_events"
    # )
    # await connection.close()
    
    return {"order_id": order_id, "escrow_status": "held", "message": "Order created. Funds in escrow."}

@app.post("/orders/{order_id}/confirm-delivery")
async def confirm_delivery(order_id: int, current_user: str = Depends(get_current_user)):
    # Lógica para que el comprador confirme la recepción
    # Libera el escrow al vendedor
    
    # Verificar que el usuario sea el comprador de la orden (Simificado)
    # query_check = "SELECT buyer_id FROM orders WHERE id = :order_id" ...
    
    update_query = """
        UPDATE orders 
        SET escrow_status = 'released_to_seller', 
            order_status = 'completed',
            completed_at = NOW()
        WHERE id = :order_id
    """
    await database.execute(update_query, {"order_id": order_id})
    return {"message": "Delivery confirmed. Funds released to seller."}