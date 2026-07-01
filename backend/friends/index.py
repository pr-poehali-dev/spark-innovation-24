import json
import os
import psycopg2

SCHEMA = 't_p54514658_spark_innovation_24'
CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def parse_body(event):
    raw = event.get('body') or '{}'
    b = json.loads(raw) if isinstance(raw, str) else raw
    return json.loads(b) if isinstance(b, str) else b

def handler(event: dict, context) -> dict:
    """Друзья: action=list|add|accept|decline"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    conn = get_conn()
    cur = conn.cursor()

    if action == 'list' and method == 'GET':
        user_id = int(params.get('user_id', 0))
        cur.execute(f"""
            SELECT u.id, u.nick, f.status, f.from_user_id
            FROM {SCHEMA}.friendships f
            JOIN {SCHEMA}.users u ON (
                CASE WHEN f.from_user_id = %s THEN f.to_user_id ELSE f.from_user_id END = u.id
            )
            WHERE (f.from_user_id = %s OR f.to_user_id = %s) AND f.status IN ('accepted', 'pending')
        """, (user_id, user_id, user_id))
        rows = cur.fetchall()
        conn.close()
        result = [{'user_id': r[0], 'nick': r[1], 'status': r[2], 'incoming': r[2] == 'pending' and r[3] != user_id} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(result, ensure_ascii=False)}

    if action == 'add' and method == 'POST':
        body = parse_body(event)
        from_id = int(body.get('from_user_id', 0))
        to_id = int(body.get('to_user_id', 0))
        if from_id == to_id:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'cannot add yourself'})}
        cur.execute(
            f"SELECT id, status FROM {SCHEMA}.friendships WHERE (from_user_id=%s AND to_user_id=%s) OR (from_user_id=%s AND to_user_id=%s)",
            (from_id, to_id, to_id, from_id)
        )
        existing = cur.fetchone()
        if existing:
            conn.close()
            return {'statusCode': 409, 'headers': CORS, 'body': json.dumps({'error': 'already_exists', 'status': existing[1]})}
        cur.execute(
            f"INSERT INTO {SCHEMA}.friendships (from_user_id, to_user_id, status) VALUES (%s, %s, 'pending') RETURNING id",
            (from_id, to_id)
        )
        fid = cur.fetchone()[0]
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': fid, 'status': 'pending'})}

    if action == 'accept' and method == 'POST':
        body = parse_body(event)
        from_id = int(body.get('from_user_id', 0))
        to_id = int(body.get('to_user_id', 0))
        cur.execute(
            f"UPDATE {SCHEMA}.friendships SET status='accepted' WHERE from_user_id=%s AND to_user_id=%s AND status='pending'",
            (from_id, to_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'status': 'accepted'})}

    if action == 'decline' and method == 'POST':
        body = parse_body(event)
        from_id = int(body.get('from_user_id', 0))
        to_id = int(body.get('to_user_id', 0))
        cur.execute(
            f"UPDATE {SCHEMA}.friendships SET status='declined' WHERE from_user_id=%s AND to_user_id=%s",
            (from_id, to_id)
        )
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'status': 'declined'})}

    conn.close()
    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}
