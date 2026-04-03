import React from 'react';
import '../styles/Screens.css';
export default function WinScreen({ score, highScore, onRestart }) {
  return (
    <div className="screen win-screen">
      <div className="screen-icon">🏆</div>
      <h1 className="screen-title">YOU WIN!</h1>
      <div className="scores"><p>SCORE: <span>{score}</span></p><p>BEST: <span>{highScore}</span></p></div>
      <button className="restart-btn" onClick={onRestart}>PLAY AGAIN</button>
    </div>
  );
}
