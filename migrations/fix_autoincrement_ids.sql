-- ============================================
-- 修复自增主键序列
-- 原因：初始导入数据时使用了时间戳作为 id（如 1778160959862），
-- 导致 SQLite AUTOINCREMENT 的序列值被拉到极大值。
-- 解决：将 sqlite_sequence 中的 seq 值重置为表中实际的最大合理 id。
-- ============================================

-- 先把已有数据的 id 重新编号（从1开始）

-- 1. bonus_items: 重建数据
CREATE TABLE bonus_items_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  value INTEGER NOT NULL,
  sort_order INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO bonus_items_new (name, value, sort_order, created_at)
SELECT name, value, sort_order, created_at FROM bonus_items ORDER BY sort_order, id;

-- 更新 bonus_history 中的 item_id 引用
CREATE TABLE bonus_history_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  amount INTEGER NOT NULL,
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES bonus_items_new(id) ON DELETE CASCADE
);

INSERT INTO bonus_history_new (item_id, item_name, amount, recorded_at)
SELECT
  bin.id,
  bh.item_name,
  bh.amount,
  bh.recorded_at
FROM bonus_history bh
JOIN bonus_items bi ON bh.item_id = bi.id
JOIN bonus_items_new bin ON bin.name = bi.name AND bin.sort_order = bi.sort_order
ORDER BY bh.recorded_at;

-- 删除旧表，重命名新表
DROP TABLE bonus_history;
DROP TABLE bonus_items;
ALTER TABLE bonus_items_new RENAME TO bonus_items;
ALTER TABLE bonus_history_new RENAME TO bonus_history;

-- 2. reading_books: 重建数据
CREATE TABLE reading_books_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_date TEXT,
  sort_order INTEGER DEFAULT 0,
  deleted INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO reading_books_new (title, completed, completed_date, sort_order, deleted, created_at)
SELECT title, completed, completed_date, sort_order, deleted, created_at FROM reading_books ORDER BY sort_order, id;

-- 重建 reading_chapters 并更新 book_id 引用
CREATE TABLE reading_chapters_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  chapter_number TEXT NOT NULL,
  chapter_name TEXT NOT NULL,
  completed INTEGER DEFAULT 0,
  completed_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES reading_books_new(id) ON DELETE CASCADE
);

INSERT INTO reading_chapters_new (book_id, chapter_number, chapter_name, completed, completed_date, created_at)
SELECT
  rbn.id,
  rc.chapter_number,
  rc.chapter_name,
  rc.completed,
  rc.completed_date,
  rc.created_at
FROM reading_chapters rc
JOIN reading_books rb ON rc.book_id = rb.id
JOIN reading_books_new rbn ON rbn.title = rb.title AND rbn.sort_order = rb.sort_order
ORDER BY rbn.id, rc.id;

-- 删除旧表，重命名新表
DROP TABLE reading_chapters;
DROP TABLE reading_books;
ALTER TABLE reading_books_new RENAME TO reading_books;
ALTER TABLE reading_chapters_new RENAME TO reading_chapters;

-- 3. 重建索引
CREATE INDEX IF NOT EXISTS idx_bonus_items_sort_order ON bonus_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_bonus_history_item_id ON bonus_history(item_id);
CREATE INDEX IF NOT EXISTS idx_bonus_history_recorded_at ON bonus_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_bonus_history_date ON bonus_history(DATE(recorded_at));
CREATE INDEX IF NOT EXISTS idx_reading_books_sort_order ON reading_books(sort_order);
CREATE INDEX IF NOT EXISTS idx_reading_books_deleted ON reading_books(deleted);
CREATE INDEX IF NOT EXISTS idx_reading_chapters_book_id ON reading_chapters(book_id);
CREATE INDEX IF NOT EXISTS idx_reading_chapters_completed ON reading_chapters(completed);
