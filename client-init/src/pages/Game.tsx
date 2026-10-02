import { useEffect } from "react";

function Game() {
  useEffect(() => {
    import("../core/main.ts")
      .then(({ init }) => init())
      .catch((e) => {
        console.error(e);
      });
  }, []);

  return (
    <>
    <canvas id="game-canvas"></canvas>
    <canvas id="minimap" style={{
      width: "160px",
      height: "160px"
    }}></canvas>
    </>
  );
}

export default Game;
