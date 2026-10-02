interface WeaponI {
  destroy: () => void;
  getVertices: () => void;
  getNearPlayers: (radius: number) => Ship[];
  getNearWeapons: (radius: number) => Weapon[];
  colliding: () => void;
  update?: (t: number, dt: number) => void;
  colide?: () => void;
  travelEnd?: ()=> void;
  closeObject?: (obj: any) => void;
}

type WeaponC = {
  name?: string;
  type?: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  angle: number;
  ship: Ship;
  acceleration?: number;
  speed?: number;
  damage?: number;
  range?: number;
  energyCost?: number;
  fireRate?: number;
  vertices?: {
        x: number;
        y: number;
      }[];
  color?: string;
  img?: HTMLImageElement;
  penetration?: number
};
