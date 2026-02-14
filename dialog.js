import { setState, STATE } from "./state.js";

let dialogNodes = [];
let nodeIndex = 0;
let selected = 0;
export class DialogNode {
  constructor({ id, text, choices = [] }) {
    this.id = id;               // string
    this.text = text;           // string
    this.choices = choices;     // [{ text, next?, action? }]
  }
}

export function startDialog(nodes){
    dialogNodes = nodes;
    nodeIndex = 0;
    selected = 0;
    setState(STATE.DIALOG);
}

export function handleDialogInput(key){

    const node = dialogNodes[nodeIndex];
    if(!node) return;

    if(key === "w" || key === "ArrowUp"){
        selected = (selected - 1 + node.choices.length) % node.choices.length;
    }

    if(key === "s" || key === "ArrowDown"){
        selected = (selected + 1) % node.choices.length;
    }

    if(key === "Enter"){

        const next = node.choices[selected].next;

        if(next === null){
            closeDialog();
        }else{
            nodeIndex = next;
            selected = 0;
        }
    }

    if(key === "Escape"){
        closeDialog();
    }
}

function closeDialog(){
    dialogNodes = [];
    setState(STATE.WORLD);
}

export function drawDialog(ctx){

    const node = dialogNodes[nodeIndex];
    if(!node) return;

    ctx.fillStyle = "rgba(0,0,0,0.8)";
    ctx.fillRect(40, 340, 560, 120);

    ctx.fillStyle = "white";
    ctx.font = "18px monospace";

    ctx.fillText(node.text, 60, 370);

    for(let i=0;i<node.choices.length;i++){

        ctx.fillStyle = (i === selected) ? "yellow" : "white";

        ctx.fillText(
            node.choices[i].text,
            80,
            400 + i*25
        );
    }
}
