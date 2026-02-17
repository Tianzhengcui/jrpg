//mport { map1, map2, TILE } from "./maps.js";
import { startBattle } from "./battle.js";
import { updateDebugInfo } from "./debug.js";
import { loadMap2D } from "./loadmap.js";
import { joy } from "./joy.js";
export let TILE = 32
export let ground = [];     // 渲染层二维数组
export let collision = [];  // 碰撞层二维数组
export let showCollision = false;
export let Mwidth = 10
export let Mheight = 20


window.addEventListener("keydown", (e) => {
  if(e.key === "F2") showCollision = !showCollision; // F2 开关
});

export async function initWorld(){
    const m = await loadMap2D("./maps/map01.json");
    TILE = m.tileSize;
    Mwidth = m.width;
    Mheight = m.height
    ground = m.layers.ground;
    collision = m.layers.collision;
    window.addEventListener("keydown",(e)=>{
        keys[e.key] = true;
    });
    window.addEventListener("keyup",(e)=>{
        keys[e.key] = false;
    });
 // 键盘监听照旧...
}


const keys = {};

export let map = ground;
export let canInteract = false;
let targetEnemy = null;
export const player2 = {x:640,y:64,speed:2};

export const player = {
    x:540,
    y:540,
    w:28,
    h:50,
    speed:2,
    animTime: 0,   // 动画计时
    moving: false,
    dir: "down"
};
export const enemies = [
    { x: 160, y: 96, w: 28, h: 28,speed: 2, animTime:0,moving:false,dir:"down", alive: true }
];

export function isWalkable(tx, ty){
  if(!collision[ty]) return false;
  return collision[ty][tx] === "0";
}

export function isWalkable2(tx, ty){
    if(!map[ty]) return false;
    return map[ty][tx] !== "1";
}
function checkDoor(){
    const cx = player.x + player.w/2;
    const cy = player.y + player.h/2;

    const tx = Math.floor(cx / TILE);
    const ty = Math.floor(cy / TILE);

    if(map[ty] && map[ty][tx] === "4"){
        map = (map === map1) ? map2 : map1;
        player.x = 64;
        player.y = 64;
    }
}


function canMove(x, y){
    const left   = Math.floor(x / TILE);
    const right  = Math.floor((x + player.w - 1) / TILE);
    const top    = Math.floor(y / TILE);
    const bottom = Math.floor((y + player.h - 1) / TILE);

    return (
        isWalkable(left,  top)    &&
        isWalkable(right, top)    &&
        isWalkable(left,  bottom) &&
        isWalkable(right, bottom)
    );
}

function rectHit(a, b){
    return (
        a.x < b.x + b.w &&
        a.x + a.w > b.x &&
        a.y < b.y + b.h &&
        a.y + a.h > b.y
    );
}



export function updateWorld(){
    let nextX = player.x;
    let nextY = player.y;
    let moved = false;

    // ====== 1) 虚拟摇杆优先（joy.x/joy.y ∈ [-1,1]）======
    const DEADZONE = 0.15;
    if (Math.abs(joy.x) > DEADZONE || Math.abs(joy.y) > DEADZONE) {
        // 用摇杆控制移动（推得越满越快）
        const mag = Math.min(1, Math.hypot(joy.x, joy.y));
        const speed = player.speed * (0.6 + 0.8 * mag); // 最小 0.6 倍，最大 1.4 倍

        nextX += joy.x * speed;
        nextY += joy.y * speed;
        moved = true;

        // 动画朝向：按分量更大的一轴决定
        if (Math.abs(joy.x) > Math.abs(joy.y)) {
            player.dir = joy.x > 0 ? "right" : "left";
        } else {
            player.dir = joy.y > 0 ? "down" : "up";
        }
    }
    // ====== 2) 没用摇杆时，才用键盘 WASD ======
    else if(keys["a"]){
        nextX -= player.speed;
        moved = true;
        player.dir = "left";
    }
    else if(keys["d"]){
        nextX += player.speed;
        moved = true;
        player.dir = "right";
    }
    else if(keys["w"]){
        nextY -= player.speed;
        moved = true;
        player.dir = "up";
    }
    else if(keys["s"]){
        nextY += player.speed;
        moved = true;
        player.dir = "down";
    }
    else {
        moved = false;
    }

    player.moving = moved;

    if(moved){
        player.animTime++;
    }else{
        player.animTime = 0;
    }

    // === 垂直方向碰撞 ===
    if(canMove(player.x, nextY)){
        player.y = nextY;
    }
            // === 水平方向碰撞 ===
    if(canMove(nextX, player.y)){
        player.x = nextX;
    }

    checkDoor();
    for(const e of enemies){
        if(!e.alive) continue;

        if(rectHit(player, e)){
              // 先直接消失
            startBattle();     // 触发战斗
            break;
        }
    }
    canInteract = false;
    targetEnemy = null;

    for(const e of enemies){
        if(!e.alive) continue;

        // 扩大敌人判定范围
        const range = {
            x: e.x - 3,
            y: e.y - 3,
            w: e.w + 5,
            h: e.h + 5
        };

        if(rectHit(player, range)){
            canInteract = true;
            targetEnemy = e;
            break;
        }
    }
    //updateDebugInfo(player.x, player.y);
}


export function updateWorld2(){
    let nextX = player.x;
    let nextY = player.y;

    if(keys["w"]) nextY -= player.speed;
    if(keys["s"]) nextY += player.speed;
    if(keys["a"]) nextX -= player.speed;
    if(keys["d"]) nextX += player.speed;

    const tx = Math.floor(nextX / TILE);
    const ty = Math.floor(nextY / TILE);
    const footX = player.x + TILE ;
    const footY = player.y + TILE ;




    if(isWalkable(tx, ty)){
        player.x = nextX;
        player.y = nextY;
    }

    // 门逻辑
    if(map[ty] && map[ty][tx] === "4"){
        map = (map === map1) ? map2 : map1;
        player.x = 32;
        player.y = 48;
    }
}

