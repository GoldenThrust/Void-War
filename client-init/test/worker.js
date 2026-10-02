import { canvas, ctx, height, setCanvas, width } from "./canvas.js";

function animate(t) {
    ctx.fillRect(20, 20, width/2, height/2)
    requestAnimationFrame(animate);
}
self.onmessage = async (event) => {
    console.log(event.data);

    if (event.data.canvas) {
        setCanvas(event.data.canvas);
        requestAnimationFrame(animate);
    }
}
