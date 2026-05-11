import { Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import WaterTracker from './pages/WaterTracker'
import DinnerTracker from './pages/DinnerTracker'
import BonusTracker from './pages/BonusTracker'
import ReadingTracker from './pages/ReadingTracker'
import OkrTracker from './pages/OkrTracker'
import './App.css'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/water" element={<WaterTracker />} />
      <Route path="/dinner" element={<DinnerTracker />} />
      <Route path="/bonus" element={<BonusTracker />} />
      <Route path="/reading" element={<ReadingTracker />} />
      <Route path="/okr" element={<OkrTracker />} />
    </Routes>
  )
}

export default App