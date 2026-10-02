import type Ship from "../../player/ships/ship";
import Audio from "./audio";

export default class EngineSound extends Audio 
{    
    constructor(ship: Ship) {
        super(ship)
    }
}