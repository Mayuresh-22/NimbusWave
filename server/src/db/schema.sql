DROP TABLE IF EXISTS projects;
DROP TABLE IF EXISTS chats;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS deployments;

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY, 
  email_address TEXT, 
  metadata TEXT, 
  project_credits INTEGER default 10, -- free project credits, eg 10
  deployment_pm INTEGER default 100, -- deployment per month, eg 100
  token_balance INTEGER default 102400,
  deployment_limit_reset_at DATETIME default (DATETIME('now', '+30 days')),
  created_at DATETIME default CURRENT_TIMESTAMP,
  updated_at DATETIME default CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  project_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_name TEXT, -- display name
  project_app_name TEXT, -- used as subdomain/slug eg. my-app 
  project_framework TEXT,
  project_description TEXT,
  project_status BOOLEAN default 0, -- 0 = not deployed, 1 = deployed
  project_type TEXT default 'private',
  project_size NUMERIC, -- in bytes
  project_files_meta TEXT, -- metadata of files
  entry_file_path TEXT, -- path to main entry file index.html
  is_temp BOOLEAN default 1, -- 0 = not temporary, 1 = temporary
  chat_id TEXT NOT NULL,
  created_at DATETIME default CURRENT_TIMESTAMP,
  updated_at DATETIME default CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deployments (
  deployment_id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  deployment_app_name TEXT, -- used as subdomain/slug eg. my-app
  deployment_status BOOLEAN default 0, -- 0 = failed/error, 1 = deployed
  deployment_url TEXT,
  deployment_logs TEXT,
  deployment_size NUMERIC, -- in bytes
  time_taken NUMERIC, -- in milliseconds
  created_at DATETIME default CURRENT_TIMESTAMP,
  updated_at DATETIME default CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS chats (
  chat_id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  project_id TEXT NOT NULL,
  chat_context TEXT,
  tokens_consumed INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(project_id) ON DELETE CASCADE
);