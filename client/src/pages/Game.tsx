import { useEffect } from "react";
import { useParams } from "react-router";

function Game() {
  const { type } = useParams();

  useEffect(() => {
    if (type) {
      import("../core/main.ts")
        .then(({ init }) => init(type))
        .catch((e) => {
          console.error(e);
        });
    }
  }, [type]);

  return (
    <>
    <canvas id="game-canvas"></canvas>
    <canvas id="minimap"  className="w-40 h-40" style={{
      width: "160px",
      height: "160px"
    }}></canvas>
    </>
  );
}

export default Game;
