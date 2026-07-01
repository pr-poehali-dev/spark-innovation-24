CREATE TABLE t_p54514658_spark_innovation_24.users (
  id SERIAL PRIMARY KEY,
  nick VARCHAR(30) NOT NULL UNIQUE,
  password_hash VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE t_p54514658_spark_innovation_24.friendships (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES t_p54514658_spark_innovation_24.users(id),
  to_user_id INTEGER NOT NULL REFERENCES t_p54514658_spark_innovation_24.users(id),
  status VARCHAR(10) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(from_user_id, to_user_id)
);

CREATE TABLE t_p54514658_spark_innovation_24.dm_messages (
  id SERIAL PRIMARY KEY,
  from_user_id INTEGER NOT NULL REFERENCES t_p54514658_spark_innovation_24.users(id),
  to_user_id INTEGER NOT NULL REFERENCES t_p54514658_spark_innovation_24.users(id),
  text TEXT,
  image_url TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);