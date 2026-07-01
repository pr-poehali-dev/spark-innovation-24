CREATE TABLE t_p54514658_spark_innovation_24.comments (
  id SERIAL PRIMARY KEY,
  author VARCHAR(50) NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);