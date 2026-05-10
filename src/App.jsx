import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WaterTracker from './pages/WaterTracker'
import DinnerTracker from './pages/DinnerTracker'
import BonusTracker from './pages/BonusTracker'
import './App.css'

function App() {
  return (
    <div className="container">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/water" element={<WaterTracker />} />
        <Route path="/dinner" element={<DinnerTracker />} />
        <Route path="/bonus" element={<BonusTracker />} />
      </Routes>
    </div>
  )
}

export default App