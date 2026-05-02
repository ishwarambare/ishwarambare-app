import { useEffect, useState } from 'react'
import { healthCheck } from '../services/api'
import { Link } from 'react-router-dom'
import '../styles/Home.css'

const FEATURES = [
  { icon: '⚡', title: 'FastAPI Backend', desc: 'High-performance async REST API built with Python & FastAPI.' },
  { icon: '⚛️', title: 'React Frontend',  desc: 'Dynamic, responsive UI powered by React 18 & Vite.' },
  { icon: '🔗', title: 'Fully Connected', desc: 'Axios-powered service layer with JWT-ready auth interceptor.' },
  { icon: '☁️', title: 'Deployed on Render', desc: 'CI/CD via Render – auto-deploys on every git push.' },
]

export default function Home() {
  const [apiStatus, setApiStatus] = useState('checking…')
  const [statusOk,  setStatusOk]  = useState(null)

  useEffect(() => {
    healthCheck()
      .then(() => { setApiStatus('API is healthy ✓'); setStatusOk(true) })
      .catch(() => { setApiStatus('API unreachable ✗'); setStatusOk(false) })
  }, [])

  return (
    <main className="home">
      {/* Hero */}
      <section className="hero">
        <div className="hero__glow" />
        <div className="container hero__content">
          <div className="hero__badge">🚀 ishwarambare.online</div>
          <h1>Full-Stack <span className="gradient-text">FastAPI + React</span></h1>
          <p className="hero__sub">
            A production-ready boilerplate with FastAPI, React, CORS, routing,
            and Render deployment — ready to ship.
          </p>
          <div className="hero__actions">
            <Link to="/items" className="btn btn-primary">Explore Items →</Link>
            <Link to="/about" className="btn btn-outline">About the Stack</Link>
          </div>
          <div className={`api-status ${statusOk === true ? 'api-status--ok' : statusOk === false ? 'api-status--err' : ''}`}>
            <span className="api-status__dot" /> {apiStatus}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="features">
        <div className="container">
          <h2 className="section-title">What's included</h2>
          <div className="grid grid-2">
            {FEATURES.map(f => (
              <div key={f.title} className="card feature-card">
                <div className="feature-card__icon">{f.icon}</div>
                <h3>{f.title}</h3>
                <p className="feature-card__desc">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
