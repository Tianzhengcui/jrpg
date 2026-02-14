import { player } from "./world.js";
import { isWalkable  } from "./world.js"
const TILE0 = 32


let show=false;
window.addEventListener("keydown",(e)=>{
    if(e.key=="`") show=!show;
});

export function debugUpdate(ctx){
    if(!show) return;
    ctx.fillStyle="white";
    ctx.fillText("X:"+player.x+" Y:"+player.y,10,20);
}
export const debugColl = {
  left: 0, right: 0, top: 0, bottom: 0,
  corners: [],   // [{tx,ty,walkable}]
  cx: 0, cy: 0, tx: 0, ty: 0
};

export function updateDebugInfo(x, y){
  const left   = Math.floor(x / TILE0);
  const right  = Math.floor((x + player.w - 1) / TILE0);
  const top    = Math.floor(y / TILE0);
  const bottom = Math.floor((y + player.h - 1) / TILE0);

  const cx = x + player.w / 2;
  const cy = y + player.h / 2;
  const tx = Math.floor(cx / TILE0);
  const ty = Math.floor(cy / TILE0);

  debugColl.left = left;
  debugColl.right = right;
  debugColl.top = top;
  debugColl.bottom = bottom;

  debugColl.cx = cx;
  debugColl.cy = cy;
  debugColl.tx = tx;
  debugColl.ty = ty;

  debugColl.corners = [
    { tx: left,  ty: top,    walkable: isWalkable(left, top) },
    { tx: right, ty: top,    walkable: isWalkable(right, top) },
    { tx: left,  ty: bottom, walkable: isWalkable(left, bottom) },
    { tx: right, ty: bottom, walkable: isWalkable(right, bottom) },
  ];
}
