(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  canvas.tabIndex = 0;
  const tilesImg = new Image();
  tilesImg.src = "assets/tiles.png";

  const playerImg = new Image();
  playerImg.src = "assets/player.png";


  // ===== 输入（键盘 + 触屏）=====
  const keys = new Set();
  const touchKeys = new Set();
  const setKey = (k, down) => down ? touchKeys.add(k) : touchKeys.delete(k);
  const down = (k) => keys.has(k) || touchKeys.has(k);

  // 触屏方向键
  document.querySelectorAll(".btn[data-k]").forEach(btn => {
    const k = btn.getAttribute("data-k");
    const pd = (e)=>{ e.preventDefault(); setKey(k,true); canvas.focus(); };
    const pu = (e)=>{ e.preventDefault(); setKey(k,false); };
    btn.addEventListener("pointerdown", pd);
    btn.addEventListener("pointerup", pu);
    btn.addEventListener("pointercancel", pu);
    btn.addEventListener("pointerleave", pu);
  });

  // 触屏 A / RUN
  let aPressed = false;
  document.getElementById("btnA").addEventListener("pointerdown", (e)=>{ e.preventDefault(); aPressed=true; canvas.focus(); });
  document.getElementById("btnA").addEventListener("pointerup",   (e)=>{ e.preventDefault(); aPressed=false; });
  document.getElementById("btnA").addEventListener("pointercancel", ()=>{ aPressed=false; });

  const btnRun = document.getElementById("btnRun");
  btnRun.addEventListener("pointerdown", (e)=>{ e.preventDefault(); setKey("run", true); canvas.focus(); });
  const runUp = (e)=>{ if(e) e.preventDefault(); setKey("run", false); };
  btnRun.addEventListener("pointerup", runUp);
  btnRun.addEventListener("pointercancel", runUp);
  btnRun.addEventListener("pointerleave", runUp);

  // 键盘
  window.addEventListener("keydown", (e)=>{
    const k = e.key.toLowerCase();
    if (["arrowup","arrowdown","arrowleft","arrowright"," "].includes(k)) e.preventDefault();
    if (k==="w"||k==="arrowup") keys.add("up");
    if (k==="s"||k==="arrowdown") keys.add("down");
    if (k==="a"||k==="arrowleft") keys.add("left");
    if (k==="d"||k==="arrowright") keys.add("right");
    if (k==="shift") keys.add("run");
    if (k===" "||k==="enter") keys.add("A");
  }, {passive:false});
  window.addEventListener("keyup", (e)=>{
    const k = e.key.toLowerCase();
    if (k==="w"||k==="arrowup") keys.delete("up");
    if (k==="s"||k==="arrowdown") keys.delete("down");
    if (k==="a"||k==="arrowleft") keys.delete("left");
    if (k==="d"||k==="arrowright") keys.delete("right");
    if (k==="shift") keys.delete("run");
    if (k===" "||k==="enter") keys.delete("A");
  });

  // ===== 工具 =====
  const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
  const rint = (a,b)=> a + Math.floor(Math.random()*(b-a+1));
  const chance = (p)=> Math.random() < p;

  // ===== 地图 =====
  const TILE = 32;
  const VIEW_W = canvas.width, VIEW_H = canvas.height;

  // 0地面 1墙 2草 3水(不可走)
  const map1 = [
    "11111111111111111111",
    "10000000000000000001",
    "10222222200002222001",
    "10200000200002002001",
    "10201110200002002001",
    "10200000200002222004",
    "10000000000000000001",
    "10000000011111100001",
    "10000000010000100001",
    "10002222010000100001",
    "10002002010000100001",
    "10002222010000100001",
    "10000000000000000001",
    "10000000000033330001",
    "10000000000033330001",
    "11111111111111111111",
  ].map(r=>r.split("").map(c=>parseInt(c,10)));
  const map2 = [
    "11111111111111111111",
    "10000000000000000001",
    "10222222200002222001",
    "10200000200002002001",
    "10201110200002002001",
    "10200000200002222001",
    "10000000000000000001",
    "10000000011111100001",
    "10000000010100100001",
    "10002222010100100001",
    "10002002010100100001",
    "10002222010100100001",
    "10000000000100000001",
    "10000110000133330001",
    "10001111000033330001",
    "11111111111111111111",
  ].map(r=>r.split("").map(c=>parseInt(c,10)));
  const MAP_H = map.length, MAP_W = map[0].length;

  function blocked(tx,ty){
    if(tx<0||ty<0||tx>=MAP_W||ty>=MAP_H) return true;
    const t = map[ty][tx];
    return (t===1 || t===3);
  }

  // ===== 玩家（地图）=====
  const player = { x: 3*TILE, y: 3*TILE, w:18, h:22, step:0, moving:false };

  function collides(px,py){
    const l=px, r=px+player.w, t=py, b=py+player.h;
    const tx0=Math.floor(l/TILE), tx1=Math.floor(r/TILE);
    const ty0=Math.floor(t/TILE), ty1=Math.floor(b/TILE);
    for(let y=ty0;y<=ty1;y++) for(let x=tx0;x<=tx1;x++) if(blocked(x,y)) return true;
    return false;
  }
  function tryMove(dx,dy){
    if(dx!==0){ const nx=player.x+dx; if(!collides(nx,player.y)) player.x=nx; }
    if(dy!==0){ const ny=player.y+dy; if(!collides(player.x,ny)) player.y=ny; }
  }

  // ===== 镜头 =====
  const cam={x:0,y:0};
  function updateCam(){
    const tx = player.x + player.w/2 - VIEW_W/2;
    const ty = player.y + player.h/2 - VIEW_H/2;
    cam.x = clamp(tx, 0, MAP_W*TILE - VIEW_W);
    cam.y = clamp(ty, 0, MAP_H*TILE - VIEW_H);
  }

  // ===== 可见敌人（地图上）=====
  const enemies = [
    { id:1, tx:9, ty:6,  alive:true, name:"混混", base:{hp:22, spd:8} },
    { id:2, tx:6, ty:11, alive:true, name:"插队哥", base:{hp:18, spd:10} },
  ];
  function enemyPos(e){ return { x:e.tx*TILE+7, y:e.ty*TILE+6, w:18, h:22 }; }

  function nearEnemy(){
    const px = (player.x+player.w/2)/TILE;
    const py = (player.y+player.h/2)/TILE;
    let best=null, bestD=999;
    for(const e of enemies){
      if(!e.alive) continue;
      const d = Math.abs(e.tx-px)+Math.abs(e.ty-py);
      if(d<bestD){ bestD=d; best=e; }
    }
    return (best && bestD<=1.3) ? best : null;
  }

  // ===== Toast =====
  let toast="", toastT=0;
  function showToast(msg){ toast=msg; toastT=1.8; }

  // ===== 状态机 =====
  let mode="WORLD"; // WORLD / BATTLE
  let battle=null;

  // ===== 战斗系统（2人小队 + 速度排序）=====
  function makeActor(name, hp, spd){
    return { name, hp, maxhp:hp, spd, guard:false };
  }

  function startBattle(e){
    const party = [
      makeActor("你", 30, 12),
      makeActor("朋友", 24, 9),
    ];
    const foe = makeActor(e.name, e.base.hp, e.base.spd);

    mode="BATTLE";
    battle = {
      enemyRef: e,
      party,
      foe,
      turnOrder: [],
      turnIndex: 0,
      phase: "MENU",     // MENU / ANIM / RESULT
      menu: { layer:0, sel:0, subSel:0, type:null },
      active: 0,         // 0/1=队友，-1=敌人
      log: `遇到 ${e.name}！`,
      lockInput: false,
      resultTimer: 0,
      latch: { A:false, up:false, down:false, left:false, right:false },
    };

    pityDebuffTurns = 0;
    recomputeOrder();
    battle.active = battle.turnOrder[0];
  }

  function recomputeOrder(){
    const a0 = { who:"P", idx:0, spd:battle.party[0].spd };
    const a1 = { who:"P", idx:1, spd:battle.party[1].spd };
    const en = { who:"E", idx:0, spd:battle.foe.spd };
    const arr = [a0,a1,en].sort((x,y)=> (y.spd - x.spd) || (Math.random()<0.5? -1:1));
    battle.turnOrder = arr.map(o => (o.who==="E" ? -1 : o.idx));
    battle.turnIndex = 0;
  }

  function endBattle(kind){
    battle.phase = "RESULT";
    battle.lockInput = true;
    battle.resultTimer = 1.0;

    if(kind==="WIN"){
      battle.log = "胜利！对方跑了。";
      battle.enemyRef.alive = false;
    } else if(kind==="FLEE"){
      battle.log = "你溜了（保命要紧）。";
    } else {
      battle.log = "你倒下了…（演示版：回满血回地图）";
    }
  }

  function backToWorld(){
    mode="WORLD";
    battle=null;
    showToast("回到地图。");
  }

  // ===== 战斗：数据 =====
  const mainMenu = ["攻击","技能","道具","逃跑","防御"];

  const skills = [
    { name:"推一把", type:"atk", dmg:[4,7] },
    { name:"甩书包", type:"atk", dmg:[6,10], crit:0.2 },
    { name:"假摔",  type:"debuff", text:"对方愣住了，下一击伤害-2", debuff:"soft" },
  ];
  const items = [
    { name:"奶茶", type:"heal", heal:[6,10], count:2 },
    { name:"创可贴", type:"heal", heal:[4,6], count:3 },
  ];

  const enemySkills = [
    { name:"挤人群", type:"aoe", dmg:[3,5], text:"人群一挤，大家都遭殃！" },
    { name:"装可怜", type:"buff", text:"对方装可怜，你方命中下降（2回合）" },
    { name:"喊朋友", type:"atk", dmg:[5,8], text:"对方叫朋友助推一把！" },
  ];

  // 简化：装可怜影响命中
  let pityDebuffTurns = 0;

  function doPlayerAction(actorIdx, action){
    const actor = battle.party[actorIdx];
    const foe = battle.foe;

    if(action.type==="guard"){
      actor.guard = true;
      battle.log = `${actor.name} 选择防御。`;
      return;
    }

    if(action.type==="flee"){
      if(chance(0.65)) endBattle("FLEE");
      else battle.log = "逃跑失败！（尴尬）";
      return;
    }

    if(action.type==="item"){
      const it = action.item;
      if(it.count <= 0){ battle.log = "道具用完了！"; return; }
      it.count -= 1;
      const heal = rint(it.heal[0], it.heal[1]);
      actor.hp = Math.min(actor.maxhp, actor.hp + heal);
      battle.log = `${actor.name} 使用 ${it.name}，回血 +${heal}。`;
      return;
    }

    if(action.type==="skill"){
      const s = action.skill;
      const hit = chance(pityDebuffTurns>0 ? 0.75 : 0.9);
      if(!hit){ battle.log = `${actor.name} 使用「${s.name}」但没打中…`; return; }

      if(s.type==="atk"){
        let dmg = rint(s.dmg[0], s.dmg[1]);
        if(s.crit && chance(s.crit)) dmg += 4;
        foe.hp = Math.max(0, foe.hp - dmg);
        battle.log = `${actor.name} 使用「${s.name}」，造成 ${dmg} 伤害。`;
      } else if(s.type==="debuff"){
        foe._soft = 1;
        battle.log = `${actor.name} 使用「${s.name}」。${s.text}`;
      }
      return;
    }
  }

  function doEnemyTurn(){
    const foe = battle.foe;
    const s = enemySkills[rint(0, enemySkills.length-1)];

    if(s.type==="buff"){
      pityDebuffTurns = 2;
      battle.log = `${foe.name} 使用「${s.name}」。${s.text}`;
      return;
    }

    if(s.type==="aoe"){
      battle.log = `${foe.name} 使用「${s.name}」。${s.text}`;
      for(const p of battle.party){
        const dmg0 = rint(s.dmg[0], s.dmg[1]);
        const dmg = p.guard ? Math.max(0, dmg0-2) : dmg0;
        p.hp = Math.max(0, p.hp - dmg);
      }
      return;
    }

    // 单体：打血更多的那位
    let targetIdx = battle.party[1].hp > battle.party[0].hp ? 1 : 0;
    const target = battle.party[targetIdx];

    let dmg0 = rint(s.dmg[0], s.dmg[1]);
    if(foe._soft){ dmg0 = Math.max(0, dmg0-2); foe._soft=0; }
    const dmg = target.guard ? Math.max(0, dmg0-2) : dmg0;

    target.hp = Math.max(0, target.hp - dmg);
    battle.log = `${foe.name} 使用「${s.name}」，${target.name} 受到 ${dmg} 伤害。`;
  }

  function checkBattleEnd(){
    const foe = battle.foe;
    const allDead = battle.party.every(p => p.hp <= 0);
    if(foe.hp <= 0){ endBattle("WIN"); return true; }
    if(allDead){
      // 演示：回满血回地图
      battle.party.forEach(p => p.hp = p.maxhp);
      endBattle("LOSE");
      return true;
    }
    return false;
  }

  function advanceTurn(){
    battle.party.forEach(p => p.guard = false);
    battle.turnIndex = (battle.turnIndex + 1) % battle.turnOrder.length;
    battle.active = battle.turnOrder[battle.turnIndex];
    if(pityDebuffTurns>0) pityDebuffTurns -= 1;
    battle.menu.layer=0; battle.menu.sel=0; battle.menu.subSel=0; battle.menu.type=null;
  }

  // ===== 输入边沿（战斗用）=====
  function battleEdges(){
    const A = (keys.has("A") || aPressed);
    const up = down("up"), dn = down("down"), lt = down("left"), rt = down("right");
    const le = battle.latch;
    const out = {
      a:  A && !le.A,
      up: up && !le.up,
      dn: dn && !le.down,
      lt: lt && !le.left,
      rt: rt && !le.right
    };
    le.A = A; le.up = up; le.down = dn; le.left = lt; le.right = rt;
    return out;
  }

  // ===== 绘制 =====
  function drawTile(t, x, y){
      ctx.drawImage(
        tilesImg,
        t * TILE, 0, TILE, TILE,   // 从tileset取第t个tile
        x, y, TILE, TILE
      );
  }


  function drawChara(px,py,color){
    ctx.globalAlpha=0.25; ctx.fillStyle="#000";
    ctx.beginPath(); ctx.ellipse(px+9, py+22, 12, 5, 0, 0, Math.PI*2); ctx.fill();
    ctx.globalAlpha=1;
    ctx.fillStyle=color; ctx.fillRect(px, py+6, 18, 16);
    ctx.fillStyle="#f1c27d"; ctx.fillRect(px+3, py, 12, 10);
  }
  let currentMap = map1;

  function loadMap(newmap){
    currentMap = newmap;
    player.x = 2*TILE;
    player.y = 2*TILE;
  }

  function drawWorldUI(){
    const e = nearEnemy();
    if(e){
      ctx.globalAlpha=0.9; ctx.fillStyle="#000";
      ctx.fillRect(10, VIEW_H-54, VIEW_W-20, 44);
      ctx.globalAlpha=1; ctx.fillStyle="#fff";
      ctx.font="14px system-ui, -apple-system, sans-serif";
      ctx.fillText(`A：战斗（${e.name}）`, 20, VIEW_H-28);
    }
    if(toastT>0){
      ctx.globalAlpha=0.92; ctx.fillStyle="#111";
      ctx.fillRect(10, 10, VIEW_W-20, 36);
      ctx.globalAlpha=1; ctx.fillStyle="#fff";
      ctx.font="14px system-ui, -apple-system, sans-serif";
      ctx.fillText(toast, 20, 33);
    }
  }

  function bar(x,y,w,h,ratio,color){
    ctx.fillStyle="#444"; ctx.fillRect(x,y,w,h);
    ctx.fillStyle=color; ctx.fillRect(x,y,w*clamp(ratio,0,1),h);
  }

  function drawBattle(){
    ctx.fillStyle="#1f1f1f"; ctx.fillRect(0,0,VIEW_W,VIEW_H);

    drawChara(110, 150, "#2b78e4"); // 你
    drawChara(160, 160, "#6aa84f"); // 朋友
    drawChara(470, 150, "#cc0000"); // 敌

    ctx.globalAlpha=0.9; ctx.fillStyle="#000";
    ctx.fillRect(10, 10, VIEW_W-20, 76);
    ctx.globalAlpha=1;

    ctx.fillStyle="#fff"; ctx.font="12px system-ui, -apple-system, sans-serif";
    ctx.fillText(`${battle.party[0].name} HP ${battle.party[0].hp}/${battle.party[0].maxhp}`, 20, 30);
    bar(20, 38, 180, 10, battle.party[0].hp/battle.party[0].maxhp, "#00c853");
    ctx.fillText(`${battle.party[1].name} HP ${battle.party[1].hp}/${battle.party[1].maxhp}`, 220, 30);
    bar(220, 38, 180, 10, battle.party[1].hp/battle.party[1].maxhp, "#00c853");

    ctx.fillText(`${battle.foe.name} HP ${battle.foe.hp}/${battle.foe.maxhp}`, 420, 30);
    bar(420, 38, 190, 10, battle.foe.hp/battle.foe.maxhp, "#ff5252");

    const orderText = battle.turnOrder.map(x => x===-1 ? "敌" : (x===0 ? "你" : "友")).join(" > ");
    ctx.fillStyle="#ddd";
    ctx.fillText(`顺序：${orderText}    当前：${battle.active===-1?"敌人":(battle.active===0?"你":"朋友")}`, 20, 68);

    ctx.globalAlpha=0.92; ctx.fillStyle="#000";
    ctx.fillRect(10, VIEW_H-150, VIEW_W-20, 140);
    ctx.globalAlpha=1;

    ctx.fillStyle="#fff"; ctx.font="14px system-ui, -apple-system, sans-serif";
    ctx.fillText(battle.log, 20, VIEW_H-122);

    // RESULT 时不画菜单
    if(battle.phase!=="MENU" || battle.active===-1){
      ctx.font="12px system-ui, -apple-system, sans-serif";
      ctx.fillText("（自动进行…）", 20, VIEW_H-20);
      return;
    }

    const mx=20, my=VIEW_H-100;

    if(battle.menu.layer===0){
      for(let i=0;i<mainMenu.length;i++){
        const prefix = (i===battle.menu.sel) ? "▶ " : "  ";
        ctx.fillText(prefix + mainMenu[i], mx, my + i*20);
      }
      ctx.font="12px system-ui, -apple-system, sans-serif";
      ctx.fillText("↑↓选择，A确认", 220, my+80);
    } else {
      const list = battle.menu.type==="skill" ? skills : items;
      for(let i=0;i<list.length;i++){
        const prefix = (i===battle.menu.subSel) ? "▶ " : "  ";
        const extra = (battle.menu.type==="item") ? ` x${list[i].count}` : "";
        ctx.fillText(prefix + list[i].name + extra, mx, my + i*20);
      }
      ctx.font="12px system-ui, -apple-system, sans-serif";
      ctx.fillText("A确认 / ←返回", 220, my+80);
    }
  }

  // ===== 主循环 =====
  let last = performance.now();
  let aLatchWorld = false;

  function loop(t){
    const dt = Math.min(0.05, (t-last)/1000);
    last = t;

    // WORLD A边沿
    const aNow = (keys.has("A") || aPressed);
    const aEdgeWorld = aNow && !aLatchWorld;
    aLatchWorld = aNow;

    if(mode==="WORLD"){
      const running = down("run");
      const speed = running ? 120 : 75;

      let dx=0, dy=0;
      if(down("up")) dy-=1;
      if(down("down")) dy+=1;
      if(down("left")) dx-=1;
      if(down("right")) dx+=1;

      player.moving = (dx!==0||dy!==0);
      if(player.moving){
        const len = Math.hypot(dx,dy) || 1;
        dx/=len; dy/=len;
        tryMove(dx*speed*dt, dy*speed*dt);
        player.step += speed*dt/15;
      }

      if(aEdgeWorld){
        const e = nearEnemy();
        if(e){ showToast(`你冲过去：${e.name}！`); startBattle(e); }
        else showToast("（附近没有敌人）");
      }

      if(toastT>0) toastT -= dt;
      updateCam();
      if(map[ty][tx] == 4){
        loadMap(map2);
      }

      ctx.clearRect(0,0,VIEW_W,VIEW_H);
      const x0=Math.floor(cam.x/TILE), y0=Math.floor(cam.y/TILE);
      const x1=Math.ceil((cam.x+VIEW_W)/TILE), y1=Math.ceil((cam.y+VIEW_H)/TILE);
      for(let y=y0;y<y1;y++) for(let x=x0;x<x1;x++){
        if(x<0||y<0||x>=MAP_W||y>=MAP_H) continue;
        drawTile(map[y][x], x*TILE-cam.x, y*TILE-cam.y);
      }

      for(const e of enemies){
        if(!e.alive) continue;
        const p = enemyPos(e);
        drawChara(p.x-cam.x, p.y-cam.y, "#cc0000");
        ctx.fillStyle="#fff";
        ctx.font="12px system-ui, -apple-system, sans-serif";
        ctx.fillText("!", p.x-cam.x+7, p.y-cam.y-2);
      }

      ctx.drawImage(playerImg, player.x-cam.x, player.y-cam.y, 32, 32);
      drawWorldUI();
    }
    

    if(mode==="BATTLE"){
      // RESULT：保证退回地图
      if(battle.phase==="RESULT"){
        battle.resultTimer -= dt;
        drawBattle();
        if(battle.resultTimer <= 0) backToWorld();
        requestAnimationFrame(loop);
        return;
      }

      // 敌人回合自动
      if(battle.active===-1 && battle.phase==="MENU" && !battle.lockInput){
        battle.lockInput = true;
        battle.phase = "ANIM";
        battle._animT = 0.45;
      }

      if(battle.phase==="ANIM"){
        battle._animT -= dt;
        if(battle._animT <= 0){
          if(battle.active===-1){
            doEnemyTurn();
            if(!checkBattleEnd()) advanceTurn();
          }
          battle.phase="MENU";
          battle.lockInput=false;
        }
      }

      // 玩家输入
      if(battle.phase==="MENU" && battle.active!==-1 && !battle.lockInput){
        const ed = battleEdges();

        if(battle.menu.layer===0){
          if(ed.up) battle.menu.sel = (battle.menu.sel + mainMenu.length - 1) % mainMenu.length;
          if(ed.dn) battle.menu.sel = (battle.menu.sel + 1) % mainMenu.length;

          if(ed.a){
            const pick = mainMenu[battle.menu.sel];
            if(pick==="攻击"){
              doPlayerAction(battle.active, {type:"skill", skill: skills[0]});
              if(!checkBattleEnd()) advanceTurn();
            } else if(pick==="技能"){
              battle.menu.layer=1; battle.menu.type="skill"; battle.menu.subSel=0;
            } else if(pick==="道具"){
              battle.menu.layer=1; battle.menu.type="item"; battle.menu.subSel=0;
            } else if(pick==="逃跑"){
              doPlayerAction(battle.active, {type:"flee"});
              if(battle.phase!=="RESULT") advanceTurn();
            } else if(pick==="防御"){
              doPlayerAction(battle.active, {type:"guard"});
              if(!checkBattleEnd()) advanceTurn();
            }
          }
        } else {
          const list = battle.menu.type==="skill" ? skills : items;
          const max = list.length;

          if(ed.up) battle.menu.subSel = (battle.menu.subSel + max - 1) % max;
          if(ed.dn) battle.menu.subSel = (battle.menu.subSel + 1) % max;
          if(ed.lt){ battle.menu.layer=0; battle.menu.type=null; }

          if(ed.a){
            if(battle.menu.type==="skill"){
              doPlayerAction(battle.active, {type:"skill", skill: list[battle.menu.subSel]});
              if(!checkBattleEnd()) advanceTurn();
            } else {
              doPlayerAction(battle.active, {type:"item", item: list[battle.menu.subSel]});
              if(!checkBattleEnd()) advanceTurn();
            }
          }
        }
      }

      drawBattle();
    }

    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
})();
