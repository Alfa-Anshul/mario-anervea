import React, { useState } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from './utils/AuthContext.jsx';
import StartScreen from './components/StartScreen.jsx';
import Game from './components/Game.jsx';
import { GameOver, WinScreen } from './components/EndScreens.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import Leaderboard from './pages/Leaderboard.jsx';
import { api } from './utils/api.js';

function GameFlow() {
  const [screen, setScreen] = useState('start');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('marioHigh')) || 0);
  const [timeBonus, setTimeBonus] = useState(0);
  const { user, setUser } = useAuth();

  const updateHigh = (s) => {
    if (s > highScore) {
      setHighScore(s);
      localStorage.setItem('marioHigh', s);
    }
  };

  const handleStart = () => { setScore(0); setScreen('playing'); };

  const handleGameOver = async (s, kills, coins) => {
    updateHigh(s);
    setScore(s);
    setScreen('gameover');
    if (user) {
      try {
        await api.postScore({ score:s, coins, enemies_killed:kills, result:'gameover' });
        const me = await api.me();
        setUser(me);
      } catch {}
    }
  };

  const handleWin = async (s, kills, coins, time) => {
    updateHigh(s);
    setScore(s);
    setTimeBonus(time);
    setScreen('win');
    if (user) {
      try {
        await api.postScore({ score:s, coins, enemies_killed:kills, time_taken:300-time, result:'win' });
        const me = await api.me();
        setUser(me);
      } catch {}
    }
  };

  return (
    <div style={{width:'100vw',minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#000'}}>
      {screen === 'start' && <StartScreen onStart={handleStart} highScore={user?.best_score || highScore}/>}
      {screen === 'playing' && <Game onGameOver={handleGameOver} onWin={handleWin} username={user?.username}/>}
      {screen === 'gameover' && <GameOver score={score} highScore={user?.best_score || highScore} onRestart={handleStart}/>}
      {screen === 'win' && <WinScreen score={score} highScore={user?.best_score || highScore} onRestart={handleStart} timeBonus={timeBonus}/>}
    </div>
  );
}

export default function App() {
  const { loading } = useAuth();

  if (loading) return (
    <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',background:'#0a0a0f',fontFamily:'var(--font-pixel)',color:'#f7c948',fontSize:12}}>
      LOADING...
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<GameFlow/>}/>
      <Route path="/login" element={<LoginPage/>}/>
      <Route path="/register" element={<RegisterPage/>}/>
      <Route path="/leaderboard" element={<Leaderboard/>}/>
      <Route path="*" element={<Navigate to="/"/>}/>
    </Routes>
  );
}
