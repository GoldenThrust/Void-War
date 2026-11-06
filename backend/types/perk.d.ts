type PerkC = {
  id?: string;
  name?: string;
  x: number;
  y: number;
  angle: number;
  width?: number;
  height?: number;
  color?: string;
  vertices?: {
    x: number;
    y: number;
  }[];
  duration?: number;
};

type SuperDashC = PerkC & {
    multiplier: number;
}