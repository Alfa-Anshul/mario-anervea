import React, { useEffect, useRef, useCallback, useState } from 'react';
import HUD from './HUD.jsx';
import '../styles/Game.css';

const G=0.5,JF=-13,MS=4,T=48,GW=800,GH=500;

function buildLevel(){
  const p=[];
  for(let x=0;x<38;x++)p.push({x:x*T,y:GH-T,w:T,h:T,type:'ground'});
  [[3,7],[4,7],[5,7],[9,5],[10,5],[13,4],[14,4],[15,4],[19,7],[20,7],[23,5],[24,5],[25,5],[29,6],[30,6],[33,5],[34,5],[35,5],[36,5]]
    .forEach(([gx,gy])=>p.push({x:gx*T,y:gy*T,w:T,h:T,type:'brick'}));
  const q=[{x:5*T,y:5*T},{x:11*T,y:3*T},{x:20*T,y:5*T},{x:26*T,y:4*T},{x:32*T,y:4*T}]
    .map(b=>({...b,w:T,h:T,type:'question',hit:false}));
  const coins=[{x:6*T+12,y:4*T},{x:7*T+12,y:4*T},{x:8*T+12,y:4*T},{x:12*T+12,y:3*T},{x:16*T+12,y:3*T},{x:17*T+12,y:3*T},{x:21*T+12,y:4*T},{x:22*T+12,y:4*T},{x:27*T+12,y:4*T},{x:28*T+12,y:4*T},{x:31*T+12,y:3*T},{x:37*T+12,y:3*T}]
    .map((c,i)=>({...c,id:i,collected:false,w:20,h:20}));
  const enemies=[
    {id:0,x:6*T,y:GH-2*T,vx:-1.5,vy:0,alive:true,type:'goomba'},
    {id:1,x:10*T,y:GH-2*T,vx:-1.5,vy:0,alive:true,type:'goomba'},
    {id:2,x:15*T,y:GH-2*T,vx:-1.5,vy:0,alive:true,type:'koopa'},
    {id:3,x:21*T,y:GH-2*T,vx:-1.5,vy:0,alive:true,type:'goomba'},
    {id:4,x:27*T,y:GH-2*T,vx:-1.5,vy:0,alive:true,type:'koopa'},
    {id:5,x:32*T,y:GH-2*T,vx:-1.5,vy:0,alive:true,type:'goomba'}
  ];
  return {platforms:p,qblocks:q,coins,enemies,flag:{x:36*T,y:GH-8*T,w:T,h:7*T},worldWidth:38*T};
}

export default function Game({onGameOver,onWin}){
  const canvasRef=useRef(null),stateRef=useRef(null),keysRef=useRef({}),animRef=useRef(null);
  const [hud,setHud]=useState({score:0,lives:3,coins:0,level:1,timeLeft:300});

  const initState=useCallback(()=>({mario:{x:80,y:GH-2*T,w:36,h:44,vx:0,vy:0,onGround:false,facingRight:true},camera:{x:0},score:0,lives:3,coins:0,level:1,timeLeft:300,lastTime:0,timerTick:0,...buildLevel()}),[]);

  useEffect(()=>{
    stateRef.current=initState();
    const canvas=canvasRef.current,ctx=canvas.getContext('2d');
    canvas.focus();
    const onKey=(e,d)=>{keysRef.current[e.code]=d;if(['Space','ArrowUp','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();};
    window.addEventListener('keydown',e=>onKey(e,true));
    window.addEventListener('keyup',e=>onKey(e,false));

    const ov=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;

    function resolveGround(s){
      const m=s.mario;m.onGround=false;
      for(const p of[...s.platforms,...s.qblocks]){
        if(ov(m,p)){
          const ox=Math.min(m.x+m.w,p.x+p.w)-Math.max(m.x,p.x);
          const oy=Math.min(m.y+m.h,p.y+p.h)-Math.max(m.y,p.y);
          if(oy<ox){
            if(m.vy>0&&m.y+m.h-m.vy<=p.y+2){m.y=p.y-m.h;m.vy=0;m.onGround=true;}
            else if(m.vy<0&&p.type==='question'&&!p.hit){p.hit=true;s.score+=200;m.vy=Math.abs(m.vy)*0.5;}
            else if(m.vy<0){m.y=p.y+p.h;m.vy=0;}
          }else{if(m.x<p.x)m.x=p.x-m.w;else m.x=p.x+p.w;m.vx=0;}
        }
      }
    }

    function tick(ts){
      const s=stateRef.current,dt=Math.min((ts-s.lastTime)/16.67,3);s.lastTime=ts;
      s.timerTick+=dt;if(s.timerTick>60){s.timeLeft=Math.max(0,s.timeLeft-1);s.timerTick=0;}
      const k=keysRef.current,m=s.mario;
      if(k['ArrowLeft']||k['KeyA']){m.vx=-MS;m.facingRight=false;}
      else if(k['ArrowRight']||k['KeyD']){m.vx=MS;m.facingRight=true;}
      else m.vx*=0.7;
      if((k['Space']||k['ArrowUp']||k['KeyW'])&&m.onGround)m.vy=JF;
      m.vy=Math.min(m.vy+G*dt,18);m.x+=m.vx*dt;m.y+=m.vy*dt;
      m.x=Math.max(0,Math.min(m.x,s.worldWidth-m.w));
      resolveGround(s);
      s.camera.x=Math.max(0,Math.min(m.x-GW/2,s.worldWidth-GW));
      for(const c of s.coins)if(!c.collected&&ov(m,{...c,x:c.x-8,y:c.y-8,w:c.w+16,h:c.h+16})){c.collected=true;s.coins++;s.score+=100;}
      for(const e of s.enemies){
        if(!e.alive)continue;e.x+=e.vx*dt;
        if(e.x<0||e.x>s.worldWidth-T)e.vx*=-1;
        let eg=false;for(const p of s.platforms)if(e.x<p.x+p.w&&e.x+T>p.x&&e.y+T>=p.y&&e.y+T<=p.y+6&&e.vy>=0){eg=true;break;}
        if(!eg){e.vy=(e.vy||0)+G*dt;e.y+=e.vy;}
        if(ov(m,{x:e.x,y:e.y,w:T,h:T})){
          if(m.vy>0&&m.y+m.h<e.y+T*0.6){e.alive=false;s.score+=200;m.vy=JF*0.6;}
          else{s.lives--;if(s.lives<=0){onGameOver(s.score);cancelAnimationFrame(animRef.current);return;}stateRef.current={...initState(),score:s.score,lives:s.lives,coins:s.coins};return;}
        }
      }
      if(ov(m,s.flag)){s.score+=s.timeLeft*10;onWin(s.score);cancelAnimationFrame(animRef.current);return;}
      if(m.y>GH+100){s.lives--;if(s.lives<=0){onGameOver(s.score);cancelAnimationFrame(animRef.current);return;}stateRef.current={...initState(),score:s.score,lives:s.lives,coins:s.coins};return;}
      if(s.timeLeft<=0){s.lives--;if(s.lives<=0){onGameOver(s.score);cancelAnimationFrame(animRef.current);return;}stateRef.current={...initState(),score:s.score,lives:s.lives,coins:s.coins};return;}
      setHud({score:s.score,lives:s.lives,coins:s.coins,level:s.level,timeLeft:s.timeLeft});
      draw(ctx,s);animRef.current=requestAnimationFrame(tick);
    }

    function draw(ctx,s){
      const cam=s.camera.x;
      const sky=ctx.createLinearGradient(0,0,0,GH);sky.addColorStop(0,'#5c94fc');sky.addColorStop(1,'#9bbcff');
      ctx.fillStyle=sky;ctx.fillRect(0,0,GW,GH);
      ctx.fillStyle='rgba(255,255,255,0.9)';
      [[100,60,50,25],[300,40,60,30],[600,70,45,22],[950,50,55,28],[1200,55,50,25],[1500,45,60,30]].forEach(([cx,cy,cw,ch])=>{
        const rx=cx-cam;if(rx>-100&&rx<GW+100){ctx.beginPath();ctx.ellipse(rx,cy,cw,ch,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(rx-20,cy+5,cw*0.7,ch*0.7,0,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.ellipse(rx+20,cy+5,cw*0.7,ch*0.7,0,0,Math.PI*2);ctx.fill();}
      });
      ctx.fillStyle='#5aa820';
      [[200,GH-T,80,50],[500,GH-T,60,40],[900,GH-T,90,55],[1300,GH-T,70,45]].forEach(([hx,hy,hw,hh])=>{
        const rx=hx-cam;if(rx>-200&&rx<GW+200){ctx.beginPath();ctx.ellipse(rx,hy,hw,hh,0,0,Math.PI*2);ctx.fill();}
      });
      for(const p of[...s.platforms,...s.qblocks]){
        const px=p.x-cam;if(px>-T&&px<GW+T){
          if(p.type==='ground'){ctx.fillStyle='#c84c0c';ctx.fillRect(px,p.y,p.w,p.h);ctx.fillStyle='#8b3a0a';ctx.fillRect(px+2,p.y+2,p.w-4,p.h-4);}
          else if(p.type==='brick'){ctx.fillStyle='#c8602c';ctx.fillRect(px,p.y,p.w,p.h);ctx.strokeStyle='#8b3a0a';ctx.lineWidth=2;ctx.strokeRect(px+1,p.y+1,p.w-2,p.h-2);ctx.fillStyle='#8b3a0a';ctx.fillRect(px,p.y+p.h/2-1,p.w,2);ctx.fillRect(px+p.w/2-1,p.y,2,p.h/2);}
          else if(p.type==='question'){ctx.fillStyle=p.hit?'#888':'#f0a000';ctx.fillRect(px,p.y,p.w,p.h);ctx.fillStyle=p.hit?'#555':'#ffd040';ctx.fillRect(px+3,p.y+3,p.w-6,p.h-6);ctx.fillStyle=p.hit?'#333':'#7a4800';ctx.font='bold 22px serif';ctx.textAlign='center';ctx.fillText(p.hit?'·':'?',px+p.w/2,p.y+p.h*0.72);}
        }
      }
      for(const c of s.coins){
        if(!c.collected){const cx=c.x-cam;if(cx>-30&&cx<GW+30){ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(cx+10,c.y+10,10,0,Math.PI*2);ctx.fill();ctx.fillStyle='#ffe97a';ctx.beginPath();ctx.arc(cx+7,c.y+7,4,0,Math.PI*2);ctx.fill();}}
      }
      for(const e of s.enemies){
        if(!e.alive)continue;const ex=e.x-cam;
        if(ex>-T&&ex<GW+T){
          if(e.type==='goomba'){
            ctx.fillStyle='#8b4513';ctx.fillRect(ex+4,e.y+8,T-8,T-12);
            ctx.fillStyle='#c0722e';ctx.fillRect(ex+8,e.y+4,T-16,20);
            ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(ex+15,e.y+12,5,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+T-15,e.y+12,5,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#111';ctx.beginPath();ctx.arc(ex+15,e.y+12,3,0,Math.PI*2);ctx.fill();ctx.beginPath();ctx.arc(ex+T-15,e.y+12,3,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#5a2a00';ctx.fillRect(ex+2,e.y+T-12,14,12);ctx.fillRect(ex+T-16,e.y+T-12,14,12);
          }else{
            ctx.fillStyle='#1a6a1a';ctx.fillRect(ex+4,e.y+8,T-8,T-12);
            ctx.fillStyle='#ffd700';ctx.beginPath();ctx.arc(ex+T/2,e.y+10,11,0,Math.PI*2);ctx.fill();
            ctx.fillStyle='#1a6a1a';ctx.fillRect(ex+2,e.y+T-14,14,14);ctx.fillRect(ex+T-16,e.y+T-14,14,14);
          }
        }
      }
      const fx=s.flag.x-cam;
      if(fx>-T&&fx<GW+T){
        ctx.fillStyle='#aaa';ctx.fillRect(fx+T/2-2,s.flag.y,4,s.flag.h);
        ctx.fillStyle='#22bb22';ctx.beginPath();ctx.moveTo(fx+T/2+2,s.flag.y);ctx.lineTo(fx+T/2+30,s.flag.y+14);ctx.lineTo(fx+T/2+2,s.flag.y+28);ctx.fill();
        ctx.fillStyle='#888';ctx.beginPath();ctx.arc(fx+T/2,s.flag.y,7,0,Math.PI*2);ctx.fill();
      }
      const mx=s.mario.x-cam,my=s.mario.y,fr=s.mario.facingRight;
      ctx.save();if(!fr){ctx.translate(mx+s.mario.w,my);ctx.scale(-1,1);}else ctx.translate(mx,my);
      ctx.fillStyle='#cc0000';ctx.fillRect(6,0,24,10);ctx.fillRect(2,10,32,8);
      ctx.fillStyle='#f5c87a';ctx.fillRect(4,14,28,16);
      ctx.fillStyle='#222';ctx.fillRect(10,18,4,4);
      ctx.fillStyle='#8b4513';ctx.fillRect(6,24,24,6);
      ctx.fillStyle='#cc0000';ctx.fillRect(4,30,28,14);
      ctx.fillStyle='#1a4fcc';ctx.fillRect(4,36,10,16);ctx.fillRect(22,36,10,16);ctx.fillRect(4,44,28,6);
      ctx.fillStyle='#3a1800';ctx.fillRect(0,50,16,6);ctx.fillRect(20,50,16,6);
      ctx.restore();
    }

    stateRef.current.lastTime=performance.now();
    animRef.current=requestAnimationFrame(tick);
    return()=>{cancelAnimationFrame(animRef.current);window.removeEventListener('keydown',e=>onKey(e,true));window.removeEventListener('keyup',e=>onKey(e,false));};
  },[initState,onGameOver,onWin]);

  return(
    <div className="game-wrapper">
      <HUD {...hud}/>
      <canvas ref={canvasRef} width={GW} height={GH} className="game-canvas" tabIndex={0}/>
      <div className="mobile-controls">
        <button className="mc-btn" onPointerDown={()=>{keysRef.current['ArrowLeft']=true}} onPointerUp={()=>{keysRef.current['ArrowLeft']=false}}>◀</button>
        <button className="mc-btn" onPointerDown={()=>{keysRef.current['Space']=true}} onPointerUp={()=>{keysRef.current['Space']=false}}>▲</button>
        <button className="mc-btn" onPointerDown={()=>{keysRef.current['ArrowRight']=true}} onPointerUp={()=>{keysRef.current['ArrowRight']=false}}>▶</button>
      </div>
    </div>
  );
}
