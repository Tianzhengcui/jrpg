export const STATE = {
    WORLD: "world",
    BATTLE: "battle",
    MENU: "menu",
    DIALOG: "dialog"
};
export const StoryState = {
    INTRO: 0,
    GOBLIN_DEFEATED: 1,
    KING_MET: 2
};
export let storyState = StoryState.INTRO;
export let gameState = STATE.WORLD;

export function setState(s){
    gameState = s;
}
export function setStoryState(s2){
    INTRO = s2;
}
