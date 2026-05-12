-- 将已有记录的 recorded_at 从 UTC 转换为 UTC+8
UPDATE water_records SET recorded_at = DATETIME(recorded_at, '+8 hours');
