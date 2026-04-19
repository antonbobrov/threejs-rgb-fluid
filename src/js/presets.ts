import { Color } from 'three';

import { clonePreset } from './clonePreset';
import { TPreset } from './types';

const DEFAULTS: TPreset = {
  flow: {
    radius: 0.02,
    strength: 1,
    decay: 0.99,
    growScale: 1,
    advectionStrength: 0.01,
    blurStrength: 0.2,
    blurRadius: 3.29,
    noiseScale: 4,
    noiseStrength: 0.01,
    noiseTextureStrength: 0.00035,
    noiseTextureScale: 2,
  },
  rgb: {
    frequency: 10,
    strength: 0.78209,
    mix: 0.35,
  },
  liquid: {
    color: new Color(0.98, 0.985, 1.0),
  },
  aberration: {
    strength: 0.02,
  },
  scene: {
    distortion: 0.05,
    background: new Color('#f0f1fa'),
  },
  text: {
    visible: true,
    color: new Color('#141419'),
  },
};

const DARK: TPreset = {
  ...clonePreset(DEFAULTS),
  rgb: {
    ...DEFAULTS.rgb,
    frequency: 15,
  },
  scene: {
    ...DEFAULTS.scene,
    background: new Color('#050505'),
  },
  text: {
    ...DEFAULTS.text,
    color: new Color('#dedede'),
  },
};

const NIGHT_BLUE: TPreset = {
  ...clonePreset(DEFAULTS),
  scene: {
    ...DEFAULTS.scene,
    background: new Color('#050505'),
  },
  rgb: {
    ...DEFAULTS.rgb,
    strength: 0.5,
    mix: 0,
  },
  liquid: {
    ...DEFAULTS.liquid,
    color: new Color('#1f1fff'),
  },
  text: {
    ...DEFAULTS.text,
    visible: false,
  },
};

const NEON: TPreset = {
  ...clonePreset(DEFAULTS),
  scene: {
    ...DEFAULTS.scene,
    background: new Color('#050505'),
  },
  rgb: {
    ...DEFAULTS.rgb,
    strength: 3,
  },
  liquid: {
    ...DEFAULTS.liquid,
    color: new Color('#1f1fff'),
  },
  text: {
    ...DEFAULTS.text,
    visible: false,
  },
};

const GRAINY: TPreset = {
  ...clonePreset(DEFAULTS),
  flow: {
    ...DEFAULTS.flow,
    noiseTextureStrength: 0.0028,
    noiseTextureScale: 1.4,
    blurRadius: 0.5,
    blurStrength: 1.9,
  },
  scene: {
    ...DEFAULTS.scene,
    background: new Color('#050505'),
  },
  rgb: {
    ...DEFAULTS.rgb,
    strength: 1,
    mix: 0.16438,
  },
  liquid: {
    ...DEFAULTS.liquid,
    color: new Color('#ffffff'),
  },
  text: {
    ...DEFAULTS.text,
    visible: false,
  },
};

export const PRESETS = { DEFAULTS, DARK, NIGHT_BLUE, NEON, GRAINY };
