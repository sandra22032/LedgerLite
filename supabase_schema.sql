-- LedgerLite Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Create the transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category TEXT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- 3. Create a policy to allow public access (for development)
-- NOTE: In a production app, you would restrict this to authenticated users.
CREATE POLICY "Allow public access" ON transactions
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Create the savings_goals table
CREATE TABLE IF NOT EXISTS savings_goals (
  id BIGINT PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  name TEXT NOT NULL,
  target_amount NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL DEFAULT 0,
  is_completed BOOLEAN DEFAULT FALSE,
  emoji TEXT DEFAULT '🎯'
);

-- 5. Enable RLS for savings_goals
ALTER TABLE savings_goals ENABLE ROW LEVEL SECURITY;

-- 6. Policy for public access to savings_goals
CREATE POLICY "Allow public access to savings" ON savings_goals
  FOR ALL
  USING (true)
  WITH CHECK (true);
