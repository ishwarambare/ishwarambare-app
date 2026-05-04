import { NavLink } from 'react-router-dom'
import { BarChart3, Briefcase, Bell, Activity, BookOpen } from 'lucide-react'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <NavLink to="/" className="navbar-brand">
          <div className="brand-icon">📈</div>
          <span>PortfolioAgent</span>
        </NavLink>

        <div className="navbar-links">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <BarChart3 size={15} />
            Dashboard
          </NavLink>

          <NavLink
            to="/portfolio"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Briefcase size={15} />
            Portfolios
          </NavLink>

          <NavLink
            to="/alerts"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Bell size={15} />
            Alert History
          </NavLink>

          <NavLink
            to="/live"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <Activity size={15} />
            Live Agent
          </NavLink>

          <NavLink
            to="/articles"
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <BookOpen size={15} />
            Articles
          </NavLink>
        </div>
      </div>
    </nav>
  )
}
