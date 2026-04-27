CREATE TABLE IF NOT EXISTS admins (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS players (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) NOT NULL UNIQUE,
    email VARCHAR(255),
    level INTEGER DEFAULT 1,
    experience BIGINT DEFAULT 0,
    health INTEGER DEFAULT 100,
    gold BIGINT DEFAULT 0,
    diamonds INTEGER DEFAULT 0,
    kills INTEGER DEFAULT 0,
    deaths INTEGER DEFAULT 0,
    is_banned BOOLEAN DEFAULT FALSE,
    ban_reason VARCHAR(500),
    last_server VARCHAR(100),
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS servers (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INTEGER NOT NULL,
    region VARCHAR(50),
    max_players INTEGER DEFAULT 100,
    current_players INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'offline',
    map_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS items (
    id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    category VARCHAR(100),
    rarity VARCHAR(50) DEFAULT 'common',
    description TEXT,
    damage INTEGER DEFAULT 0,
    defense INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS player_inventory (
    id SERIAL PRIMARY KEY,
    player_id INTEGER REFERENCES players(id),
    item_id INTEGER REFERENCES items(id),
    quantity INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS action_logs (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    action_type VARCHAR(100) NOT NULL,
    target_type VARCHAR(50),
    target_id INTEGER,
    description TEXT,
    ip_address VARCHAR(50),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS admin_sessions (
    id SERIAL PRIMARY KEY,
    admin_id INTEGER REFERENCES admins(id),
    token VARCHAR(255) NOT NULL UNIQUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);
