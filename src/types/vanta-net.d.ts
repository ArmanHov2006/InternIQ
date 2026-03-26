declare module "vanta/dist/vanta.net.min" {
  type VantaNetParams = {
    el: HTMLElement;
    mouseControls?: boolean;
    touchControls?: boolean;
    gyroControls?: boolean;
    minHeight?: number;
    minWidth?: number;
    scale?: number;
    scaleMobile?: number;
    color?: number;
    backgroundColor?: number;
    points?: number;
    maxDistance?: number;
    spacing?: number;
    showDots?: boolean;
  };

  type VantaInstance = {
    destroy: () => void;
  };

  const VantaNet: (params: VantaNetParams) => VantaInstance;
  export default VantaNet;
}
