type PerkC = {
  name?: string;
  x: number;
  y: number;
  angle: number;
  width?: number;
  height?: number;
  vertices?: {
    x: number;
    y: number;
  }[];
  duration?: number;
};

type SuperDashC = PerkC & {
    multiplier: number;
}