-- ============================================
-- Bonus 积分系统表
-- ============================================

-- Bonus 积分项目表
CREATE TABLE IF NOT EXISTS bonus_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,             -- 项目名称
  value INTEGER NOT NULL,         -- 单次奖励积分
  sort_order INTEGER DEFAULT 0,  -- 排序顺序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Bonus 积分历史记录表
CREATE TABLE IF NOT EXISTS bonus_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  item_id INTEGER NOT NULL,       -- 关联的项目ID
  item_name TEXT NOT NULL,        -- 项目名称（冗余存储，便于查询）
  amount INTEGER NOT NULL,        -- 奖励积分数
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (item_id) REFERENCES bonus_items(id) ON DELETE CASCADE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_bonus_items_sort_order ON bonus_items(sort_order);
CREATE INDEX IF NOT EXISTS idx_bonus_history_item_id ON bonus_history(item_id);
CREATE INDEX IF NOT EXISTS idx_bonus_history_recorded_at ON bonus_history(recorded_at);
CREATE INDEX IF NOT EXISTS idx_bonus_history_date ON bonus_history(DATE(recorded_at));