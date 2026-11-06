type ShipC = {
  id?: string;
  name?: string;
  x: number;
  y: number;
  angle: number;
  width?: number;
  height?: number;
  acceleration?: number;
  life?: number;
  vertices?: {
    x: number;
    y: number;
  }[];
  weapon?: typeof import("../core/weapons/weapon.ts").default;
  color?: string;
  controllable?: boolean;
  maxWeaponHeat?: number;
  friend?: boolean;
};


type Vertice = {
  x: number;
  y: number;
}
type Vertices = Vertice[]