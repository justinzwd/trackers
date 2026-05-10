-- ============================================
-- Cloudflare D1 数据库表结构
-- ============================================

-- ============================================
-- 喝水记录表
-- ============================================
CREATE TABLE IF NOT EXISTS water_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  amount INTEGER NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- 晚饭攒钱记录表
-- ============================================
CREATE TABLE IF NOT EXISTS dinner_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spent REAL NOT NULL,           -- 实际花销
  saved REAL NOT NULL,            -- 攒钱金额 (预算 - 花销)
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP  -- 记录日期
);

-- ============================================
-- 创建索引以提高查询性能
-- ============================================
CREATE INDEX IF NOT EXISTS idx_water_records_recorded_at ON water_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_water_records_date ON water_records(DATE(recorded_at));
CREATE INDEX IF NOT EXISTS idx_dinner_records_recorded_at ON dinner_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_dinner_records_date ON dinner_records(DATE(recorded_at));

-- ============================================
-- 查询示例
-- ============================================

-- 查询今日所有喝水记录
-- SELECT id, amount, datetime(recorded_at, 'localtime') as recorded_at
-- FROM water_records
-- WHERE DATE(recorded_at) = DATE('now')
-- ORDER BY recorded_at DESC;

-- 查询最近 7 天的喝水量汇总
-- SELECT DATE(recorded_at) as date, SUM(amount) as total
-- FROM water_records
-- WHERE DATE(recorded_at) >= DATE('now', '-6 days')
-- GROUP BY DATE(recorded_at)
-- ORDER BY date;

-- 查询今日晚饭记录
-- SELECT id, spent, saved, datetime(recorded_at, 'localtime') as recorded_at
-- FROM dinner_records
-- WHERE DATE(recorded_at) = DATE('now')
-- ORDER BY recorded_at DESC;

-- 查询最近 7 天的晚饭攒钱汇总
-- SELECT DATE(recorded_at) as date, SUM(spent) as spent, SUM(saved) as saved
-- FROM dinner_records
-- WHERE DATE(recorded_at) >= DATE('now', '-6 days')
-- GROUP BY DATE(recorded_at)
-- ORDER BY date;
