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

def s3_client():
    return boto3.client(
        's3',
        endpoint_url='https://bucket.poehali.dev',
        aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
        aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY'],
    )

def handler(event: dict, context) -> dict:
    """Чат игроков: получение и отправка сообщений с фото."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, author, text, image_url, created_at FROM {SCHEMA}.chat_messages ORDER BY created_at DESC LIMIT 100"
        )
        rows = cur.fetchall()
        conn.close()
        messages = [
            {'id': r[0], 'author': r[1], 'text': r[2], 'image_url': r[3], 'created_at': r[4].isoformat()}
            for r in rows
        ]
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(messages, ensure_ascii=False)}

    if method == 'POST':
        raw = event.get('body') or '{}'
        body = json.loads(raw) if isinstance(raw, str) else raw
        if isinstance(body, str):
            body = json.loads(body)
        author = (body.get('author') or '').strip()[:50]
        text = (body.get('text') or '').strip()[:1000]
        image_b64 = body.get('image')
        image_url = None

        if not author:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'author required'})}
        if not text and not image_b64:
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'text or image required'})}

        if image_b64:
            # Определяем тип файла из data URI
            if ',' in image_b64:
                header, data = image_b64.split(',', 1)
                ext = 'jpg'
                if 'png' in header:
                    ext = 'png'
                elif 'gif' in header:
                    ext = 'gif'
                elif 'webp' in header:
                    ext = 'webp'
                content_type = f'image/{ext}'
            else:
                data = image_b64
                ext = 'jpg'
                content_type = 'image/jpeg'

            file_data = base64.b64decode(data)
            key = f'chat/{uuid.uuid4()}.{ext}'
            s3 = s3_client()
            s3.put_object(Bucket='files', Key=key, Body=file_data, ContentType=content_type)
            image_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            f"INSERT INTO {SCHEMA}.chat_messages (author, text, image_url) VALUES (%s, %s, %s) RETURNING id, created_at",
            (author, text or None, image_url)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()

        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({
                'id': row[0],
                'author': author,
                'text': text or None,
                'image_url': image_url,
                'created_at': row[1].isoformat()
            }, ensure_ascii=False)
        }

    return {'statusCode': 405, 'headers': CORS, 'body': ''}