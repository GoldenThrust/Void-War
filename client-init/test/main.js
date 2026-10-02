const canvas = document.querySelector("canvas");

const worker = new Worker("./worker.js",{
    type: "module"
});
const offScreenCanvas = canvas.transferControlToOffscreen();
worker.postMessage({
    canvas: offScreenCanvas
}, [offScreenCanvas])