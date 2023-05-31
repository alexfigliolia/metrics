export interface Layout {
  x: number;
  y: number;
  top: number;
  left: number;
  right: number;
  bottom: number;
  width: number;
  height: number;
}

export interface LayoutShift {
  time: number;
  layoutShift: Partial<Layout>;
}
