CREATE TABLE t_p54514658_spark_innovation_24.chat_messages (
  id SERIAL PRIMARY KEY,
  author VARCHAR(50) NOT NULL,
  text TEXT,
  image_url TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);