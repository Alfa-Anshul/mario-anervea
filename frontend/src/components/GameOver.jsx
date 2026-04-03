import React from 'react';
import '../styles/Screens.css';
export default function GameOver({score,highScore,onRestart}){
  return(<div className="screen gameover-screen"><div className="screen-icon">💀</div><h2 className="screen-title">GAME OVER</h2><div className="scores"><p>SCORE: <span>{score}</span></p><p>BEST: <span>{highScore}</span></p></div><button className="restart-btn" onClick={onRestart}>TRY AGAIN</button></div>);
}
