import json
import os
import hashlib
import secrets
import psycopg2

SCHEMA = 't_p54514658_spark_innovation_24'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(p: str) -> str:
    return hashlib.sha256(p.encode()).hexdigest()

def parse_body(event):
    raw = event.get('body') or '{}'
    b = json.loads(raw) if isinstance(raw, str) else raw
    return json.loads(b) if isinstance(b, str) else b

def handler(event: dict, context) -> dict:
    """Авторизация: action=register|login|search|me"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    if action == 'register' and method == 'POST':
        body = parse_body(event)
        nick = (body.get('nick') or '').strip()[:30]
        password = (body.get('password') or '').strip()
        if not nick or not password:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'nick and password required'})}
        if len(password) < 4:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'password_short'})}
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE nick = %s", (nick,))
        if cur.fetchone():
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'nick_taken'})}
        cur.execute(
            f"INSERT INTO {SCHEMA}.users (nick, password_hash) VALUES (%s, %s) RETURNING id",
            (nick, hash_password(password))
        )
        user_id = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user_id': user_id, 'nick': nick, 'token': secrets.token_hex(32)})}

    if action == 'login' and method == 'POST':
        body = parse_body(event)
        nick = (body.get('nick') or '').strip()
        password = (body.get('password') or '').strip()
        cur.execute(f"SELECT id FROM {SCHEMA}.users WHERE nick = %s AND password_hash = %s", (nick, hash_password(password)))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 401, 'headers': CORS, 'body': json.dumps({'error': 'wrong nick or password'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user_id': row[0], 'nick': nick, 'token': secrets.token_hex(32)})}

    if action == 'search' and method == 'GET':
        q = (params.get('nick') or '').strip()
        if not q:
            conn.close()
            return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([])}
        cur.execute(f"SELECT id, nick FROM {SCHEMA}.users WHERE nick ILIKE %s LIMIT 10", (f'%{q}%',))
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps([{'user_id': r[0], 'nick': r[1]} for r in rows])}

    if action == 'me' and method == 'GET':
        uid = params.get('user_id')
        if not uid:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'user_id required'})}
        cur.execute(f"SELECT id, nick FROM {SCHEMA}.users WHERE id = %s", (int(uid),))
        row = cur.fetchone()
        conn.close()
        if not row:
            return {'statusCode': 404, 'headers': CORS, 'body': json.dumps({'error': 'not found'})}
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'user_id': row[0], 'nick': row[1]})}

    conn.close()
    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}
