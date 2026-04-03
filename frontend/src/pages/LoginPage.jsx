import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext.jsx';
import './Auth.css';

export default function LoginPage() {
  const [form, setForm] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await login(form.username, form.password);
      navigate('/');
    } catch(err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-bg">
      <div className="auth-clouds">
        {[...Array(6)].map((_,i) => <div key={i} className={`auth-cloud cloud-${i}`}/>)}
      </div>
      <div className="auth-ground"/>

      <div className="auth-container" style={{animation:'fadeIn 0.4s ease'}}>
        <div className="auth-logo">
          <span className="logo-super">SUPER</span>
          <span className="logo-mario">MARIO</span>
          <span className="logo-anervea">ANERVEA</span>
        </div>

        <div className="auth-panel panel">
          <h2 className="auth-title">PLAYER LOGIN</h2>
          <div className="auth-mario-icon">
            <MarioIcon/>
          </div>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handle} className="auth-form">
            <div className="field-group">
              <label>USERNAME</label>
              <input
                className="pixel-input"
                placeholder="Enter username"
                value={form.username}
                onChange={e => setForm({...form, username: e.target.value})}
                required
              />
            </div>
            <div className="field-group">
              <label>PASSWORD</label>
              <input
                type="password"
                className="pixel-input"
                placeholder="Enter password"
                value={form.password}
                onChange={e => setForm({...form, password: e.target.value})}
                required
              />
            </div>
            <button className="pixel-btn auth-submit" type="submit" disabled={loading}>
              {loading ? 'LOADING...' : '▶ PLAY NOW'}
            </button>
          </form>

          <div className="auth-footer">
            <span>New player? </span>
            <Link to="/register" className="auth-link">CREATE ACCOUNT</Link>
          </div>
          <div className="auth-footer" style={{marginTop:8}}>
            <Link to="/leaderboard" className="auth-link">🏆 LEADERBOARD</Link>
          </div>
        </div>
      </div>

      <div className="ground-row">
        {[...Array(25)].map((_,i) => <div key={i} className="ground-block"/>)}
      </div>
    </div>
  );
}

function MarioIcon() {
  return (
    <svg width="48" height="60" viewBox="0 0 48 60" style={{animation:'bounce 1s infinite'}}>
      <rect x="12" y="0" width="24" height="10" fill="#cc0000"/>
      <rect x="6" y="6" width="36" height="8" fill="#cc0000"/>
      <rect x="6" y="14" width="36" height="18" fill="#f5c87a"/>
      <rect x="12" y="18" width="5" height="5" fill="#111"/>
      <rect x="8" y="26" width="32" height="4" fill="#5a2a00"/>
      <rect x="6" y="32" width="36" height="16" fill="#cc0000"/>
      <rect x="10" y="32" width="12" height="16" fill="#1a4fcc"/>
      <rect x="26" y="32" width="12" height="16" fill="#1a4fcc"/>
      <rect x="4" y="48" width="18" height="8" fill="#3a1800"/>
      <rect x="26" y="48" width="18" height="8" fill="#3a1800"/>
    </svg>
  );
}
