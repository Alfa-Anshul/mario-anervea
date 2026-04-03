import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext.jsx';
import './Auth.css';

const AVATARS = [
  { id: 'mario', label: '🔴 Mario', color: '#cc0000' },
  { id: 'luigi', label: '🟢 Luigi', color: '#2ecc40' },
  { id: 'toad', label: '🍄 Toad', color: '#e8d8f0' },
  { id: 'peach', label: '👑 Peach', color: '#ffb3cc' },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ username: '', email: '', password: '', avatar: 'mario' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      await register(form.username, form.email, form.password, form.avatar);
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

      <div className="auth-container" style={{animation:'fadeIn 0.4s ease'}}>
        <div className="auth-logo">
          <span className="logo-super">SUPER</span>
          <span className="logo-mario">MARIO</span>
          <span className="logo-anervea">ANERVEA</span>
        </div>

        <div className="auth-panel panel">
          <h2 className="auth-title">NEW PLAYER</h2>

          {error && <div className="auth-error">⚠ {error}</div>}

          <form onSubmit={handle} className="auth-form">
            <div className="field-group">
              <label>USERNAME</label>
              <input className="pixel-input" placeholder="Choose username (min 3)"
                value={form.username} onChange={e=>setForm({...form,username:e.target.value})} required minLength={3}/>
            </div>
            <div className="field-group">
              <label>EMAIL</label>
              <input type="email" className="pixel-input" placeholder="your@email.com"
                value={form.email} onChange={e=>setForm({...form,email:e.target.value})} required/>
            </div>
            <div className="field-group">
              <label>PASSWORD</label>
              <input type="password" className="pixel-input" placeholder="Min 6 characters"
                value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required minLength={6}/>
            </div>

            <div className="field-group">
              <label>CHOOSE CHARACTER</label>
              <div className="avatar-grid">
                {AVATARS.map(a => (
                  <button key={a.id} type="button"
                    className={`avatar-card ${form.avatar===a.id?'selected':''}`}
                    style={{'--avatar-color': a.color}}
                    onClick={() => setForm({...form, avatar: a.id})}>
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            <button className="pixel-btn auth-submit green" type="submit" disabled={loading}>
              {loading ? 'CREATING...' : '✓ CREATE ACCOUNT'}
            </button>
          </form>

          <div className="auth-footer">
            <span>Already registered? </span>
            <Link to="/login" className="auth-link">SIGN IN</Link>
          </div>
        </div>
      </div>

      <div className="ground-row">
        {[...Array(25)].map((_,i) => <div key={i} className="ground-block"/>)}
      </div>
    </div>
  );
}
