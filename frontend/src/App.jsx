import React,{useState}from 'react';
import Game from './components/Game.jsx';
import StartScreen from './components/StartScreen.jsx';
import GameOver from './components/GameOver.jsx';
import WinScreen from './components/WinScreen.jsx';
import './styles/App.css';
export default function App(){
  const[gameState,setGameState]=useState('start');
  const[score,setScore]=useState(0);
  const[highScore,setHighScore]=useState(()=>Number(localStorage.getItem('marioHigh'))||0);
  const handleStart=()=>{setScore(0);setGameState('playing');};
  const handleGameOver=s=>{if(s>highScore){setHighScore(s);localStorage.setItem('marioHigh',s);}setScore(s);setGameState('gameover');};
  const handleWin=s=>{if(s>highScore){setHighScore(s);localStorage.setItem('marioHigh',s);}setScore(s);setGameState('win');};
  return(<div className="app">{gameState==='start'&&<StartScreen onStart={handleStart} highScore={highScore}/>}{gameState==='playing'&&<Game onGameOver={handleGameOver} onWin={handleWin}/>}{gameState==='gameover'&&<GameOver score={score} highScore={highScore} onRestart={handleStart}/>}{gameState==='win'&&<WinScreen score={score} highScore={highScore} onRestart={handleStart}/>}</div>);
}
