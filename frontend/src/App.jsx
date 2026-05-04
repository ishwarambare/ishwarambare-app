import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Portfolio from './pages/Portfolio'
import AlertHistory from './pages/AlertHistory'
import LiveAgent from './pages/LiveAgent'
import Articles from './pages/Articles'
import ArticleDetail from './pages/ArticleDetail'
import ArticleEditor from './pages/ArticleEditor'

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/"                    element={<Dashboard />} />
        <Route path="/portfolio"           element={<Portfolio />} />
        <Route path="/alerts"              element={<AlertHistory />} />
        <Route path="/live"                element={<LiveAgent />} />
        <Route path="/articles"            element={<Articles />} />
        <Route path="/articles/new"        element={<ArticleEditor />} />
        <Route path="/articles/edit/:id"   element={<ArticleEditor />} />
        <Route path="/articles/:slug"      element={<ArticleDetail />} />
      </Routes>
    </BrowserRouter>
  )
}
