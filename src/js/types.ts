import { Color } from 'three';

import { TFlowSettings } from './Flow/types';

export type TPreset = {
  flow: TFlowSettings;
  rgb: {
    frequency: number;
    strength: number;
    mix: number;
  };
  liquid: {
    color: Color;
  };
  aberration: {
    strength: number;
  };
  scene: {
    distortion: number;
    background: Color;
  };
  text: {
    visible: boolean;
    color: Color;
  };
};
