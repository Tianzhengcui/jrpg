// editor.js
// 一个最小可用的 tile + collision 编辑器

//import { draw } from "./js/draw";

const palette = document.getElementById("palette");
const pctx = palette.getContext("2d");
const mapCanvas = document.getElementById("mapCanvas");
const ctx = mapCanvas.getContext("2d");

const tileSizeEl = document.getElementById("tileSize");
const mapWEl = document.getElementById("mapW");
const mapHEl = document.getElementById("mapH");
const resizeBtn = document.getElementById("resizeBtn");
const tilesPathEl = document.getElementById("tilesPath");
const loadTilesBtn = document.getElementById("loadTilesBtn");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const downloadBtn = document.getElementById("downloadBtn");
const jsonBox = document.getElementById("jsonBox");
const modeBadge = document.getElementById("modeBadge");
const statusText = document.getElementById("statusText");
const drawSQ = document.getElementById("drawSQ");
const drawCir = document.getElementById("drawCir");
const showMode = document.getElementById("showMode");
const drawBig2 = document.getElementById("drawBig2")

ctx.imageSmoothingEnabled = false;
pctx.imageSmoothingEnabled = false;

let TILE = 32;
let mapW = 20;
let mapH = 15;

let tilesImg = new Image();
let tilesLoaded = false;

// 地形层：-1 表示空；>=0 表示 tileset 的 index（按横向排列）
let ground = [];
// 碰撞层：0 可走；1 不可走
let collision2D = [];

let paletteCols = 0;       // tileset 每行多少 tile
let selectedTile = 0;      // 当前选择的 tile index
let editMode = "ground";   // "ground" or "collision"
let tool = "brush";          // "brush" | "rect"
let rectStart = null;        // {x,y} 起点tile
let rectPreview = null;      // {x0,y0,x1,y1} 预览范围
let zoom = 1;          // 当前缩放倍数
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 4;

function applyZoom(){
  // 地图画布显示缩放
  mapCanvas.style.width  = (mapCanvas.width  * zoom) + "px";
  mapCanvas.style.height = (mapCanvas.height * zoom) + "px";

  // 如果你也想让 palette 同步缩放（可选）
  palette.style.width  = (palette.width  * zoom) + "px";
  palette.style.height = (palette.height * zoom) + "px";
}



// ---------- utils ----------
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function rebuildMap(){
  TILE = parseInt(tileSizeEl.value, 10);
  mapW = parseInt(mapWEl.value, 10);
  mapH = parseInt(mapHEl.value, 10);

  ground = Array.from({length: mapH}, () => Array.from({length: mapW}, () => -1));
  collision2D = Array.from({length: mapH}, () => Array.from({length: mapW}, () => 0));


  mapCanvas.width = mapW * TILE;
  mapCanvas.height = mapH * TILE;

  redrawAll();
}

function loadTiles(src){
  tilesLoaded = false;
  tilesImg = new Image();
  tilesImg.onload = () => {
    tilesLoaded = true;
    paletteCols = Math.floor(tilesImg.width / TILE);

    // 调整 palette 画布大小（显示整张 tileset）
    palette.width = tilesImg.width;
    palette.height = tilesImg.height;

    redrawPalette();
    redrawAll();
    applyZoom();
  };
  tilesImg.onerror = () => {
    tilesLoaded = false;
    alert("tiles.png 加载失败：检查路径是否正确，并用 http server 打开页面");
  };
  tilesImg.src = src;
}

function tileToSrcRect(tileIndex){
  const cols = paletteCols || 1;
  const sx = (tileIndex % cols) * TILE;
  const sy = Math.floor(tileIndex / cols) * TILE;
  return { sx, sy, sw: TILE, sh: TILE };
}

function redrawPalette(){
  pctx.clearRect(0,0,palette.width,palette.height);
  if(tilesLoaded){
    pctx.drawImage(tilesImg, 0, 0);
    // 选中框
    const { sx, sy } = tileToSrcRect(selectedTile);
    pctx.strokeStyle = "yellow";
    pctx.lineWidth = 2;
    pctx.strokeRect(sx+1, sy+1, TILE-2, TILE-2);
  } else {
    pctx.fillStyle = "#222";
    pctx.fillRect(0,0,palette.width,palette.height);
    pctx.fillStyle = "#fff";
    pctx.fillText("tiles not loaded", 10, 20);
  }
}

function drawMap(){
  ctx.clearRect(0,0,mapCanvas.width,mapCanvas.height);

  // ground
  for(let y=0;y<mapH;y++){
    for(let x=0;x<mapW;x++){
      const t = ground[y][x];
      if(t === -1) continue;
      if(!tilesLoaded) continue;

      const { sx, sy, sw, sh } = tileToSrcRect(t);
      ctx.drawImage(tilesImg, sx, sy, sw, sh, x*TILE, y*TILE, TILE, TILE);
    }
  }

  // grid（淡）
  ctx.save();
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 1;
  for(let x=0;x<=mapW;x++){
    ctx.beginPath();
    ctx.moveTo(x*TILE, 0);
    ctx.lineTo(x*TILE, mapH*TILE);
    ctx.stroke();
  }
  for(let y=0;y<=mapH;y++){
    ctx.beginPath();
    ctx.moveTo(0, y*TILE);
    ctx.lineTo(mapW*TILE, y*TILE);
    ctx.stroke();
  }
  ctx.restore();
}

function drawCollisionOverlay(){
  ctx.save();
  ctx.fillStyle = "rgba(255,0,0,0.25)";
  for(let y=0;y<mapH;y++){
    for(let x=0;x<mapW;x++){
      if(collision2D[y][x] === 1){
        ctx.fillRect(x*TILE, y*TILE, TILE, TILE);
      }
    }
  }
  ctx.restore();
}

function redrawAll(){
    drawMap();
    if(editMode === "collision") drawCollisionOverlay();
    updateStatus();
    applyZoom();
}

function updateStatus(){
    modeBadge.textContent = editMode === "ground" ? "模式：地形" : "模式：碰撞";
    statusText.textContent =
        `tile=${selectedTile}  |  模式=${editMode}  |  ground: -1 空 / >=0 瓦片  |  collision: 0 可走 / 1 墙`;
}

// ---------- interactions ----------
palette.addEventListener("click", (e) => {
  if(!tilesLoaded) return;

  const rect = palette.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) * (palette.width / rect.width));
  const y = Math.floor((e.clientY - rect.top) * (palette.height / rect.height));

  const tx = Math.floor(x / TILE);
  const ty = Math.floor(y / TILE);

  const cols = paletteCols || 1;
  const idx = ty * cols + tx;

  // 防止点到图片外的空区
  const maxTiles = cols * Math.floor(tilesImg.height / TILE);
  selectedTile = clamp(idx, 0, Math.max(0, maxTiles - 1));

  redrawPalette();
  updateStatus();
});

// 禁用右键菜单，方便擦除
mapCanvas.addEventListener("contextmenu", (e) => e.preventDefault());

function applyAtCanvas(e){
  const rect = mapCanvas.getBoundingClientRect();
  const mx = Math.floor((e.clientX - rect.left) * (mapCanvas.width / rect.width));
  const my = Math.floor((e.clientY - rect.top) * (mapCanvas.height / rect.height));

  const tx = Math.floor(mx / TILE);
  const ty = Math.floor(my / TILE);

  if(tx < 0 || ty < 0 || tx >= mapW || ty >= mapH) return;

  const isRight = (e.buttons === 2) || (e.button === 2);

  if(editMode === "ground"){
    if(isRight){
      ground[ty][tx] = -1; // 擦除
    }else{
      ground[ty][tx] = selectedTile; // 涂瓦片
    }
  } else {
    // collision：左键切换 0/1，右键强制清 0
    if(isRight){
        collision2D[ty][tx] = 0;
    }else{
        collision2D[ty][tx] = (collision2D[ty][tx] === 1) ? 0 : 1;
    }
  }

  redrawAll();
}

let painting = false;

mapCanvas.addEventListener("mousedown", (e) => {
  painting = true;
  applyAtCanvas(e);
  if (drawShape === "sq"){
    istodraw = true;
    SQ1 = getTileFromEvent(e);
  }
});
function getTileFromEvent(e){
  const rect = mapCanvas.getBoundingClientRect();
  const mx = (e.clientX - rect.left) * (mapCanvas.width / rect.width);
  const my = (e.clientY - rect.top)  * (mapCanvas.height / rect.height);

  // 就算鼠标在画布外，也钳制到边界，确保能收尾
  const tx = clamp(Math.floor(mx / TILE), 0, mapW - 1);
  const ty = clamp(Math.floor(my / TILE), 0, mapH - 1);
  return [tx, ty ];
}

window.addEventListener("mouseup", (e) => {
  painting = false;
  applyAtCanvas(e);
  if(drawShape === "sq") SQdrawing(e);
  
});
function Bigdraw(e){
  let point = getTileFromEvent(e);
  if(true){
    ground[point[1]][point[0]] = selectedTile;
    ground[point[1] +1][point[0]+1] = selectedTile;
    ground[point[1]+1][point[0]+2] = selectedTile;
    ground[point[1]+2][point[0]+1] = selectedTile;
    ground[point[1]+0][point[0]+2] = selectedTile;
    ground[point[1]+2][point[0]+0] = selectedTile;
    ground[point[1]][point[0]+1] = selectedTile;
    ground[point[1]+1][point[0]-1] = selectedTile;
    ground[point[1]][point[0]-1] = selectedTile;
    ground[point[1]-1][point[0]] = selectedTile;
    ground[point[1]-1][point[0]+1] = selectedTile;
  }
  redrawAll();

}
function SQdrawing(e){
  SQ2 = getTileFromEvent(e);
  if(SQ1[0]> SQ2[0]){
    let sq3 = SQ1[0];
    SQ1[0] = SQ2[0];
    SQ2[0] = sq3
  }
  if(SQ1[1]> SQ2[1]){
    let sq3 = SQ1[1];
    SQ1[1] = SQ2[1];
    SQ2[1] = sq3
  }
  SQQ = [SQ1, SQ2];
  istodraw = true;
    if(drawShape === "sq" && istodraw){
      for(let iy = 0; iy <= Math.abs(SQQ[1][1] - SQQ[0][1]);iy++){
        for(let i = 0; i <= Math.abs(SQQ[1][0] - SQQ[0][0]);i++){
            ground[SQQ[1][1]- iy][SQQ[1][0] - i] = selectedTile
        }
      }
      istodraw = false;
    }
  redrawAll(); 
}

mapCanvas.addEventListener("mousemove", (e) => {
  if(!painting) return;
  // 左键拖动涂，右键拖动擦
  applyAtCanvas(e);
  if(drawShape === "big") Bigdraw(e);
});

window.addEventListener("keydown", (e) => {
    if(e.key === "c" || e.key === "C"){
        editMode = "collision";
        redrawAll();
  }
    if(e.key === "g" || e.key === "G"){
        editMode = "ground";
        redrawAll();
  }
});

// ---------- import / export ----------
function collision2DToStrings(c2d){
    return c2d.map(row => row.map(v => (v ? "1" : "0")).join(""));
}

function collisionStringsTo2D(lines, width){
    return lines.map(line => {
    // 允许 line 是 "0101..." 或者带空格 "0 1 0 1"
        const s = String(line).replace(/\s+/g, "");
        const arr = [];
        for(let i=0;i<width;i++){
            arr.push(s[i] === "1" ? 1 : 0);
        }
        return arr;
    });
}

function exportJSON(){
  const data = {
    tileSize: TILE,
    width: mapW,
    height: mapH,
    layers: {
        ground: ground, // 还是二维 int
        collision: collision2DToStrings(collision2D) // ✅ string array
    }
  };

  // ✅ 关键：让 ground 每行一行，不要每个数竖着
  jsonBox.value = JSON.stringify(data, null, 2)
    .replace(/\[\s*([-\d,\s]+?)\s*\]/g, (m) => m.replace(/\s+/g, " ")); 
}


function importJSON(){
  let obj;
  try{
    obj = JSON.parse(jsonBox.value);
  }catch(err){
    alert("JSON 解析失败：\n" + err.message);
    return;
  }

  if(!obj || !obj.layers || !obj.layers.ground || !obj.layers.collision){
    alert("JSON 缺少 layers.ground / layers.collision");
    return;
  }

  TILE = parseInt(obj.tileSize, 10) || TILE;
  mapW = parseInt(obj.width, 10);
  mapH = parseInt(obj.height, 10);

  tileSizeEl.value = String(TILE);
  mapWEl.value = String(mapW);
  mapHEl.value = String(mapH);

  // ground：二维 int
  ground = obj.layers.ground;

  // collision：把 string[] 转回二维 0/1
  const col = obj.layers.collision;

  if(Array.isArray(col) && typeof col[0] === "string"){
    collision2D = collisionStringsTo2D(col, mapW);
  }else if(Array.isArray(col) && Array.isArray(col[0])){
    // 兼容：如果有人存的是二维数组
    collision2D = col;
  }else{
    alert("layers.collision 格式不支持（应为 string[] 或 2D array）");
    return;
  }

  mapCanvas.width = mapW * TILE;
  mapCanvas.height = mapH * TILE;

  // tileset 可能尺寸变了，重新算 paletteCols
  if(tilesLoaded){
    paletteCols = Math.floor(tilesImg.width / TILE);
    redrawPalette();
  }

  redrawAll();
}

function downloadJSON(){
  exportJSON();
  const blob = new Blob([jsonBox.value], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "map.json";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
let drawShape = "none";
let SQ1 = [-1,-1];
let SQ2 = [-1,-1];
let SQQ = [SQ1, SQ2];
let SQed = [0, 0];
let istodraw = false;
function pointNumber(){
  if(SQ1[0]!== -1 && SQ2[0] != -1){
    return 2
  }
  if(SQ1[0]=== -1 && SQ2[0] === -1){
    return 0
  }
  if(SQ1[0]!== -1){
    return 1
  }
}
function drawBig1(){
  if(drawShape !== "big"){
    drawShape = "big";

    showMode.textContent = "绘制模式：大号笔"
    return 0;
  }
  else if (drawShape === "big"){
    drawShape = "none";
    showMode.textContent = "绘制模式：默认"
    console.log("DRAWSHAPE   ", drawShape, "SQED   ", SQed);
    return 0;
  }
}
function drawSQ1(){
  if(drawShape !== "sq"){
    drawShape = "sq";
    console.log("DRAWSHAPE   ", drawShape, "SQED   ", SQed);
    showMode.textContent = "绘制模式： 方形"
    return 0;
  }
  else if (drawShape === "sq"){
    drawShape = "none";
    showMode.textContent = "绘制模式：默认"
    console.log("DRAWSHAPE   ", drawShape, "SQED   ", SQed);
    return 0;
  }


  console.log("SQ1   ", SQ1, "SQ2   ", SQ2  ,"SQQ   ", SQQ, "DRAWSHAPE   ", drawShape, "SQED   ", SQed);

}
mapCanvas.addEventListener("wheel", (e) => {
  // 想要“按住Ctrl才缩放”就打开下面这一句
  // if(!e.ctrlKey) return;

  e.preventDefault();

  const step = 1.1;
  if(e.deltaY < 0) zoom *= step;  // 向上滚：放大
  else zoom /= step;             // 向下滚：缩小

  zoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, zoom));
  applyZoom();
}, { passive: false });


// ---------- ui wiring ----------
resizeBtn.addEventListener("click", rebuildMap);
loadTilesBtn.addEventListener("click", () => loadTiles(tilesPathEl.value));
exportBtn.addEventListener("click", exportJSON);
importBtn.addEventListener("click", importJSON);
downloadBtn.addEventListener("click", downloadJSON);
drawSQ.addEventListener("click", drawSQ1);
if(drawBig2) drawBig2.addEventListener("click", drawBig1);
//drawCir.addEventListener("click", drawCir);

// ---------- boot ----------
rebuildMap();
loadTiles(tilesPathEl.value);
