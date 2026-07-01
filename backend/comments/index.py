import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
}

def handler(event: dict, context) -> dict:
    """Получение и добавление комментариев для чата сервера РП СТРАН."""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    conn = psycopg2.connect(os.environ['DATABASE_URL'])
    cur = conn.cursor()
    method = event.get('httpMethod', 'GET')

    if method == 'GET':
        cur.execute(
            "SELECT id, author, text, created_at FROM t_p54514658_spark_innovation_24.comments ORDER BY created_at DESC LIMIT 50"
        )
        rows = cur.fetchall()
        comments = [
            {'id': r[0], 'author': r[1], 'text': r[2], 'created_at': r[3].isoformat()}
            for r in rows
        ]
        conn.close()
        return {'statusCode': 200, 'headers': CORS, 'body': json.dumps(comments, ensure_ascii=False)}

    if method == 'POST':
        body = json.loads(event.get('body') or '{}')
        author = (body.get('author') or '').strip()[:50]
        text = (body.get('text') or '').strip()[:500]
        if not author or not text:
            conn.close()
            return {'statusCode': 400, 'headers': CORS, 'body': json.dumps({'error': 'author and text required'})}
        cur.execute(
            "INSERT INTO t_p54514658_spark_innovation_24.comments (author, text) VALUES (%s, %s) RETURNING id, created_at",
            (author, text)
        )
        row = cur.fetchone()
        conn.commit()
        conn.close()
        return {
            'statusCode': 200,
            'headers': CORS,
            'body': json.dumps({'id': row[0], 'author': author, 'text': text, 'created_at': row[1].isoformat()}, ensure_ascii=False)
        }

    conn.close()
    return {'statusCode': 405, 'headers': CORS, 'body': ''}
