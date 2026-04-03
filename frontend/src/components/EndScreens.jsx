import React from 'react';
import { Link } from 'react-router-dom';
import './EndScreens.css';

export function GameOver({ score, highScore, onRestart }) {
  return (
    <div className="end-bg gameover-bg">
      <div className="end-content">
        <div className="end-icon">💀</div>
        <h1 className="end-title gameover-title">GAME OVER</h1>
        <div className="end-scores">
          <div className="end-score-row"><span>SCORE</span><span className="score-val">{score.toString().padStart(6,'0')}</span></div>
          {score >= highScore && score > 0 && <div className="new-record">★ NEW RECORD! ★</div>}
          <div className="end-score-row"><span>BEST</span><span className="score-val best-val">{highScore.toString().padStart(6,'0')}</span></div>
        </div>
        <div className="end-btns">
          <button className="pixel-btn" onClick={onRestart}>▶ TRY AGAIN</button>
          <Link to="/leaderboard" className="pixel-btn secondary" style={{textDecoration:'none'}}>🏆 SCORES</Link>
        </div>
      </div>
    </div>
  );
}

export function WinScreen({ score, highScore, onRestart, timeBonus }) {
  return (
    <div className="end-bg win-bg">
      <div className="fireworks">{[...Array(8)].map((_,i)=><div key={i} className={`fw fw-${i}`}/>)}</div>
      <div className="end-content">
        <div className="end-icon win-icon">🏆</div>
        <h1 className="end-title win-title">YOU WIN!</h1>
        <div className="win-stars">{'⭐'.repeat(3)}</div>
        <div className="end-scores">
          <div className="end-score-row"><span>FINAL SCORE</span><span className="score-val">{score.toString().padStart(6,'0')}</span></div>
          {timeBonus > 0 && <div className="end-score-row bonus-row"><span>TIME BONUS</span><span className="score-val">+{(timeBonus*10).toLocaleString()}</span></div>}
          {score >= highScore && score > 0 && <div className="new-record">★ NEW HIGH SCORE! ★</div>}
          <div className="end-score-row"><span>BEST</span><span className="score-val best-val">{highScore.toString().padStart(6,'0')}</span></div>
        </div>
        <div className="end-btns">
          <button className="pixel-btn green" onClick={onRestart}>▶ PLAY AGAIN</button>
          <Link to="/leaderboard" className="pixel-btn golden" style={{textDecoration:'none'}}>🏆 LEADERBOARD</Link>
        </div>
      </div>
    </div>
  );
}
