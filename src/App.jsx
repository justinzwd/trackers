import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WaterTracker from './pages/WaterTracker'
import './App.css'

function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/water" element={<WaterTracker />} />
      </Routes>
    </div>
  )
}

export default App
