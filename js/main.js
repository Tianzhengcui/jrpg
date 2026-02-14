import { initWorld, updateWorld } from "./world.js";
import { draw } from "./draw.js";
import { debugUpdate } from "./debug.js";
import { startDialog, drawDialog, handleDialogInput } from "./dialog.js";
import { STATE, gameState } from "./state.js";
import { joy } from "./joy.js";
import { drawBattle } from "./battle.js";


const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

initWorld();
console.log(joy.x)

function loop2(){
    updateWorld();
    draw(ctx);
    debugUpdate(ctx);
    requestAnimationFrame(loop);
}

export function loop(){

    if(gameState === STATE.WORLD){
        updateWorld();
        draw(ctx);
    }
    else if(gameState === STATE.DIALOG){
        draw(ctx);        // 画世界
        drawDialog(ctx);  // 叠加对话
    }
    else if(gameState === STATE.BATTLE){
        drawBattle(ctx);
    }

    requestAnimationFrame(loop);
}
loop();

window.addEventListener("keydown", e=>{

    if(gameState === STATE.WORLD && e.key === "e"){
        startDialog([
        {
            id :0,
            text: "你好，勇者。",
            choices: [
                { text: "继续", next: 1 },
                { text: "继续2", next: 1 }
            ]
        },
        {
            id : 1,
            text: "前方很危险。",
            choices: [
                { text: "知道了", next: null }
            ]
        }
        ]);

    }

    if(gameState === STATE.DIALOG){
        handleDialogInput(e.key);
    }

});


function handleChoice(i){
    console.log("选了:", dialog.choices[i]);
    setState(STATE.WORLD);
}
