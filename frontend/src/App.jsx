import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import AlertHistory from './pages/AlertHistory'
import LiveAgent from './pages/LiveAgent'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"          element={<Dashboard />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/alerts"    element={<AlertHistory />} />
        <Route path="/live"      element={<LiveAgent />} />
      </Routes>
    </BrowserRouter>
  )
}
