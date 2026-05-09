import { Link } from 'react-router-dom'
import './Home.css'

function Home() {
  const tools = [
    { id: 'water', name: '喝水记录', icon: '💧' },
  ]

  return (
    <div className="home-view">
      <h1>工具集</h1>
      <div className="tool-grid">
        {tools.map(tool => (
          <Link key={tool.id} to={`/${tool.id}`} className="tool-btn">
            <span>{tool.icon}</span>
            <span>{tool.name}</span>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Home
