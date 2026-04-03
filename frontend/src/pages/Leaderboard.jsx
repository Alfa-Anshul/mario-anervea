import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../utils/api.js';
import { useAuth } from '../utils/AuthContext.jsx';
import './Leaderboard.css';

const MEDALS = ['🥇', '🥈', '🥉'];
const CHAR_COLORS = { mario:'#cc0000', luigi:'#2ecc40', toad:'#e8d8f0', peach:'#ffb3cc' };

export default function Leaderboard() {
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.leaderboard().then(setBoard).catch(console.error).finally(()=>setLoading(false));
  }, []);

  const handleLogout = async () => { await logout(); navigate('/login'); };

  return (
    <div className="lb-bg">
      <div className="lb-clouds">
        {[...Array(4)].map((_,i)=><div key={i} className={`auth-cloud cloud-${i}`}/>)}
      </div>

      <div className="lb-container">
        <div className="lb-header">
          <Link to="/" className="lb-back pixel-btn secondary">◀ BACK</Link>
          <div className="lb-title">
            <span className="lb-title-icon">🏆</span>
            <span>LEADERBOARD</span>
          </div>
          {user
            ? <button className="pixel-btn" style={{fontSize:9,padding:'8px 14px'}} onClick={handleLogout}>LOGOUT</button>
            : <Link to="/login" className="pixel-btn" style={{fontSize:9,padding:'8px 14px',textDecoration:'none'}}>LOGIN</Link>
          }
        </div>

        {loading ? (
          <div className="lb-loading">
            <div className="coin-spin">🪙</div>
            <span>Loading scores...</span>
          </div>
        ) : (
          <div className="lb-panel panel">
            <div className="lb-table-header">
              <span className="col-rank">RANK</span>
              <span className="col-player">PLAYER</span>
              <span className="col-score">BEST SCORE</span>
              <span className="col-games">GAMES</span>
              <span className="col-coins">COINS</span>
            </div>
            <div className="lb-rows">
              {board.length === 0 && (
                <div className="lb-empty">No scores yet. Be the first! 🍄</div>
              )}
              {board.map((row, i) => (
                <div key={i} className={`lb-row ${row.username===user?.username?'lb-me':''} ${i<3?'lb-top':''}`}>
                  <span className="col-rank">
                    {i < 3 ? MEDALS[i] : `#${i+1}`}
                  </span>
                  <span className="col-player">
                    <span className="player-dot" style={{background:CHAR_COLORS[row.avatar]||'#f7c948'}}/>
                    <span className="player-name">{row.username}</span>
                    {row.username===user?.username && <span className="lb-you">YOU</span>}
                  </span>
                  <span className="col-score">{(row.best_score||0).toLocaleString()}</span>
                  <span className="col-games">{row.games_played||0}</span>
                  <span className="col-coins">🪙 {(row.total_coins||0).toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="ground-row">
        {[...Array(25)].map((_,i)=><div key={i} className="ground-block"/>)}
      </div>
    </div>
  );
}
