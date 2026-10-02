import { useEffect, useState } from "react";
import { useParams } from "react-router";
import {
  Crosshair,
  Globe2,
  Hexagon,
  Zap,
} from "lucide-react";
import "../App.css";

type Telemetry = {
  life: number;
  maxLife: number;
  heat: number;
  speed: number;
  kills: number;
  friends: number;
  enemies: number;
  weapon: string;
  x: number;
  y: number;
};

function Game() {
  const { type } = useParams();
  const [telemetry, setTelemetry] = useState<Telemetry>({
    life: 10000,
    maxLife: 10000,
    heat: 0,
    speed: 0,
    kills: 0,
    friends: 0,
    enemies: 0,
    weapon: "Pulse Canon",
    x: 0,
    y: 0,
  });

  useEffect(() => {
    let cancelled = false;
    let telemetryTimer: number | undefined;

    if (type) {
      (async () => {
        try {
          const { init } = await import("../core/main.ts");
          await init(type);
          const [{ ship }, { default: ShipManager }] = await Promise.all([
            import("../core/player/ships/player.ts"),
            import("../core/player/ships/manager.ts"),
          ]);

          telemetryTimer = window.setInterval(() => {
            if (cancelled || !ship) return;
            setTelemetry({
              life: ship.life,
              maxLife: ship.maxLife,
              heat: ship.heatPercent,
              speed: Math.round(ship.speed),
              kills: ship.killScore,
              friends: ShipManager.friendsAlive,
              enemies: ShipManager.enemiesAlive,
              weapon: ship.weapon.name,
              x: Math.round(ship.x),
              y: Math.round(ship.y),
            });
          }, 250);
        } catch (error) {
          console.error(error);
        }
      })();
    }

    return () => {
      cancelled = true;
      if (telemetryTimer) window.clearInterval(telemetryTimer);
    };
  }, [type]);

  return (
    <main className="game-screen">
      <canvas id="game-canvas"></canvas>
      <div className="game-vignette" aria-hidden="true" />
      <div className="game-hud">
        <header className="game-topbar">
          <div className="game-brand"><span className="brand-mark"><Crosshair size={17} /></span><span>VOID <b>WAR</b></span></div>
          <div className="mission-status"><span className="live-pip" /> {type === "online" ? "NETWORK // FRONTIER" : "LOCAL // DEEP SPACE"}</div>
        </header>

        <section className="mission-readout"><span className="hud-kicker">MISSION 07-A</span><strong>{type === "online" ? "FRONTIER ASSAULT" : "VOID PROTOCOL"}</strong><span className="readout-line" /><span className="hud-muted">SECTOR 07 / BEYOND THE BELT</span><span className="hud-muted">X: {telemetry.x} / Y: {telemetry.y}</span></section>

        <section className="tactical-panel right-panel"><div className="panel-kicker"><Globe2 size={13} /> TACTICAL MAP</div><div className="map-legend"><span><i className="legend-player" /> YOU</span><span><i className="legend-hostile" /> HOSTILE</span></div><canvas id="minimap" /></section>

        <section className="ship-hud"><div className="ship-hud-label"><Hexagon size={14} /> M-04 // MINER <span>ONLINE</span></div><div className="hud-stat"><div><span>HULL INTEGRITY</span><strong>{Math.max(0, Math.round((telemetry.life / telemetry.maxLife) * 100))}%</strong></div><div className="hud-bar hull-bar"><i style={{ width: `${Math.max(0, (telemetry.life / telemetry.maxLife) * 100)}%` }} /></div></div><div className="hud-stat"><div><span>WEAPON HEAT</span><strong>{telemetry.heat}%</strong></div><div className="hud-bar heat-bar"><i style={{ width: `${Math.min(100, telemetry.heat)}%` }} /></div></div></section>

        <section className="bottom-center"><div className="combat-metric"><span>KILLS</span><strong>{String(telemetry.kills).padStart(3, "0")}</strong></div><div className="combat-metric"><span>VELOCITY</span><strong>{telemetry.speed}<small> KM/S</small></strong></div><div className="ability-chip active"><Zap size={15} fill="currentColor" /><span>{telemetry.weapon.toUpperCase()}</span><b>READY</b></div></section>
        <div className="crew-count"><span className="live-pip" /> ALLIES {telemetry.friends} <span className="enemy-pip" /> HOSTILES {telemetry.enemies}</div>
        <div className="game-controls"><span>ARROWS <b>STEER</b></span><span>SPACE <b>FIRE</b></span><span>SHIFT <b>BOOST</b></span></div>
      </div>
    </main>
  );
}

export default Game;
