import { Color } from 'three';

import { extend } from './utils/extend';

const DEFAULT = {
  pointer: {
    ease: 0.2,
  },
  flow: {
    radius: 0.025,
    strength: 1,
    decay: 0.00242,
    growScale: 1,
    advectionStrength: 0.007,
    blurStrength: 0.35,
    blurRadius: 1,
    noiseStrength: 0.002,
    noiseScale: 3,
  },
  rgb: {
    frequency: 10,
    strength: 0.4,
    mix: 0.35,
  },
  liquid: {
    color: new Color(0.98, 0.985, 1.0),
  },
  aberration: {
    strength: 0.02,
  },
  scene: {
    distortion: 0.015,
    background: new Color('#f0f1fa'),
  },
  text: {
    visible: true,
    color: new Color('#141419'),
  },
};

const DARK = extend(DEFAULT, {
  rgb: {
    frequency: 15,
  },
  scene: {
    background: new Color('#050505'),
  },
  text: {
    color: new Color('#dedede'),
  },
});

const NIGHT_BLUE = extend(DEFAULT, {
  scene: {
    background: new Color('#050505'),
  },
  rgb: {
    strength: 0.5,
    mix: 0,
  },
  liquid: {
    color: new Color('#1f1fff'),
  },
  text: {
    visible: false,
  },
});

const NEON = extend(DEFAULT, {
  scene: {
    background: new Color('#050505'),
  },
  rgb: {
    strength: 3,
  },
  liquid: {
    color: new Color('#1f1fff'),
  },
  text: {
    visible: false,
  },
});

const GRAINY = extend(DEFAULT, {
  flow: {
    noiseStrength: 1,
    noiseScale: 1.4,
    blurStrength: 0.75,
    blurRadius: 0.6,
  },
  scene: {
    background: new Color('#050505'),
  },
  rgb: {
    strength: 1,
    mix: 0.16438,
  },
  liquid: {
    color: new Color('#ffffff'),
  },
  text: {
    visible: false,
  },
});

export const PRESETS = { DEFAULT, DARK, NIGHT_BLUE, NEON, GRAINY };
