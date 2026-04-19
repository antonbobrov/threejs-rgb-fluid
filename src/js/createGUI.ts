import { Color } from 'three';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

import { clonePreset } from './clonePreset';
import { deepAssign } from './deepAssign';
import { TPreset } from './types';

export function createGUI(
  inspector: Inspector,
  PRESETS: Record<string, TPreset>,
) {
  const presetsKeys = Object.keys(PRESETS) as (keyof typeof PRESETS)[];

  const settings = clonePreset(PRESETS[presetsKeys[0]]);

  const onChangeArray: (() => void)[] = [];

  const onChange = () => {
    onChangeArray.forEach((fn) => fn());
  };

  const presetObject = { preset: 'DEFAULTS' };

  const presetGUI = inspector?.createParameters('Preset');

  ///

  const flow = inspector?.createParameters('Flow');
  flow
    ?.add(settings.flow, 'radius', 0.0075, 0.04, 0.00001)
    .name('Radius')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'strength', 0.1, 2, 0.00001)
    .name('Strength')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'decay', 0.96, 1, 0.00001)
    .name('Decay')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'growScale', 1, 1.02, 0.00001)
    .name('Grow Scale')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'advectionStrength', 0, 0.05, 0.00001)
    .name('Advection Strength')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'blurStrength', 0, 0.5, 0.00001)
    .name('Blur Strength')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'blurRadius', 0, 10, 0.01)
    .name('Blur Radius')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'noiseScale', 1, 10, 0.00001)
    .name('Noise Scale')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'noiseStrength', 0, 0.015, 0.00001)
    .name('Noise Strength')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'noiseTextureStrength', 0, 0.01, 0.00001)
    .name('Texture Noise Strength')
    .listen()
    .onChange(onChange);
  flow
    ?.add(settings.flow, 'noiseTextureScale', 0.25, 2, 0.00001)
    .name('Texture Noise Scale')
    .listen()
    .onChange(onChange);

  ///

  const rgb = inspector?.createParameters('RGB');
  rgb
    ?.add(settings.rgb, 'frequency', 0, 30, 1)
    .name('Frequency')
    .listen()
    .onChange(onChange);
  rgb
    ?.add(settings.rgb, 'strength', 0, 4, 0.00001)
    .name('Strength')
    .listen()
    .onChange(onChange);
  rgb
    ?.add(settings.rgb, 'mix', 0, 1, 0.00001)
    .name('Mix')
    .listen()
    .onChange(onChange);

  ///

  const liquidGui = inspector?.createParameters('Liquid');
  const liquidSettings = { color: settings.liquid.color.getHex() };
  liquidGui
    ?.addColor(liquidSettings, 'color')
    .name('Color')
    .onChange((val) => {
      const color = new Color(val);
      settings.liquid.color.copy(color);
      onChange();
    });

  ///

  const aberrationGUI = inspector?.createParameters('Aberration');
  aberrationGUI
    ?.add(settings.aberration, 'strength', 0, 1, 0.00001)
    .name('Strength')
    .listen()
    .onChange(onChange);

  ///

  const sceneGUI = inspector?.createParameters('Scene');
  sceneGUI
    ?.add(settings.scene, 'distortion', 0, 0.2, 0.00001)
    .name('Distortion')
    .listen()
    .onChange(onChange);
  const sceneBackgroundHelper = { color: settings.scene.background.getHex() };
  sceneGUI
    ?.addColor(sceneBackgroundHelper, 'color')
    .name('Background')
    .onChange((val) => {
      const color = new Color(val);
      settings.scene.background.copy(color);
      onChange();
    });

  ///

  const textGui = inspector?.createParameters('Text');
  textGui
    ?.add(settings.text, 'visible')
    .name('Visible')
    .listen()
    .onChange(onChange);
  const textColorHelper = { color: settings.text.color.getHex() };
  textGui
    ?.addColor(textColorHelper, 'color')
    .listen()
    .onChange((val) => {
      const color = new Color(val);
      settings.text.color.copy(color);
      onChange();
    });

  ///

  presetGUI?.add(presetObject, 'preset', presetsKeys).onChange((val: any) => {
    const preset = PRESETS[val as any];
    if (!preset) return;

    deepAssign(settings, preset);

    onChange();
  });

  return {
    settings,
    onChange: (fn: () => void) => {
      onChangeArray.push(fn);
    },
  };
}
