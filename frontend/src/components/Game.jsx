import React, { useEffect, useRef, useCallback, useState } from 'react';
import { api } from '../utils/api.js';
import { useAuth } from '../utils/AuthContext.jsx';
import './Game.css';

const GW = 800, GH = 500, T = 48;
const GRAVITY = 0.55, JUMP_VEL = -14, MOVE_SPD = 4.2, MAX_FALL = 16;

function buildLevel() {
  const platforms = [];
  for (let x = 0; x < 40; x++) platforms.push({ x: x * T, y: GH - T, w: T, h: T, type: 'ground' });
  const bricks = [
    [3,7],[4,7],[5,7],[8,5],[9,5],[10,5],[13,4],[14,4],[15,4],
    [19,7],[20,7],[21,7],[24,5],[25,5],[28,4],[29,4],[30,4],
    [33,6],[34,6],[35,6],[36,6]
  ];
  bricks.forEach(([gx,gy]) => platforms.push({ x:gx*T, y:gy*T, w:T, h:T, type:'brick' }));
  const qblocks = [
    {x:5*T, y:5*T}, {x:11*T, y:3*T}, {x:20*T, y:5*T},
    {x:26*T, y:4*T}, {x:32*T, y:4*T}, {x:37*T, y:5*T}
  ].map(b => ({...b, w:T, h:T, type:'question', hit:false, bounceAnim:0}));
  const coins = [
    {x:6*T+12,y:4*T},{x:7*T+12,y:4*T},{x:8*T+12,y:4*T},
    {x:12*T+12,y:2*T},{x:16*T+12,y:2*T},{x:17*T+12,y:2*T},
    {x:21*T+12,y:4*T},{x:22*T+12,y:4*T},
    {x:27*T+12,y:3*T},{x:28*T+12,y:3*T},
    {x:31*T+12,y:3*T},{x:38*T+12,y:4*T}
  ].map((c,i) => ({...c, id:i, collected:false, w:16, h:16, animOffset:i*0.3}));
  const enemies = [
    {id:0,x:6*T,y:GH-2*T,vx:-1.5,vy:0,onGround:false,alive:true,type:'goomba',dir:-1},
    {id:1,x:11*T,y:GH-2*T,vx:-1.5,vy:0,onGround:false,alive:true,type:'goomba',dir:-1},
    {id:2,x:16*T,y:GH-2*T,vx:-1.8,vy:0,onGround:false,alive:true,type:'koopa',dir:-1},
    {id:3,x:22*T,y:GH-2*T,vx:-1.5,vy:0,onGround:false,alive:true,type:'goomba',dir:-1},
    {id:4,x:28*T,y:GH-2*T,vx:-1.8,vy:0,onGround:false,alive:true,type:'koopa',dir:-1},
    {id:5,x:33*T,y:GH-2*T,vx:-1.5,vy:0,onGround:false,alive:true,type:'goomba',dir:-1},
    {id:6,x:36*T,y:GH-2*T,vx:-2,vy:0,onGround:false,alive:true,type:'goomba',dir:-1},
  ];
  return { platforms, qblocks, coins, enemies, flag: { x: 38*T, y: GH-8*T, w: T, h: 7*T }, worldWidth: 40*T, particles: [], floatTexts: [] };
}

function overlap(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}

function resolveCollisions(mario, allBlocks) {
  mario.onGround = false;
  for (const p of allBlocks) {
    if (!overlap(mario, p)) continue;
    const overlapX = Math.min(mario.x+mario.w, p.x+p.w) - Math.max(mario.x, p.x);
    const overlapY = Math.min(mario.y+mario.h, p.y+p.h) - Math.max(mario.y, p.y);
    if (overlapY < overlapX) {
      if (mario.vy >= 0 && mario.y + mario.h - mario.vy <= p.y + 4) {
        mario.y = p.y - mario.h; mario.vy = 0; mario.onGround = true;
      } else if (mario.vy < 0) {
        mario.y = p.y + p.h + 1; mario.vy = 1;
        if (p.type === 'question' && !p.hit) { p.hit = true; p.bounceAnim = 8; return { hitBlock: p }; }
      }
    } else {
      if (mario.x < p.x) mario.x = p.x - mario.w; else mario.x = p.x + p.w;
      mario.vx = 0;
    }
  }
  return null;
}

export default function Game({ onGameOver, onWin, username }) {
  const canvasRef = useRef(null);
  const stateRef = useRef(null);
  const keysRef = useRef({});
  const animRef = useRef(null);
  const [hud, setHud] = useState({ score:0, lives:3, coins:0, timeLeft:300 });
  const { user } = useAuth();

  const initState = useCallback(() => {
    const level = buildLevel();
    return {
      mario: { x:80, y:GH-2*T, w:36, h:46, vx:0, vy:0, onGround:false, facingRight:true, walkFrame:0, walkTick:0, dead:false },
      camera: { x:0 }, score:0, lives:3, coins:0, timeLeft:300, lastTime:0, timerTick:0, enemiesKilled:0, ...level
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    stateRef.current = initState();
    canvas.focus();
    const onKey = (e, down) => {
      keysRef.current[e.code] = down;
      if (['Space','ArrowUp','ArrowLeft','ArrowRight','ArrowDown','KeyA','KeyD','KeyW'].includes(e.code)) e.preventDefault();
    };
    window.addEventListener('keydown', e => onKey(e, true));
    window.addEventListener('keyup', e => onKey(e, false));

    function drawMario(ctx, x, y, fr, frame, dead) {
      ctx.save();
      if (dead) { ctx.translate(x + 18, y + 23); ctx.rotate(Math.PI); ctx.translate(-18, -23); }
      if (!fr) { ctx.translate(x + 36, y); ctx.scale(-1, 1); x = 0; } else { ctx.translate(x, y); x = 0; }
      if (!dead) { ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(18, 52, 16, 5, 0, 0, Math.PI*2); ctx.fill(); }
      ctx.fillStyle = '#cc0000'; ctx.fillRect(6, 0, 26, 10); ctx.fillRect(2, 8, 34, 6);
      ctx.fillStyle = '#5a2a00'; ctx.fillRect(2, 12, 4, 4);
      ctx.fillStyle = '#f5c87a'; ctx.fillRect(4, 12, 28, 18);
      ctx.fillStyle = '#111'; ctx.fillRect(12, 16, 5, 5);
      ctx.fillStyle = '#e8a060'; ctx.fillRect(18, 20, 8, 5);
      ctx.fillStyle = '#5a2a00'; ctx.fillRect(6, 24, 26, 4);
      ctx.fillStyle = '#1a4fcc'; ctx.fillRect(10, 28, 16, 14);
      ctx.fillStyle = '#cc0000'; ctx.fillRect(4, 28, 8, 14); ctx.fillRect(24, 28, 8, 14);
      ctx.fillStyle = '#f7c948'; ctx.fillRect(13, 32, 3, 3); ctx.fillRect(20, 32, 3, 3);
      ctx.fillStyle = '#5a2a00'; ctx.fillRect(4, 40, 28, 4);
      const legOffset = frame % 2 === 0 ? 0 : 4;
      ctx.fillStyle = '#cc0000'; ctx.fillRect(4, 44, 12, 14); ctx.fillRect(20, 44, 12, 14);
      ctx.fillStyle = '#3a1800'; ctx.fillRect(2, 52, 14 + legOffset, 6); ctx.fillRect(20 - legOffset, 52, 16, 6);
      ctx.restore();
    }

    function drawGoomba(ctx, x, y, alive, frame) {
      if (!alive) return;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(24, 50, 18, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#8b4513'; ctx.beginPath(); ctx.ellipse(24, 28, 20, 22, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#c07030'; ctx.beginPath(); ctx.ellipse(20, 20, 10, 8, -0.3, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(16, 22, 7, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(32, 22, 7, 8, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(17, 23, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(31, 23, 4, 5, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#3a1800'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(10,16); ctx.lineTo(22,19); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(38,16); ctx.lineTo(26,19); ctx.stroke();
      ctx.fillStyle = '#fff'; ctx.fillRect(14, 34, 6, 5); ctx.fillRect(28, 34, 6, 5);
      const wa = frame%2===0?0:3;
      ctx.fillStyle = '#3a1800'; ctx.fillRect(4+wa, 44, 16, 8); ctx.fillRect(28-wa, 44, 16, 8);
      ctx.restore();
    }

    function drawKoopa(ctx, x, y, alive, frame) {
      if (!alive) return;
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(24, 52, 16, 5, 0, 0, Math.PI*2); ctx.fill();
      const grad = ctx.createRadialGradient(22,24,2,24,26,20);
      grad.addColorStop(0,'#60cc30'); grad.addColorStop(1,'#1a6a00');
      ctx.fillStyle = grad; ctx.beginPath(); ctx.ellipse(24, 28, 18, 20, 0, 0, Math.PI*2); ctx.fill();
      ctx.strokeStyle = '#2a9a10'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(6,28); ctx.lineTo(42,28); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(24,8); ctx.lineTo(24,48); ctx.stroke();
      ctx.fillStyle = '#f5dc80'; ctx.beginPath(); ctx.ellipse(24, 8, 12, 10, 0, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#111'; ctx.beginPath(); ctx.ellipse(20, 6, 3, 4, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(28, 6, 3, 4, 0, 0, Math.PI*2); ctx.fill();
      const wa2 = frame%2===0?0:3;
      ctx.fillStyle = '#f5dc80'; ctx.fillRect(8+wa2, 42, 12, 10); ctx.fillRect(28-wa2, 42, 12, 10);
      ctx.restore();
    }

    function drawCoin(ctx, x, y, t) {
      const scaleX = Math.abs(Math.cos(t * 3));
      ctx.save(); ctx.translate(x + 8, y + 8); ctx.scale(scaleX, 1);
      ctx.fillStyle = '#f7c948'; ctx.beginPath(); ctx.arc(0, 0, 9, 0, Math.PI*2); ctx.fill();
      ctx.fillStyle = '#ffe97a'; ctx.beginPath(); ctx.arc(-2, -2, 4, 0, Math.PI*2); ctx.fill();
      ctx.restore();
    }

    function drawCloud(ctx, x, y, w, h) {
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath(); ctx.ellipse(x, y, w, h, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x-w*0.4, y+h*0.2, w*0.6, h*0.7, 0, 0, Math.PI*2); ctx.fill();
      ctx.beginPath(); ctx.ellipse(x+w*0.4, y+h*0.2, w*0.6, h*0.7, 0, 0, Math.PI*2); ctx.fill();
    }

    function spawnParticles(s, x, y, color, count=8) {
      for (let i=0; i<count; i++) {
        const angle = (Math.PI*2/count)*i + Math.random()*0.5;
        const spd = 2 + Math.random()*3;
        s.particles.push({ x, y, vx: Math.cos(angle)*spd, vy: Math.sin(angle)*spd - 2, r: 3+Math.random()*3, color, life: 30+Math.random()*20, maxLife: 50 });
      }
    }

    function spawnFloatText(s, x, y, text, color='#f7c948') {
      s.floatTexts.push({ x, y, text, color, life: 60, maxLife: 60, vy: -1.2 });
    }

    function draw(ctx, s, t) {
      const cam = s.camera.x;
      const sky = ctx.createLinearGradient(0, 0, 0, GH);
      sky.addColorStop(0, '#3a6cd4'); sky.addColorStop(0.6, '#6ea8fe'); sky.addColorStop(1, '#9bbcff');
      ctx.fillStyle = sky; ctx.fillRect(0, 0, GW, GH);
      ctx.fillStyle = 'rgba(100,180,80,0.3)';
      [[80,GH-90,70,50],[280,GH-80,90,55],[520,GH-95,65,48],[760,GH-85,80,52],[1040,GH-90,70,50],[1300,GH-88,85,54],[1600,GH-92,75,52]].forEach(([hx,hy,hw,hh])=>{
        const rx = hx - cam*0.3; if (rx > -200 && rx < GW+200) { ctx.beginPath(); ctx.ellipse(rx, hy, hw, hh, 0, 0, Math.PI*2); ctx.fill(); }
      });
      [[100,60,55,26],[350,45,65,30],[620,72,50,24],[950,55,60,28],[1230,60,55,26],[1550,50,65,30],[1850,65,50,24]].forEach(([cx,cy,cw,ch])=>{
        const rx = cx - cam * 0.2; if (rx > -150 && rx < GW+150) drawCloud(ctx, rx, cy, cw, ch);
      });
      ctx.fillStyle = '#4aaa28';
      [[150,GH-60,65,45],[420,GH-55,80,50],[780,GH-62,60,42],[1100,GH-58,72,48],[1420,GH-60,68,46],[1740,GH-56,75,50]].forEach(([hx,hy,hw,hh])=>{
        const rx = hx - cam*0.6; if (rx > -200 && rx < GW+200) { ctx.beginPath(); ctx.ellipse(rx, hy, hw, hh, 0, 0, Math.PI*2); ctx.fill(); }
      });
      for (const p of [...s.platforms, ...s.qblocks]) {
        const px = p.x - cam;
        if (px > -T && px < GW+T) {
          const by = p.type === 'question' && p.bounceAnim > 0 ? p.y - Math.sin(p.bounceAnim * 0.4) * 6 : p.y;
          if (p.type === 'ground') {
            const g = ctx.createLinearGradient(0, p.y, 0, p.y+T);
            g.addColorStop(0, '#7a5235'); g.addColorStop(1, '#4a2a14');
            ctx.fillStyle = g; ctx.fillRect(px, p.y, p.w, p.h);
            ctx.fillStyle = '#8b6040'; ctx.fillRect(px, p.y, p.w, 5);
            ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 1; ctx.strokeRect(px+0.5, p.y+0.5, p.w-1, p.h-1);
          } else if (p.type === 'brick') {
            ctx.fillStyle = '#c84c0c'; ctx.fillRect(px, p.y, p.w, p.h);
            ctx.fillStyle = '#a83a08'; ctx.fillRect(px, p.y+p.h/2-1, p.w, 2);
            ctx.fillRect(px+p.w/2-1, p.y, 2, p.h/2-1); ctx.fillRect(px+p.w/4, p.y+p.h/2+1, 2, p.h/2-1); ctx.fillRect(px+3*p.w/4, p.y+p.h/2+1, 2, p.h/2-1);
            ctx.fillStyle = 'rgba(255,180,100,0.15)'; ctx.fillRect(px+2, p.y+2, p.w-4, 5);
          } else if (p.type === 'question') {
            ctx.fillStyle = p.hit ? '#888' : '#f0a000'; ctx.fillRect(px, by, p.w, p.h);
            ctx.fillStyle = p.hit ? '#555' : '#ffd040'; ctx.fillRect(px+3, by+3, p.w-6, p.h-6);
            if (!p.hit) { ctx.fillStyle = 'rgba(255,255,200,0.3)'; ctx.fillRect(px+4, by+4, 8, p.h-8); }
            ctx.fillStyle = p.hit ? '#333' : '#7a4800'; ctx.font = 'bold 22px serif'; ctx.textAlign = 'center';
            ctx.fillText(p.hit ? '·' : '?', px+p.w/2, by+p.h*0.72);
          }
        }
      }
      for (const c of s.coins) {
        if (!c.collected) { const cx2 = c.x - cam; if (cx2 > -30 && cx2 < GW+30) drawCoin(ctx, cx2, c.y, t + c.animOffset); }
      }
      const frame = Math.floor(t * 6) % 2;
      for (const e of s.enemies) {
        if (!e.alive) continue; const ex = e.x - cam;
        if (ex > -T && ex < GW+T) { if (e.type === 'goomba') drawGoomba(ctx, ex, e.y, true, frame); else drawKoopa(ctx, ex, e.y, true, frame); }
      }
      const fx = s.flag.x - cam;
      if (fx > -T && fx < GW+T) {
        const pg = ctx.createLinearGradient(fx+T/2-3, 0, fx+T/2+3, 0);
        pg.addColorStop(0,'#ddd'); pg.addColorStop(0.5,'#fff'); pg.addColorStop(1,'#aaa');
        ctx.fillStyle = pg; ctx.fillRect(fx+T/2-3, s.flag.y, 6, s.flag.h+T);
        ctx.fillStyle = '#22bb22'; ctx.beginPath(); ctx.moveTo(fx+T/2+3, s.flag.y); ctx.lineTo(fx+T/2+34, s.flag.y+16); ctx.lineTo(fx+T/2+3, s.flag.y+32); ctx.fill();
        ctx.fillStyle = '#f7c948'; ctx.beginPath(); ctx.arc(fx+T/2, s.flag.y, 8, 0, Math.PI*2); ctx.fill();
        ctx.fillStyle = '#aaa'; ctx.fillRect(fx+T, GH-4*T, 3*T, 4*T);
        ctx.fillStyle = '#888'; for (let ci=0; ci<3; ci++) ctx.fillRect(fx+T+ci*(T)+4, GH-4*T-T/2, T/2-4, T/2);
        ctx.fillStyle = '#555'; ctx.fillRect(fx+T+T*0.9, GH-2*T, T*1.2, 2*T);
      }
      const m = s.mario; drawMario(ctx, m.x - cam, m.y, m.facingRight, m.walkFrame, m.dead);
      for (const p of s.particles) {
        if (p.life <= 0) continue; ctx.globalAlpha = p.life / p.maxLife; ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x - cam, p.y, p.r, 0, Math.PI*2); ctx.fill(); ctx.globalAlpha = 1;
      }
      for (const ft of s.floatTexts) {
        if (ft.life <= 0) continue; ctx.globalAlpha = ft.life / ft.maxLife; ctx.fillStyle = ft.color;
        ctx.font = 'bold 14px "Nunito"'; ctx.textAlign = 'center'; ctx.fillText(ft.text, ft.x - cam, ft.y); ctx.globalAlpha = 1;
      }
      ctx.fillStyle = 'rgba(0,0,0,0.025)'; for (let y=0; y<GH; y+=2) ctx.fillRect(0,y,GW,1);
    }

    function tick(ts) {
      const s = stateRef.current; if (!s) return;
      const dt = Math.min((ts - s.lastTime) / 16.67, 3); s.lastTime = ts; const t = ts / 1000;
      s.timerTick += dt; if (s.timerTick >= 60) { s.timeLeft = Math.max(0, s.timeLeft-1); s.timerTick = 0; }
      s.particles = s.particles.filter(p => p.life > 0);
      for (const p of s.particles) { p.x+=p.vx; p.y+=p.vy; p.vy+=0.15; p.life-=1; }
      s.floatTexts = s.floatTexts.filter(f => f.life > 0);
      for (const f of s.floatTexts) { f.y+=f.vy; f.life-=1; }
      for (const qb of s.qblocks) { if (qb.bounceAnim > 0) qb.bounceAnim -= dt; }
      const k = keysRef.current; const m = s.mario;
      if (k['ArrowLeft'] || k['KeyA']) { m.vx = Math.max(m.vx - 0.8, -MOVE_SPD); m.facingRight = false; }
      else if (k['ArrowRight'] || k['KeyD']) { m.vx = Math.min(m.vx + 0.8, MOVE_SPD); m.facingRight = true; }
      else { m.vx *= 0.78; if (Math.abs(m.vx) < 0.1) m.vx = 0; }
      if ((k['Space'] || k['ArrowUp'] || k['KeyW']) && m.onGround) { m.vy = JUMP_VEL; m.onGround = false; }
      if (!(k['Space'] || k['ArrowUp'] || k['KeyW']) && m.vy < -4) m.vy += 0.8;
      m.vy = Math.min(m.vy + GRAVITY * dt, MAX_FALL);
      m.x += m.vx * dt; m.y += m.vy * dt;
      m.x = Math.max(0, Math.min(m.x, s.worldWidth - m.w));
      if (m.onGround && Math.abs(m.vx) > 0.5) {
        m.walkTick += Math.abs(m.vx) * 0.08;
        if (m.walkTick >= 1) { m.walkFrame = (m.walkFrame+1)%4; m.walkTick = 0; }
      }
      const allBlocks = [...s.platforms, ...s.qblocks];
      const hitResult = resolveCollisions(m, allBlocks);
      if (hitResult?.hitBlock) { s.score += 200; spawnParticles(s, hitResult.hitBlock.x + T/2, hitResult.hitBlock.y, '#f7c948', 6); spawnFloatText(s, hitResult.hitBlock.x + T/2, hitResult.hitBlock.y - 10, '+200'); }
      const targetCam = Math.max(0, Math.min(m.x - GW/2 + m.w/2, s.worldWidth - GW));
      s.camera.x += (targetCam - s.camera.x) * 0.12;
      for (const c of s.coins) {
        if (!c.collected && overlap(m, { x:c.x-6, y:c.y-6, w:c.w+12, h:c.h+12 })) {
          c.collected = true; s.coins_count = (s.coins_count||0) + 1; s.score += 100;
          spawnParticles(s, c.x+8, c.y+8, '#f7c948', 5); spawnFloatText(s, c.x+8, c.y-8, '+100');
        }
      }
      for (const e of s.enemies) {
        if (!e.alive) continue;
        e.x += e.vx * dt; e.vy = Math.min((e.vy||0) + GRAVITY*dt, MAX_FALL); e.y += e.vy * dt;
        e.onGround = false;
        for (const p of s.platforms) {
          if (overlap({x:e.x,y:e.y,w:T,h:T}, p)) {
            const oy = Math.min(e.y+T, p.y+p.h) - Math.max(e.y, p.y);
            const ox = Math.min(e.x+T, p.x+p.w) - Math.max(e.x, p.x);
            if (oy < ox) { if (e.vy >= 0) { e.y = p.y-T; e.vy=0; e.onGround=true; } }
            else { e.vx *= -1; if (e.x < p.x) e.x = p.x-T; else e.x = p.x+p.w; }
          }
        }
        if (e.onGround) {
          let hasGround = false; const nextX = e.x + (e.vx > 0 ? T+2 : -2);
          for (const p of s.platforms) { if (nextX < p.x+p.w && nextX+T > p.x && e.y+T >= p.y && e.y+T <= p.y+p.h+4) { hasGround = true; break; } }
          if (!hasGround) e.vx *= -1;
        }
        if (e.x < 0) { e.x=0; e.vx=Math.abs(e.vx); }
        if (e.x > s.worldWidth-T) { e.x=s.worldWidth-T; e.vx=-Math.abs(e.vx); }
        if (e.y > GH+100) { e.alive=false; continue; }
        if (overlap(m, {x:e.x+4,y:e.y+4,w:T-8,h:T-8})) {
          const stomped = m.vy > 0 && m.y + m.h < e.y + T*0.55;
          if (stomped) {
            e.alive = false; s.score += 200; s.enemiesKilled++; m.vy = JUMP_VEL * 0.55;
            spawnParticles(s, e.x+T/2, e.y+T/2, '#8b4513', 10); spawnFloatText(s, e.x+T/2, e.y, '+200');
          } else {
            s.lives--; spawnParticles(s, m.x+m.w/2, m.y+m.h/2, '#cc0000', 12);
            if (s.lives <= 0) { onGameOver(s.score, s.enemiesKilled, s.coins_count||0); cancelAnimationFrame(animRef.current); return; }
            const saved = { score:s.score, lives:s.lives, enemiesKilled:s.enemiesKilled, coins_count:s.coins_count };
            stateRef.current = { ...initState(), ...saved }; return;
          }
        }
      }
      if (overlap(m, s.flag)) { const bonus = s.timeLeft * 10; s.score += bonus; onWin(s.score, s.enemiesKilled, s.coins_count||0, s.timeLeft); cancelAnimationFrame(animRef.current); return; }
      if (m.y > GH + 80) {
        s.lives--; if (s.lives <= 0) { onGameOver(s.score, s.enemiesKilled, s.coins_count||0); cancelAnimationFrame(animRef.current); return; }
        const saved = { score:s.score, lives:s.lives, enemiesKilled:s.enemiesKilled, coins_count:s.coins_count };
        stateRef.current = { ...initState(), ...saved }; return;
      }
      if (s.timeLeft <= 0) {
        s.lives--; if (s.lives <= 0) { onGameOver(s.score, s.enemiesKilled, s.coins_count||0); cancelAnimationFrame(animRef.current); return; }
        const saved = { score:s.score, lives:s.lives, enemiesKilled:s.enemiesKilled, coins_count:s.coins_count };
        stateRef.current = { ...initState(), ...saved }; return;
      }
      setHud({ score:s.score, lives:s.lives, coins:s.coins_count||0, timeLeft:s.timeLeft });
      const canvas2 = canvasRef.current; if (canvas2) draw(canvas2.getContext('2d'), s, t);
      animRef.current = requestAnimationFrame(tick);
    }

    stateRef.current.lastTime = performance.now();
    animRef.current = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(animRef.current); window.removeEventListener('keydown', e => onKey(e,true)); window.removeEventListener('keyup', e => onKey(e,false)); };
  }, [initState, onGameOver, onWin]);

  return (
    <div className="game-wrapper">
      <div className="hud">
        <div className="hud-item"><span className="hud-label">SCORE</span><span className="hud-val">{hud.score.toString().padStart(6,'0')}</span></div>
        <div className="hud-item"><span className="hud-label">🪙 COINS</span><span className="hud-val">{String(hud.coins).padStart(2,'0')}</span></div>
        <div className="hud-item hud-player"><span className="hud-label">PLAYER</span><span className="hud-val hud-name">{username || 'MARIO'}</span></div>
        <div className="hud-item"><span className="hud-label">❤ LIVES</span><span className="hud-val">{hud.lives}</span></div>
        <div className="hud-item"><span className="hud-label">TIME</span><span className={`hud-val ${hud.timeLeft < 60 ? 'hud-danger' : ''}`}>{hud.timeLeft}</span></div>
      </div>
      <canvas ref={canvasRef} width={GW} height={GH} className="game-canvas" tabIndex={0}/>
      <div className="mobile-controls">
        <button className="mc-btn" onPointerDown={()=>{keysRef.current['ArrowLeft']=true}} onPointerUp={()=>{keysRef.current['ArrowLeft']=false}} onPointerLeave={()=>{keysRef.current['ArrowLeft']=false}}>◀</button>
        <button className="mc-btn mc-jump" onPointerDown={()=>{keysRef.current['Space']=true}} onPointerUp={()=>{keysRef.current['Space']=false}} onPointerLeave={()=>{keysRef.current['Space']=false}}>▲ JUMP</button>
        <button className="mc-btn" onPointerDown={()=>{keysRef.current['ArrowRight']=true}} onPointerUp={()=>{keysRef.current['ArrowRight']=false}} onPointerLeave={()=>{keysRef.current['ArrowRight']=false}}>▶</button>
      </div>
    </div>
  );
}
