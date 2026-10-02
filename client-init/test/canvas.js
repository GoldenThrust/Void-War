export let canvas,ctx, width, height;

export function setCanvas(cs){
    canvas =cs;
    ctx = cs.getContext("2d");
    width = cs.width;
    height = cs.height;
}