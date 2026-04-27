import json
import os
import psycopg2

SCHEMA = "t_p28053808_prey_admin_clone"

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def check_auth(event, cur):
    token = event.get("headers", {}).get("X-Auth-Token", "")
    if not token:
        return None
    cur.execute(f"SELECT admin_id FROM {SCHEMA}.admin_sessions WHERE token = %s AND expires_at > NOW()", (token,))
    row = cur.fetchone()
    return row[0] if row else None

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token"
}

def handle_dashboard(cur):
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.players")
    total_players = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.players WHERE is_banned = TRUE")
    banned_players = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.players WHERE last_login > NOW() - INTERVAL '24 hours'")
    active_today = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*), COALESCE(SUM(current_players),0) FROM {SCHEMA}.servers WHERE status = 'online'")
    srv = cur.fetchone()
    online_servers = srv[0] or 0
    players_online = int(srv[1] or 0)
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.servers")
    total_servers = cur.fetchone()[0]
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.items WHERE is_active = TRUE")
    total_items = cur.fetchone()[0]
    cur.execute(f"SELECT username, level, kills, deaths, gold FROM {SCHEMA}.players WHERE is_banned=FALSE ORDER BY kills DESC LIMIT 5")
    top_players = [{"username": r[0], "level": r[1], "kills": r[2], "deaths": r[3], "gold": r[4]} for r in cur.fetchall()]
    cur.execute(f"""
        SELECT l.action_type, l.description, l.created_at, a.username
        FROM {SCHEMA}.action_logs l LEFT JOIN {SCHEMA}.admins a ON a.id=l.admin_id
        ORDER BY l.created_at DESC LIMIT 10
    """)
    logs = [{"action": r[0], "description": r[1], "created_at": r[2].isoformat() if r[2] else None, "admin": r[3]} for r in cur.fetchall()]
    cur.execute(f"SELECT name, status, current_players, max_players, region, map_name FROM {SCHEMA}.servers ORDER BY name")
    servers = [{"name": r[0], "status": r[1], "current": r[2], "max": r[3], "region": r[4], "map": r[5]} for r in cur.fetchall()]
    return {"stats": {"total_players": total_players, "banned_players": banned_players, "active_today": active_today,
                      "players_online": players_online, "online_servers": online_servers,
                      "total_servers": total_servers, "total_items": total_items},
            "top_players": top_players, "recent_logs": logs, "servers": servers}

def handle_players_get(cur, params):
    search = params.get("search", "")
    page = int(params.get("page", 1))
    limit = int(params.get("limit", 20))
    offset = (page - 1) * limit
    banned = params.get("banned", "")
    where = "WHERE 1=1"; args = []
    if search:
        where += " AND (username ILIKE %s OR email ILIKE %s)"; args += [f"%{search}%", f"%{search}%"]
    if banned == "true":
        where += " AND is_banned=TRUE"
    elif banned == "false":
        where += " AND is_banned=FALSE"
    cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.players {where}", args)
    total = cur.fetchone()[0]
    cur.execute(f"""SELECT id,username,email,level,experience,health,gold,diamonds,kills,deaths,
        is_banned,ban_reason,last_server,last_login,created_at FROM {SCHEMA}.players {where}
        ORDER BY created_at DESC LIMIT %s OFFSET %s""", args + [limit, offset])
    cols = ["id","username","email","level","experience","health","gold","diamonds","kills","deaths","is_banned","ban_reason","last_server","last_login","created_at"]
    players = []
    for row in cur.fetchall():
        p = dict(zip(cols, row))
        for k in ["last_login","created_at"]:
            if p[k]: p[k] = p[k].isoformat()
        players.append(p)
    return {"players": players, "total": total, "page": page, "limit": limit}

def handler(event: dict, context) -> dict:
    """Главный API: дашборд, игроки, серверы, предметы, логи"""
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    conn = get_conn()
    cur = conn.cursor()
    admin_id = check_auth(event, cur)
    if not admin_id:
        cur.close(); conn.close()
        return {"statusCode": 401, "headers": CORS, "body": json.dumps({"error": "Не авторизован"})}

    method = event.get("httpMethod")
    params = event.get("queryStringParameters") or {}
    section = params.get("section", "dashboard")

    try:
        if section == "dashboard":
            data = handle_dashboard(cur)
            cur.close(); conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps(data)}

        if section == "players":
            if method == "GET":
                data = handle_players_get(cur, params)
                cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps(data)}
            if method == "PUT":
                body = json.loads(event.get("body") or "{}")
                player_id = body.get("id")
                action = body.get("action")
                if action == "ban":
                    reason = body.get("ban_reason", "Нарушение правил")
                    cur.execute(f"UPDATE {SCHEMA}.players SET is_banned=TRUE, ban_reason=%s, updated_at=NOW() WHERE id=%s", (reason, player_id))
                    cur.execute(f"INSERT INTO {SCHEMA}.action_logs (admin_id,action_type,target_type,target_id,description) VALUES (%s,'ban','player',%s,%s)", (admin_id, player_id, f"Бан игрока #{player_id}: {reason}"))
                elif action == "unban":
                    cur.execute(f"UPDATE {SCHEMA}.players SET is_banned=FALSE, ban_reason=NULL, updated_at=NOW() WHERE id=%s", (player_id,))
                    cur.execute(f"INSERT INTO {SCHEMA}.action_logs (admin_id,action_type,target_type,target_id,description) VALUES (%s,'unban','player',%s,%s)", (admin_id, player_id, f"Разбан игрока #{player_id}"))
                else:
                    fields = {f: body[f] for f in ["level","experience","health","gold","diamonds","kills","deaths","email"] if f in body}
                    if fields:
                        sets = ", ".join([f"{k}=%s" for k in fields])
                        cur.execute(f"UPDATE {SCHEMA}.players SET {sets}, updated_at=NOW() WHERE id=%s", list(fields.values()) + [player_id])
                        cur.execute(f"INSERT INTO {SCHEMA}.action_logs (admin_id,action_type,target_type,target_id,description) VALUES (%s,'edit','player',%s,%s)", (admin_id, player_id, f"Редактирование игрока #{player_id}"))
                conn.commit(); cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

        if section == "servers":
            if method == "GET":
                cur.execute(f"SELECT id,name,host,port,region,max_players,current_players,status,map_name,created_at,updated_at FROM {SCHEMA}.servers ORDER BY name")
                cols = ["id","name","host","port","region","max_players","current_players","status","map_name","created_at","updated_at"]
                servers = []
                for row in cur.fetchall():
                    s = dict(zip(cols, row))
                    for k in ["created_at","updated_at"]:
                        if s[k]: s[k] = s[k].isoformat()
                    servers.append(s)
                cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"servers": servers})}
            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                cur.execute(f"INSERT INTO {SCHEMA}.servers (name,host,port,region,max_players,map_name,status) VALUES (%s,%s,%s,%s,%s,%s,'offline') RETURNING id",
                            (body.get("name"), body.get("host"), body.get("port",7777), body.get("region","EU"), body.get("max_players",100), body.get("map_name","")))
                new_id = cur.fetchone()[0]
                cur.execute(f"INSERT INTO {SCHEMA}.action_logs (admin_id,action_type,target_type,target_id,description) VALUES (%s,'create','server',%s,%s)", (admin_id, new_id, f"Создан сервер: {body.get('name')}"))
                conn.commit(); cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True, "id": new_id})}
            if method == "PUT":
                body = json.loads(event.get("body") or "{}")
                server_id = body.get("id")
                fields = {f: body[f] for f in ["name","host","port","region","max_players","current_players","status","map_name"] if f in body}
                if fields:
                    sets = ", ".join([f"{k}=%s" for k in fields])
                    cur.execute(f"UPDATE {SCHEMA}.servers SET {sets}, updated_at=NOW() WHERE id=%s", list(fields.values()) + [server_id])
                    cur.execute(f"INSERT INTO {SCHEMA}.action_logs (admin_id,action_type,target_type,target_id,description) VALUES (%s,'edit','server',%s,%s)", (admin_id, server_id, f"Редактирование сервера #{server_id}"))
                    conn.commit()
                cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

        if section == "items":
            if method == "GET":
                search = params.get("search", ""); category = params.get("category", "")
                where = "WHERE 1=1"; args = []
                if search:
                    where += " AND name ILIKE %s"; args.append(f"%{search}%")
                if category:
                    where += " AND category=%s"; args.append(category)
                cur.execute(f"SELECT id,name,category,rarity,description,damage,defense,is_active,created_at FROM {SCHEMA}.items {where} ORDER BY category,name", args)
                cols = ["id","name","category","rarity","description","damage","defense","is_active","created_at"]
                items = []
                for row in cur.fetchall():
                    it = dict(zip(cols, row))
                    if it["created_at"]: it["created_at"] = it["created_at"].isoformat()
                    items.append(it)
                cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"items": items})}
            if method == "POST":
                body = json.loads(event.get("body") or "{}")
                cur.execute(f"INSERT INTO {SCHEMA}.items (name,category,rarity,description,damage,defense) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                            (body.get("name"), body.get("category","misc"), body.get("rarity","common"), body.get("description",""), body.get("damage",0), body.get("defense",0)))
                new_id = cur.fetchone()[0]
                cur.execute(f"INSERT INTO {SCHEMA}.action_logs (admin_id,action_type,target_type,target_id,description) VALUES (%s,'create','item',%s,%s)", (admin_id, new_id, f"Создан предмет: {body.get('name')}"))
                conn.commit(); cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True, "id": new_id})}
            if method == "PUT":
                body = json.loads(event.get("body") or "{}")
                item_id = body.get("id")
                fields = {f: body[f] for f in ["name","category","rarity","description","damage","defense","is_active"] if f in body}
                if fields:
                    sets = ", ".join([f"{k}=%s" for k in fields])
                    cur.execute(f"UPDATE {SCHEMA}.items SET {sets} WHERE id=%s", list(fields.values()) + [item_id])
                    cur.execute(f"INSERT INTO {SCHEMA}.action_logs (admin_id,action_type,target_type,target_id,description) VALUES (%s,'edit','item',%s,%s)", (admin_id, item_id, f"Редактирование предмета #{item_id}"))
                    conn.commit()
                cur.close(); conn.close()
                return {"statusCode": 200, "headers": CORS, "body": json.dumps({"success": True})}

        if section == "logs":
            page = int(params.get("page", 1)); limit = int(params.get("limit", 50)); offset = (page-1)*limit
            action_type = params.get("action_type", "")
            where = "WHERE 1=1"; args = []
            if action_type:
                where += " AND l.action_type=%s"; args.append(action_type)
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.action_logs l {where}", args)
            total = cur.fetchone()[0]
            cur.execute(f"""SELECT l.id,l.action_type,l.target_type,l.target_id,l.description,l.ip_address,l.created_at,a.username
                FROM {SCHEMA}.action_logs l LEFT JOIN {SCHEMA}.admins a ON a.id=l.admin_id {where}
                ORDER BY l.created_at DESC LIMIT %s OFFSET %s""", args + [limit, offset])
            cols = ["id","action_type","target_type","target_id","description","ip_address","created_at","admin"]
            logs = []
            for row in cur.fetchall():
                lg = dict(zip(cols, row))
                if lg["created_at"]: lg["created_at"] = lg["created_at"].isoformat()
                logs.append(lg)
            cur.close(); conn.close()
            return {"statusCode": 200, "headers": CORS, "body": json.dumps({"logs": logs, "total": total, "page": page})}

        cur.close(); conn.close()
        return {"statusCode": 404, "headers": CORS, "body": json.dumps({"error": "Section not found"})}

    except Exception as e:
        if not conn.closed:
            cur.close(); conn.close()
        return {"statusCode": 500, "headers": CORS, "body": json.dumps({"error": str(e)})}
