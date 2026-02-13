interface WLEDSegment {
  id: number;
  start: number;
  stop: number;
  len: number;
  grp: number;
  spc: number;
  of: number;
  on: boolean;
  frz: boolean;
  bri: number;
  cct: number;
  set: number;
  n: string;
  col: number[][];
  fx: number;
  sx: number;
  ix: number;
  pal: number;
  c1: number;
  c2: number;
  c3: number;
  sel: boolean;
  rev: boolean;
  mi: boolean;
  o1: boolean;
  o2: boolean;
  o3: boolean;
  si: number;
  m12: number;
}

interface WLEDFullState {
  on: boolean;
  bri: number;
  transition: number;
  ps: number;
  pl: number;
  ledmap: number;
  AudioReactive: {
    on: boolean;
  };
  nl: {
    on: boolean;
    dur: number;
    mode: number;
    tbri: number;
    rem: number;
  };
  udpn: {
    send: boolean;
    recv: boolean;
    sgrp: number;
    rgrp: number;
  };
  lor: number;
  mainseg: number;
  seg: WLEDSegment[];
}

export const RED: WLEDFullState = {
  on: true,
  bri: 255,
  transition: 7,
  ps: -1,
  pl: -1,
  ledmap: 0,
  AudioReactive: {
    on: true,
  },
  nl: {
    on: false,
    dur: 60,
    mode: 1,
    tbri: 0,
    rem: -1,
  },
  udpn: {
    send: false,
    recv: true,
    sgrp: 1,
    rgrp: 1,
  },
  lor: 0,
  mainseg: 0,
  seg: [
    {
      id: 0,
      start: 0,
      stop: 122,
      len: 122,
      grp: 1,
      spc: 0,
      of: 0,
      on: true,
      frz: false,
      bri: 255,
      cct: 127,
      set: 0,
      n: "Bar back",
      col: [
        [255, 0, 4],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fx: 0,
      sx: 128,
      ix: 128,
      pal: 51,
      c1: 128,
      c2: 128,
      c3: 16,
      sel: true,
      rev: false,
      mi: false,
      o1: false,
      o2: false,
      o3: false,
      si: 0,
      m12: 0,
    },
    {
      id: 1,
      start: 122,
      stop: 234,
      len: 112,
      grp: 1,
      spc: 0,
      of: 0,
      on: true,
      frz: false,
      bri: 29,
      cct: 127,
      set: 0,
      n: "Bar front",
      col: [
        [255, 0, 4],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fx: 0,
      sx: 128,
      ix: 128,
      pal: 51,
      c1: 128,
      c2: 128,
      c3: 16,
      sel: true,
      rev: false,
      mi: false,
      o1: false,
      o2: false,
      o3: false,
      si: 0,
      m12: 0,
    },
  ],
};

export const LIGHTING: WLEDFullState = {
  on: true,
  bri: 255,
  transition: 7,
  ps: -1,
  pl: -1,
  ledmap: 0,
  AudioReactive: { on: true },
  nl: { on: false, dur: 60, mode: 1, tbri: 0, rem: -1 },
  udpn: { send: false, recv: true, sgrp: 1, rgrp: 1 },
  lor: 0,
  mainseg: 0,
  seg: [
    {
      id: 0,
      start: 0,
      stop: 122,
      len: 122,
      grp: 1,
      spc: 0,
      of: 0,
      on: true,
      frz: false,
      bri: 255,
      cct: 127,
      set: 0,
      n: "Bar back",
      col: [
        [255, 255, 255],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fx: 57,
      sx: 64,
      ix: 255,
      pal: 2,
      c1: 128,
      c2: 128,
      c3: 16,
      sel: true,
      rev: false,
      mi: false,
      o1: false,
      o2: false,
      o3: false,
      si: 0,
      m12: 0,
    },
    {
      id: 1,
      start: 122,
      stop: 234,
      len: 112,
      grp: 1,
      spc: 0,
      of: 0,
      on: true,
      frz: false,
      bri: 29,
      cct: 127,
      set: 0,
      n: "Bar front",
      col: [
        [255, 255, 255],
        [0, 0, 0],
        [0, 0, 0],
      ],
      fx: 57,
      sx: 64,
      ix: 255,
      pal: 2,
      c1: 128,
      c2: 128,
      c3: 16,
      sel: true,
      rev: false,
      mi: false,
      o1: false,
      o2: false,
      o3: false,
      si: 0,
      m12: 0,
    },
  ],
};
