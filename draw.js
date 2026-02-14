import { map, player, enemies, Mwidth, Mheight} from "./world.js";
//import { TILE } from "./maps.js";
import {  debugColl } from "./debug.js";
import { canInteract } from "./world.js";
import { ground, TILE } from "./world.js";
let camera = {
    x: 0,
    y: 0
};
let isMoving = true
const FRAME_W = 32;
const FRAME_H = 52;
const FRAME_COUNT = 3;
const ANIM_SPEED = 8; // 越大越慢
const titles = new Image();
titles.src="assets/tiles.png";

// assets.js 或 draw.js 顶部
const playerImg = new Image();
playerImg.src = "assets/player.png";

playerImg.onload = () => {
  console.log("player image loaded");
};
const DIR_ROW = {
    down: 0,
    left: 1,
    right: 2,
    up: 3
};
import { collision, showCollision} from "./world.js";
function stopperX(){
    if (((Mwidth -5) * (TILE) < player.x)||(player.x < TILE *5)){
        return true
    }
    else
        return false
}
function stopperY(){
    if (((Mheight-5) * (TILE) < player.y)||(player.y < TILE *5)){
        return true
    }
    else
        return false
}
export function drawCollisionOverlay(ctx){
    console.log(showCollision)
    if(!showCollision) return;
    ctx.save();
    ctx.fillStyle = "rgba(255,0,0,0.25)";
    for(let y=0;y<collision.length;y++){
        for(let x=0;x<collision[y].length;x++){
            if(collision[y][x] === "1"){
                ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
            }
        }
    }
    ctx.restore();
}


const enemyImg = new Image();
enemyImg.src = "assets/enemy.png";
enemyImg.onerror = () => {
    console.error("enemy image failed:", enemyImg.src);
};
titles.src = "assets/tiles.png";
titles.onload = () => {
  console.log("tiles image loaded");
};
playerImg.onerror = () => {
  console.error("player image failed:", playerImg.src);
};
titles.onerror = () => {
  console.error("TITles image failed:", titles.src);
};

export async function initWorld(){
  const m = await loadMap2D("./maps/map01.json");
  TILE = m.tileSize;
  ground = m.layers.ground;
  collision = m.layers.collision;

  // 键盘监听照旧...
}


export function closeEnemy(ctx){
    // 在 draw 函数里
    if(canInteract){
    // 小黑框
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(220, 420, 200, 40);
    // 文字
        ctx.fillStyle = "white";
        ctx.font = "16px monospace";
        ctx.fillText("[ Enter ] 战斗", 240, 445);
    }
}
function MoveViewX(){
    //console.log("DISS     TANCE        ", player.x - camera.x)
    if(((player.x - camera.x) > TILE* 16)&& !stopperX()){
        camera.x += 2
        return player.x - camera.x
    }
    else if(((player.x - camera.x) < TILE* 4) && !stopperX(1)){
        camera.x -= 2
        return (player.x - camera.x)*-1
    }
    else return 0
    ;
}
function MoveViewY(){
    //console.log("DISS     TANCE        ", player.x - camera.x)
    if(((player.y - camera.y) > TILE* 9)&& !stopperY()){
        camera.y += 2
        return player.y - camera.y
    }
    else if(((player.y - camera.y) < TILE* 2) && !stopperY()){
        camera.y -= 2
        return (player.y - camera.y)*-1
    }
    else return 0
    ;
}
export function draw(ctx){
    ctx.clearRect(0,0,640,480);
    let frame = 0;
    
    if(((player.x - camera.x)> 16 * TILE) && !stopperX()){
    //    camera.x += 2
    }
    else if((player.x < (camera.x + 4*TILE)) && !stopperX()){
    //    camera.x -= 2
    }
    else if((player.y > (camera.y + 14*TILE)) && !stopperY()){
        //camera.y += 2
    }
    else if((player.y < (camera.y + 2*TILE)) && !stopperY()){
      //  camera.y -= 2
    }
    for(let y=0;y<ground.length;y++){
        for(let x=0;x<ground[y].length;x++){
            const t = ground[y][x];
            if(t === -1) continue; // ✅ 空格子不画
            MoveViewX()
            MoveViewY()
            ctx.drawImage(
                titles,
                t*TILE, 0, TILE, TILE,
                (x)*TILE - camera.x, (y)*TILE - camera.y, TILE, TILE);
            
        }
    }
    
    console.log("play   x", player.x )
    console.log("camera   x", camera.x )
    console.log("      P -C", (player.x - camera.x)/TILE)
    ctx.fillStyle = "white";
    ctx.fillRect(camera.x, camera.y, 4, 4);

    // 画敌人
    for(const e of enemies){
        if(!e.alive) continue;

        if(enemyImg.complete && enemyImg.naturalWidth > 0){
        ctx.drawImage(enemyImg, e.x, e.y, e.w, e.h);
        }else{
            ctx.fillStyle = "purple";
            ctx.fillRect(e.x, e.y, e.w, e.h);
        }
    }

    // 画玩家（优先贴图）
    if (playerImg.complete && playerImg.naturalWidth > 0) {
        //ctx.drawImage(playerImg, player.x, player.y, 32, 64);
        if(player.moving){
            frame = Math.floor(player.animTime / ANIM_SPEED) % FRAME_COUNT;
        }
        const row = DIR_ROW[player.dir];

        ctx.drawImage(
            playerImg,
            frame * FRAME_W,
            row * FRAME_H,
            FRAME_W, FRAME_H,
            player.x - camera.x, player.y - camera.y,
            FRAME_W, FRAME_H
        );
        //console.log("frame   ", frame, "   DIR    ", player.dir)

    } else {
        ctx.fillStyle="red";
        ctx.fillRect(player.x, player.y, 32, 48);
    }
    closeEnemy(ctx)
    huawan(ctx)
    drawCollisionOverlay(ctx);
}

function huawan(ctx){
    // ====== 碰撞调试可视化 ======
    ctx.save();

    // 画玩家碰撞盒（绿色框）
    ctx.strokeStyle = "lime";
    ctx.lineWidth = 2;
    ctx.strokeRect(player.x - camera.x, player.y, player.w, player.h);

    // 画玩家中心点（白点）
    //ctx.fillStyle = "white";
    ctx.fillRect(debugColl.cx - 2, debugColl.cy - 2, 4, 4);

    // 画四个角对应的 tile（可走：青色，不可走：红色）
    for(const c of debugColl.corners){
        ctx.strokeStyle = c.walkable ? "cyan" : "red";
        ctx.lineWidth = 2;
        ctx.strokeRect(c.tx * TILE, c.ty * TILE, TILE, TILE);
    }

// 输出文字信息
    ctx.fillStyle = "white";
    ctx.font = "14px monospace";
    ctx.fillText(`center tile: (${debugColl.tx}, ${debugColl.ty})`, 10, 20);
    ctx.fillText(`tiles LRTB: L=${debugColl.left} R=${debugColl.right} T=${debugColl.top} B=${debugColl.bottom}`, 10, 40);

    ctx.restore();
}