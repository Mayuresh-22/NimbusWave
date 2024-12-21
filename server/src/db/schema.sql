DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS chats;
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, 
  email_address TEXT, 
  metadata TEXT, 
  project_credits INTEGER, 
  token_balance INTEGER,
  created_at DATETIME default CURRENT_TIMESTAMP,
  updated_at DATETIME default CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  user_id TEXT,
  project_name TEXT,
  project_framework TEXT,
  project_description TEXT,
  project_status BOOLEAN default 0, -- 0 = not deployed, 1 = deployed
  project_type TEXT default 'private',
  is_temp BOOLEAN default 1, -- 0 = not temporary, 1 = temporary
  chat_id TEXT,
  created_at DATETIME default CURRENT_TIMESTAMP,
  updated_at DATETIME default CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS chats (
  chat_id TEXT PRIMARY KEY,
  user_id TEXT,
  project_id INTEGER,
  chat_context TEXT,
  created_at DATETIME default CURRENT_TIMESTAMP,
  updated_at DATETIME default CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);