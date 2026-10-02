import { InferenceSession, Tensor } from "onnxruntime-web";

type AIRequest = {
  type: "predict";
  selfData: Float32Array;
  enemyData: Float32Array;
  count: number;
};

let session: InferenceSession | undefined;

self.onmessage = async (event: MessageEvent<AIRequest | { type: "load"; url: string }>) => {
  if (event.data.type === "load") {
    session = await InferenceSession.create(event.data.url);
    self.postMessage({ type: "ready" });
    return;
  }

  if (!session) return;

  const { selfData, enemyData, count } = event.data;
  const output = await session.run({
    self_obs: new Tensor("float32", selfData, [count, 4]),
    enemy_obs: new Tensor("float32", enemyData, [count, 4]),
  });

  const actions = new Float32Array(output.action.data as Float32Array);
  self.postMessage({ type: "actions", actions }, { transfer: [actions.buffer] });
};
