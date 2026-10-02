import { useState } from "react";
import { Link } from "react-router";
import {
  Activity,
  ArrowUpRight,
  Crosshair,
  Gamepad2,
  Globe2,
  Headphones,
  Layers3,
  LockKeyhole,
  Radio,
  Shield,
  Sparkles,
  Target,
  Zap,
} from "lucide-react";
import "../App.css";

export default function Home() {
  const [mode, setMode] = useState<"online" | "offline">("online");

  return (
    <main className="command-deck">
      <div className="star-field" aria-hidden="true" />
      <header className="topbar">
        <Link className="brand" to="/" aria-label="Void War home">
          <span className="brand-mark"><Crosshair size={20} strokeWidth={1.5} /></span>
          <span>VOID <b>WAR</b></span>
        </Link>
        <div className="topbar-status"><span className="status-dot" /> Systems nominal</div>
        <button className="icon-button" aria-label="Audio settings" title="Audio settings"><Headphones size={18} /></button>
      </header>

      <div className="deck-layout">
        <aside className="side-rail">
          <div className="rail-line" />
          <span className="rail-label">COMMAND / 01</span>
          <div className="rail-glyphs"><Activity size={16} /><Radio size={16} /><Shield size={16} /></div>
          <span className="rail-version">v0.8.4</span>
        </aside>

        <section className="deck-content">
          <div className="eyebrow"><span className="eyebrow-line" /> PILOT CONSOLE <span>SECTOR 07 // THE VOID</span></div>
          <div className="hero-copy">
            <div>
              <h1>Own the<br /><em>silence.</em></h1>
              <p>Precision combat in the dark between stars.<br />Choose your theatre. Make it yours.</p>
            </div>
            <div className="hero-orbit" aria-hidden="true">
              <div className="orbit orbit-one" /><div className="orbit orbit-two" /><div className="orbit-core"><Target size={25} /></div>
              <span className="orbit-tag tag-one">NAV // 07</span><span className="orbit-tag tag-two">SIGNAL LOST</span>
            </div>
          </div>

          <div className="section-heading"><span>Select theatre</span><span className="heading-rule" /></div>
          <div className="mode-grid">
            <button className={`mode-card ${mode === "online" ? "is-selected" : ""}`} onClick={() => setMode("online")}>
              <div className="mode-card-top"><span className="mode-icon"><Globe2 size={20} /></span><span className="mode-state">LIVE <span className="status-dot" /></span></div>
              <div className="mode-title">FRONTIER<br /><strong>NETWORK</strong></div>
              <p>Enter a living battlefield. Hunt with allies, survive the swarm.</p>
              <div className="mode-footer"><span>ONLINE COMBAT</span><ArrowUpRight size={17} /></div>
            </button>
            <button className={`mode-card ${mode === "offline" ? "is-selected" : ""}`} onClick={() => setMode("offline")}>
              <div className="mode-card-top"><span className="mode-icon offline-icon"><Gamepad2 size={20} /></span><span className="mode-state">SOLO <LockKeyhole size={12} /></span></div>
              <div className="mode-title">DEEP SPACE<br /><strong>PROTOCOL</strong></div>
              <p>Sharpen your edge beyond the signal. No crew. No mercy. No limits.</p>
              <div className="mode-footer"><span>OFFLINE MISSION</span><ArrowUpRight size={17} /></div>
            </button>
          </div>

          <div className="launch-row">
            <Link className="launch-button" to={`/game/${mode}`}><span>LAUNCH {mode === "online" ? "NETWORK" : "PROTOCOL"}</span><Zap size={18} fill="currentColor" /></Link>
            <span className="launch-hint">{mode === "online" ? "CONNECTED PLAY // EST. 12 PILOTS ACTIVE" : "LOCAL INSTANCE // NO CONNECTION REQUIRED"}</span>
          </div>

          <div className="lower-grid">
            <div className="briefing-panel"><div className="panel-kicker"><Sparkles size={14} /> MISSION BRIEFING</div><h2>The frontier is<br />still breathing.</h2><p>Something is moving beyond the asteroid belt. Your ship is the only thing fast enough to meet it.</p><span className="panel-coordinates">X: 084.19 &nbsp; Y: -211.04 &nbsp; Z: 009.87</span></div>
            <div className="ship-panel"><div className="panel-kicker"><Layers3 size={14} /> FLIGHT READOUT</div><div className="ship-graphic"><div className="ship-glow" /><div className="ship-silhouette" /></div><div className="ship-info"><span>VESSEL // M-04</span><strong>MINER</strong><div className="ship-stat"><span>HULL INTEGRITY</span><span>100%</span></div><div className="stat-bar"><i /></div></div></div>
          </div>
        </section>
      </div>
    </main>
  );
}
