import PulseCanon from "../weapons/pulse-canon.ts";
import { shapes } from "./shapes.ts";
import Ship from "./ship.ts";

export default class FleetDrone extends Ship {
    private static nextFormationSlot = new Map<boolean, number>();
    private formationSlot: number;

    constructor({ x = 10, y = 20, angle = 0, friend = false }) {
        super({ x, y, width: 42, height: 42, angle, acceleration: 520, color: "springgreen", vertices: shapes[1], name: "Fleet Drone", maxWeaponHeat: 900, life: 280, weapon: PulseCanon, friend });
        this.formationSlot = FleetDrone.nextFormationSlot.get(friend) ?? 0;
        FleetDrone.nextFormationSlot.set(friend, this.formationSlot + 1);
        this.seekAcceleration = this.acceleration;
        this.fleeAcceleration = this.acceleration * 0.9;
    }

    override update(t: number, dt: number) {
        super.update(t, dt);
        const squadTarget = FleetDrone.getSquadTarget(this.friend);
        if (squadTarget) this.target = squadTarget;

        const formationOrbit = this.formationSlot % 2 === 0 ? 1 : -1;
        const formationRange = 1800 + (this.formationSlot % 3) * 350;
        this.tacticalUpdate({ searchRange: 16000, idealRange: formationRange, fleeRange: 700, fireRange: 5000, fireArc: Math.PI / 32, orbit: formationOrbit * 0.65, lead: 0.2 });
        if (this.target) FleetDrone.setSquadTarget(this.friend, this.target);
    }
}