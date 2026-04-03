import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../utils/AuthContext.jsx';
import './StartScreen.css';

export default function StartScreen({ onStart, highScore }) {
  const { user, logout } = useAuth();
  return (
    <div className="start-bg">
      <div className="start-clouds">{[...Array(5)].map((_,i)=><div key={i} className={`s-cloud sc-${i}`}/>)}</div>
      <div className="start-content">
        <div className="start-logo">
          <div className="sl-super">SUPER</div>
          <div className="sl-mario">MARIO</div>
          <div className="sl-sub">ANERVEA EDITION</div>
        </div>
        <div className="start-sprite-row">
          <div className="sprite-mario">🔴</div>
          <div className="sprite-coin spin">🪙</div>
          <div className="sprite-mushroom bounce">🍄</div>
          <div className="sprite-star float">⭐</div>
        </div>
        {user && (
          <div className="start-welcome">
            <span>WELCOME BACK,</span>
            <span className="welcome-name">{user.username.toUpperCase()}</span>
            {user.best_score > 0 && <span className="welcome-score">BEST: {user.best_score.toLocaleString()}</span>}
          </div>
        )}
        {highScore > 0 && !user && <div className="start-hiscore">HI-SCORE: {highScore.toString().padStart(6,'0')}</div>}
        <div className="start-controls">
          <button className="pixel-btn start-play-btn" onClick={onStart}>▶ PRESS START</button>
          <div className="start-secondary-btns">
            <Link to="/leaderboard" className="pixel-btn secondary" style={{textDecoration:'none',fontSize:9,padding:'10px 18px'}}>🏆 SCORES</Link>
            {user ? <button className="pixel-btn" style={{fontSize:9,padding:'10px 18px'}} onClick={logout}>LOGOUT</button>
                  : <Link to="/login" className="pixel-btn golden" style={{textDecoration:'none',fontSize:9,padding:'10px 18px'}}>LOGIN</Link>}
          </div>
        </div>
        <div className="start-instructions">
          <div className="inst-row"><kbd>← →</kbd> or <kbd>A D</kbd> <span>MOVE</span></div>
          <div className="inst-row"><kbd>SPACE</kbd> or <kbd>W ↑</kbd> <span>JUMP</span></div>
          <div className="inst-row"><span style={{color:'#f7c948'}}>Stomp enemies • Collect coins • Reach the FLAG!</span></div>
        </div>
      </div>
      <div className="ground-row">{[...Array(25)].map((_,i)=><div key={i} className="ground-block"/>)}</div>
    </div>
  );
}
