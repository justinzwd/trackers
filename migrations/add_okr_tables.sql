-- ============================================
-- OKR 目标表
-- ============================================
CREATE TABLE IF NOT EXISTS okr_goals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,                -- 目标名称
  target_count INTEGER NOT NULL,     -- 目标总次数
  completed_count INTEGER DEFAULT 0, -- 已完成次数
  completed INTEGER DEFAULT 0,       -- 是否已完成 (0: 进行中, 1: 已完成)
  completed_date TEXT,               -- 完成日期
  deleted INTEGER DEFAULT 0,         -- 软删除 (0: 正常, 1: 已删除)
  sort_order INTEGER DEFAULT 0,      -- 排序顺序
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================
-- OKR 目标打卡记录表
-- ============================================
CREATE TABLE IF NOT EXISTS okr_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  goal_id INTEGER NOT NULL,          -- 关联的目标ID
  recorded_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (goal_id) REFERENCES okr_goals(id) ON DELETE CASCADE
);

-- ============================================
-- 索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_okr_goals_deleted ON okr_goals(deleted);
CREATE INDEX IF NOT EXISTS idx_okr_goals_sort_order ON okr_goals(sort_order);
CREATE INDEX IF NOT EXISTS idx_okr_records_goal_id ON okr_records(goal_id);
CREATE INDEX IF NOT EXISTS idx_okr_records_recorded_at ON okr_records(recorded_at);
