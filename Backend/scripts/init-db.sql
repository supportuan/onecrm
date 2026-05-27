CREATE DATABASE one_crm;

\c one_crm;

CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  company TEXT
);

INSERT INTO customers (name, email, company) VALUES
('Acme Corp', 'hello@acme.com', 'Acme Corporation'),
('Brightside Solutions', 'contact@brightside.com', 'Brightside Solutions');
