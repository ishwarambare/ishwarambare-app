import { NavLink } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container">
        <span className="navbar__brand">
          ishwar<span>ambare</span>
        </span>
        <ul className="navbar__links">
          <li><NavLink to="/"      end>Home</NavLink></li>
          <li><NavLink to="/items">Items</NavLink></li>
          <li><NavLink to="/about">About</NavLink></li>
        </ul>
      </div>
    </nav>
  )
}
