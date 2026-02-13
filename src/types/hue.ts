export interface HueLightState {
  on?: boolean;
  bri?: number;
  hue?: number;
  sat?: number;
  transitiontime?: number;
  alert?: 'none' | 'select' | 'lselect';
}

export interface HueLightStatus {
  state: {
    on: boolean;
    bri: number;
    hue: number;
    sat: number;
    effect: string;
    ct: number;
    alert: string;
    colormode: string;
    reachable: boolean;
  };
  type: string;
  name: string;
  modelid: string;
  manufacturername: string;
  productname: string;
}
