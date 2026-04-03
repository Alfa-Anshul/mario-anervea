import React from 'react';
import '../styles/HUD.css';
export default function HUD({score,lives,coins,level,timeLeft}){
  return(<div className="hud"><div className="hud-item"><span className="hud-label">MARIO</span><span className="hud-value">{String(score).padStart(6,'0')}</span></div><div className="hud-item"><span className="hud-label">🪙</span><span className="hud-value">x{String(coins).padStart(2,'0')}</span></div><div className="hud-item"><span className="hud-label">WORLD</span><span className="hud-value">{level}-1</span></div><div className="hud-item"><span className="hud-label">TIME</span><span className="hud-value" style={{color:timeLeft<30?'#f44':'#fff'}}>{timeLeft}</span></div><div className="hud-item"><span className="hud-label">LIVES</span><span className="hud-value">{'❤️'.repeat(Math.max(0,lives))}</span></div></div>);
}
