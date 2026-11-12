export type ServerUpdateRecord = {
  update: Record<string, unknown>;
  time: number;
};

const MAX_SERVER_UPDATE_HISTORY = 20;

export function recordServerUpdate(
  target: {
    lastUpdate: Record<string, unknown> | null;
    lastUpdateTime: number;
    updateHistory: ServerUpdateRecord[];
  },
  update: Record<string, unknown>,
  time = performance.timeOrigin + performance.now(),
) {
  const snapshot = { ...(target.lastUpdate ?? {}), ...update };
  target.lastUpdate = snapshot;
  target.lastUpdateTime = time;
  target.updateHistory.push({ update: snapshot, time });

  if (target.updateHistory.length > MAX_SERVER_UPDATE_HISTORY) {
    target.updateHistory.splice(
      0,
      target.updateHistory.length - MAX_SERVER_UPDATE_HISTORY,
    );
  }
}

export function interpolateServerUpdate(
  target: {
    updateHistory: ServerUpdateRecord[];
  },
  renderTime: number,
) {
  const history = target.updateHistory;
  if (history.length < 2) return {};

  const old = history[history.length - 2]!;
  const current = history[history.length - 1]!;
  const duration = current.time - old.time;
  const t =
    duration > 0
      ? Math.max(0, Math.min(1, (renderTime - old.time) / duration))
      : 1;
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(current.update)) {
    const oldValue = old.update[key];
    if (typeof value === "number" && typeof oldValue === "number") {
      result[key] = oldValue + (value - oldValue) * t;
    }
  }

  return result;
}
