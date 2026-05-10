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
-- Bonus 积分项目表
-- ============================================
CREATE TABLE IF NOT EXISTS bonus_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,             -- 项目名称
  value INTEGER NOT NULL,         -- 单次奖励积分
  sort_order INTEGER DEFAULT 0,  -- 排序顺序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- Bonus 积分历史记录表
-- ============================================
CREATE TABLE IF NOT EXISTS bonus_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,       -- 关联的项目ID
  item_name TEXT NOT NULL,        -- 项目名称（冗余存储，便于查询）
  amount INTEGER NOT NULL,        -- 奖励积分数
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES bonus_items(id) ON DELETE CASCADE
);

-- ============================================
-- 读书记录表
-- ============================================

-- 书籍表
CREATE TABLE IF NOT EXISTS reading_books (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,                 -- 书名
  completed INTEGER DEFAULT 0,         -- 是否读完 (0: 未完成, 1: 已完成)
  completed_date TEXT,                 -- 完成日期
  sort_order INTEGER DEFAULT 0,        -- 排序顺序
  deleted INTEGER DEFAULT 0,           -- 是否删除 (0: 正常, 1: 已删除)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 章节表
CREATE TABLE IF NOT EXISTS reading_chapters (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,            -- 所属书籍ID
  chapter_number TEXT NOT NULL,        -- 章节号
  chapter_name TEXT NOT NULL,          -- 章节名称
  completed INTEGER DEFAULT 0,         -- 是否读完 (0: 未完成, 1: 已完成)
  completed_date TEXT,                 -- 完成日期
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES reading_books(id) ON DELETE CASCADE
);

-- ============================================
-- 创建索引以提高查询性能
-- ============================================

-- 喝水记录索引
CREATE INDEX IF NOT EXISTS idx_water_records_recorded_at ON water_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_water_records_date ON water_records(DATE(recorded_at));

-- 晚饭记录索引
CREATE INDEX IF NOT EXISTS idx_dinner_records_recorded_at ON dinner_records(recorded_at);
CREATE INDEX IF NOT EXISTS idx_dinner_records_date ON dinner_records(DATE(recorded_at));

-- Bonus 积分索引
CREATE INDEX IF NOT EXISTS idx_bonus_items_sort_order ON bonus_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_bonus_history_item_id ON bonus_history(item_id);
CREATE INDEX IF NOT EXISTS idx_bonus_history_recorded_at ON bonus_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_bonus_history_date ON bonus_history(DATE(recorded_at));

-- 读书记录索引
CREATE INDEX IF NOT EXISTS idx_reading_books_sort_order ON reading_books(sort_order);
CREATE INDEX IF NOT EXISTS idx_reading_books_deleted ON reading_books(deleted);
CREATE INDEX IF NOT EXISTS idx_reading_chapters_book_id ON reading_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_chapters_completed ON reading_chapters(completed);

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

-- ============================================
-- Bonus 积分查询示例
-- ============================================

-- 查询所有积分项目（按排序顺序）
-- SELECT id, name, value, sort_order
-- FROM bonus_items
-- ORDER BY sort_order, id;

-- 获取某项目的当前累计次数
-- SELECT COUNT(*) as count
-- FROM bonus_history
-- WHERE item_id = ?;

-- 查询今日积分记录
-- SELECT bh.id, bh.item_id, bh.item_name, bh.amount, bh.recorded_at
-- FROM bonus_history bh
-- WHERE DATE(bh.recorded_at) = DATE('now')
-- ORDER BY bh.recorded_at DESC;

-- 查询所有历史记录
-- SELECT bh.id, bh.item_id, bh.item_name, bh.amount, bh.recorded_at
-- FROM bonus_history bh
-- ORDER BY bh.recorded_at DESC;

-- 计算总积分
-- SELECT SUM(bh.amount) as total
-- FROM bonus_history bh;

-- 删除历史记录（同时减少对应项目次数）
-- 注意：需要先获取记录的 item_id，然后删除，再可选更新其他统计

-- ============================================
-- 读书记录查询示例
-- ============================================

-- 查询所有未删除的书籍（按排序顺序）
-- SELECT id, title, completed, completed_date, sort_order
-- FROM reading_books
-- WHERE deleted = 0
-- ORDER BY sort_order, id;

-- 查询某本书的所有章节
-- SELECT id, chapter_number, chapter_name, completed, completed_date
-- FROM reading_chapters
-- WHERE book_id = ?
-- ORDER BY id;

-- 查询某本书的阅读进度
-- SELECT
--   COUNT(*) as total_chapters,
--   SUM(completed) as completed_chapters
-- FROM reading_chapters
-- WHERE book_id = ?;
