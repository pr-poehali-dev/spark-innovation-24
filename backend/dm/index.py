import json
import os
import uuid
import base64
import psycopg2
import boto3

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

def s3():
    return boto3.client('s3', endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'])

def handler(event: dict, context) -> dict:
    """Личные сообщения: action=history|unread|send"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')
    conn = get_conn()
    cur = conn.cursor()

    if action == 'history' and method == 'GET':
        uid1 = int(params.get('from_user_id', 0))
        uid2 = int(params.get('to_user_id', 0))
        cur.execute(f"""
            SELECT id, from_user_id, to_user_id, text, image_url, is_read, created_at
            FROM {SCHEMA}.dm_messages
            WHERE (from_user_id=%s AND to_user_id=%s) OR (from_user_id=%s AND to_user_id=%s)
            ORDER BY created_at ASC LIMIT 200
        """, (uid1, uid2, uid2, uid1))
        rows = cur.fetchall()
        cur.execute(f"""
            UPDATE {SCHEMA}.dm_messages SET is_read=TRUE
            WHERE to_user_id=%s AND from_user_id=%s AND is_read=FALSE
        """, (uid1, uid2))
        conn.commit()
        conn.close()
        msgs = [{'id': r[0], 'from_user_id': r[1], 'to_user_id': r[2], 'text': r[3], 'image_url': r[4], 'is_read': r[5], 'created_at': r[6].isoformat()} for r in rows]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(msgs, ensure_ascii=False)}

    if action == 'unread' and method == 'GET':
        user_id = int(params.get('user_id', 0))
        cur.execute(f"""
            SELECT from_user_id, COUNT(*) FROM {SCHEMA}.dm_messages
            WHERE to_user_id=%s AND is_read=FALSE GROUP BY from_user_id
        """, (user_id,))
        rows = cur.fetchall()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({str(r[0]): r[1] for r in rows})}

    if action == 'send' and method == 'POST':
        body = parse_body(event)
        from_id = int(body.get('from_user_id', 0))
        to_id = int(body.get('to_user_id', 0))
        text = (body.get('text') or '').strip()[:1000]
        image_b64 = body.get('image')
        image_url = None

        if not from_id or not to_id:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'ids required'})}
        if not text and not image_b64:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'text or image required'})}

        if image_b64:
            if ',' in image_b64:
                header, data = image_b64.split(',', 1)
                ext = 'png' if 'png' in header else ('gif' if 'gif' in header else 'jpg')
            else:
                data, ext = image_b64, 'jpg'
            key = f'dm/{uuid.uuid4()}.{ext}'
            s3().put_object(Bucket='files', Key=key, Body=base64.b64decode(data), ContentType=f'image/{ext}')
            image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        cur.execute(
            f"INSERT INTO {SCHEMA}.dm_messages (from_user_id, to_user_id, text, image_url) VALUES (%s, %s, %s, %s) RETURNING id, created_at",
            (from_id, to_id, text or None, image_url)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps({'id': row[0], 'from_user_id': from_id, 'to_user_id': to_id, 'text': text or None, 'image_url': image_url, 'created_at': row[1].isoformat()}, ensure_ascii=False)}

    conn.close()
    return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'unknown action'})}
