import React from 'react';
import '../styles/StartScreen.css';
export default function StartScreen({ onStart, highScore }) {
  return (
    <div className="start-screen">
      <div className="mario-logo"><span className="super">SUPER</span><span className="mario-text">MARIO</span><span className="bros">BROS</span></div>
      <div className="start-sprite">🍄</div>
      <div className="instructions"><p>← → MOVE &nbsp; SPACE JUMP</p><p>Stomp enemies! Collect coins!</p><p>Reach the FLAG to WIN!</p></div>
      {highScore>0&&<div className="high-score">HIGH SCORE: {highScore}</div>}
      <button className="start-btn" onClick={onStart}>PRESS START</button>
    </div>
  );
}
