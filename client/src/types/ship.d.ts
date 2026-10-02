type ShipC = {
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
  img?: HTMLImageElement;
  flameImg?: HTMLImageElement;
  weapon?: Weapon;
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