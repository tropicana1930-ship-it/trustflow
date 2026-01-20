import redis
import os

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")

try:
    redis_conn = redis.from_url(REDIS_URL)
except Exception as e:
    print(f"Warning: Could not connect to Redis: {e}")
    redis_conn = None
