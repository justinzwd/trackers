-- 晚饭攒钱记录表
CREATE TABLE IF NOT EXISTS dinner_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spent REAL NOT NULL,
  saved REAL NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_dinner_records_recorded_at ON dinner_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_dinner_records_date ON dinner_records(DATE(recorded_at));