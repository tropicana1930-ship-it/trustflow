-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    hashed_password VARCHAR(255) NOT NULL,
    role VARCHAR(50),
    kyc_status VARCHAR(50) DEFAULT 'pending',
    reputation_score FLOAT DEFAULT 50.0,
    tier VARCHAR(50) DEFAULT 'Bronze',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
    id SERIAL PRIMARY KEY,
    seller_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    price FLOAT,
    category VARCHAR(100),
    trust_score FLOAT,
    status VARCHAR(50) DEFAULT 'active',
    images TEXT
);

-- Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id SERIAL PRIMARY KEY,
    buyer_id INTEGER REFERENCES users(id),
    product_id INTEGER REFERENCES products(id),
    seller_id INTEGER REFERENCES users(id),
    carrier_id INTEGER REFERENCES users(id),
    total_amount FLOAT,
    platform_fee FLOAT DEFAULT 0.0,
    net_amount FLOAT DEFAULT 0.0,
    escrow_status VARCHAR(50) DEFAULT 'held',
    order_status VARCHAR(50) DEFAULT 'pending',
    tracking_code VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    order_id INTEGER REFERENCES orders(id),
    reviewer_id INTEGER REFERENCES users(id),
    reviewee_id INTEGER REFERENCES users(id),
    rating INTEGER,
    comment TEXT
);

-- Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    action VARCHAR(255),
    ip_address VARCHAR(50),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
