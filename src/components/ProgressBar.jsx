function ProgressBar({ total, goal }) {
  const radius = 80
  const circumference = radius * 2 * Math.PI
  const progress = Math.min(total / goal, 1)
  const offset = circumference - progress * circumference

  return (
    <div className="progress-container">
      <svg className="progress-ring" width="200" height="200">
        <defs>
          <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#4facfe" />
            <stop offset="100%" stopColor="#00f2fe" />
          </linearGradient>
        </defs>
        <circle
          className="progress-ring__circle-bg"
          stroke="#e0e0e0"
          strokeWidth="12"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
        />
        <circle
          className="progress-ring__circle"
          stroke="url(#gradient)"
          strokeWidth="12"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="100"
          cy="100"
          strokeDasharray={`${circumference} ${circumference}`}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="progress-content">
        <div className="progress-value">{total}</div>
        <div className="progress-unit">ml</div>
        <div className="progress-goal">目标: {goal}ml</div>
      </div>
    </div>
  )
}

export default ProgressBar
