import { TPreset } from './types';

export function clonePreset(preset: TPreset) {
  return {
    ...preset,
    flow: { ...preset.flow },
    rgb: { ...preset.rgb },
    liquid: { color: preset.liquid.color.clone() },
    aberration: { ...preset.aberration },
    scene: {
      ...preset.scene,
      background: preset.scene.background.clone(),
    },
    text: {
      ...preset.text,
      color: preset.text.color.clone(),
    },
  };
}
