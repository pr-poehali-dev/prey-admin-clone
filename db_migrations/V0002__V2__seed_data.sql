INSERT INTO admins (username, password_hash, role) VALUES
('admin', '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj/RK.s5uOAe', 'superadmin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO players (username, email, level, experience, health, gold, diamonds, kills, deaths, last_server, last_login) VALUES
('SurvivorX', 'survivorx@mail.com', 45, 125000, 100, 50000, 120, 342, 89, 'Server-1', NOW() - INTERVAL '2 hours'),
('ZombieKiller', 'zk@mail.com', 32, 78000, 85, 22000, 45, 210, 156, 'Server-2', NOW() - INTERVAL '5 hours'),
('PreyHunter', 'ph@mail.com', 67, 320000, 100, 150000, 350, 890, 210, 'Server-1', NOW() - INTERVAL '30 minutes'),
('DarkRaider', 'dr@mail.com', 18, 25000, 60, 8000, 10, 45, 78, 'Server-3', NOW() - INTERVAL '1 day'),
('AlphaWolf', 'aw@mail.com', 55, 200000, 100, 80000, 200, 560, 145, 'Server-2', NOW() - INTERVAL '3 hours')
ON CONFLICT (username) DO NOTHING;

INSERT INTO servers (name, host, port, region, max_players, current_players, status, map_name) VALUES
('Server-1', '192.168.1.10', 7777, 'EU', 100, 67, 'online', 'City of Dead'),
('Server-2', '192.168.1.11', 7777, 'EU', 100, 45, 'online', 'Forest Zone'),
('Server-3', '192.168.1.12', 7777, 'US', 100, 0, 'offline', 'Desert Wasteland'),
('Server-4', '192.168.1.13', 7777, 'AS', 100, 12, 'online', 'Harbor Ruins');

INSERT INTO items (name, category, rarity, description, damage, defense) VALUES
('AK-47', 'weapon', 'rare', 'Штурмовая винтовка', 75, 0),
('Shotgun', 'weapon', 'uncommon', 'Дробовик, ближний бой', 90, 0),
('Kevlar Vest', 'armor', 'rare', 'Бронежилет', 0, 50),
('Medkit', 'consumable', 'common', 'Восстанавливает 50 HP', 0, 0),
('Bandage', 'consumable', 'common', 'Восстанавливает 20 HP', 0, 0),
('Night Vision', 'equipment', 'epic', 'Ночное видение', 0, 0),
('Grenade', 'weapon', 'uncommon', 'Взрывчатка', 120, 0),
('Hunting Knife', 'weapon', 'common', 'Нож для ближнего боя', 35, 0);
