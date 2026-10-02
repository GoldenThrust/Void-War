type ShipC = {
  name?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  acceleration: number;
  angle: number;
  life?: number;
  vertices?: {
    x: number;
    y: number;
  }[];
  img?: HTMLImageElement;
  flameImg?: HTMLImageElement;
  weapon?: typeof Weapon;
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