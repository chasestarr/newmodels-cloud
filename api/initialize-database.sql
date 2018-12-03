CREATE DATABASE newmodels;

CREATE USER teenageradicals WITH ENCRYPTED PASSWORD 'authenticitydungeon';
GRANT ALL PRIVILEGES ON DATABASE newmodels TO teenageradicals;

\connect newmodels

GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO teenageradicals;

CREATE TABLE resources(
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  label TEXT NOT NULL,
  source TEXT NOT NULL
);

GRANT USAGE, SELECT ON SEQUENCE resources_id_seq TO teenageradicals;
GRANT SELECT, INSERT, UPDATE, DELETE ON resources TO teenageradicals;

CREATE TABLE users(
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  username TEXT UNIQUE NOT NULL,
  hash TEXT NOT NULL
);

GRANT USAGE, SELECT ON SEQUENCE users_id_seq TO teenageradicals;
GRANT SELECT, INSERT, UPDATE, DELETE ON users TO teenageradicals;

CREATE TABLE votes(
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  resource_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  CONSTRAINT votes_resources_id_fkey FOREIGN KEY (resource_id)
    REFERENCES resources (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE NO ACTION,
  CONSTRAINT votes_users_id_fkey FOREIGN KEY (user_id)
    REFERENCES users (id) MATCH SIMPLE
    ON UPDATE NO ACTION ON DELETE NO ACTION
);

GRANT USAGE, SELECT ON SEQUENCE votes_id_seq TO teenageradicals;
GRANT SELECT, INSERT, UPDATE, DELETE ON votes TO teenageradicals;
