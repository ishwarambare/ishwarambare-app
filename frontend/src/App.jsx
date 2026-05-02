import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Home from './pages/Home'
import Items from './pages/Items'
import About from './pages/About'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"       element={<Home />} />
        <Route path="/items"  element={<Items />} />
        <Route path="/about"  element={<About />} />
      </Routes>
    </BrowserRouter>
  )
}
