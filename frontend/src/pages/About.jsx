const STACK = [
  { name: 'FastAPI', role: 'Backend framework', color: '#009688', desc: 'High-performance async Python API.' },
  { name: 'Uvicorn', role: 'ASGI server',       color: '#ff7043', desc: 'Lightning-fast ASGI server for FastAPI.' },
  { name: 'Pydantic', role: 'Data validation',  color: '#e91e63', desc: 'Strict schema validation & serialization.' },
  { name: 'React 18', role: 'UI library',        color: '#61dafb', desc: 'Component-based reactive UI.' },
  { name: 'Vite',    role: 'Build tool',         color: '#a78bfa', desc: 'Blazing-fast dev server & bundler.' },
  { name: 'Axios',   role: 'HTTP client',        color: '#5b6ee1', desc: 'Promise-based HTTP client with interceptors.' },
  { name: 'Render',  role: 'Cloud deployment',   color: '#46e3b7', desc: 'Auto-deploy from GitHub on every push.' },
]

export default function About() {
  return (
    <main style={{ padding: '40px 0 80px' }}>
      <div className="container">
        <h1>About the Stack</h1>
        <p style={{ color: 'var(--clr-muted)', margin: '12px 0 40px', maxWidth: 560 }}>
          This project is a production-ready full-stack boilerplate for <strong>ishwarambare.online</strong>.
          It is designed to be deployed on Render with a custom domain.
        </p>

        <div className="grid grid-3">
          {STACK.map(s => (
            <div key={s.name} className="card" style={{ borderTop: `3px solid ${s.color}` }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--clr-muted)', marginBottom: 4 }}>{s.role}</div>
              <h3 style={{ color: s.color, marginBottom: 8 }}>{s.name}</h3>
              <p style={{ color: 'var(--clr-muted)', fontSize: '0.88rem' }}>{s.desc}</p>
            </div>
          ))}
        </div>

        <div className="card" style={{ marginTop: 40 }}>
          <h2 style={{ marginBottom: 16 }}>Project Structure</h2>
          <pre style={{ color: 'var(--clr-muted)', fontSize: '0.85rem', lineHeight: 1.8, overflowX: 'auto' }}>{`
ishwarambare-app/
├── backend/                  # FastAPI
│   ├── venv/                 # Python virtual environment
│   ├── routers/
│   │   ├── items.py          # /api/items  CRUD
│   │   └── auth.py           # /api/auth   Login
│   ├── main.py               # App entrypoint, CORS
│   ├── requirements.txt
│   └── .env.example
├── frontend/                 # React + Vite
│   ├── src/
│   │   ├── components/Navbar.jsx
│   │   ├── pages/            # Home · Items · About
│   │   ├── services/api.js   # Axios layer
│   │   └── styles/
│   ├── vite.config.js
│   └── package.json
└── render.yaml               # Render deployment config
          `.trim()}</pre>
        </div>
      </div>
    </main>
  )
}
