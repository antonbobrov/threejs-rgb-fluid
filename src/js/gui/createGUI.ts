import { Color } from 'three';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';

import { deepAssign } from '../utils/deepAssign';
import { extend } from '../utils/extend';

type TSetting = {
  min?: number;
  max?: number;
  step?: number;
};

type TObject = Record<string, unknown>;

type TInitial = Record<string, TObject>;

type TSettingsForValue<V> = V extends number ? TSetting : {};

type TSettingsSchema<T extends TInitial> = {
  [FN in keyof T]: {
    [SN in keyof T[FN]]: TSettingsForValue<T[FN][SN]>;
  };
};

type FolderKey<T extends TInitial> = Extract<keyof T, string>;

type TSettingKey<T extends TInitial, F extends FolderKey<T>> = Extract<
  keyof T[F],
  string
>;

interface IProps<T extends TInitial> {
  inspector?: Inspector;
  initials: T;
  settings: TSettingsSchema<T>;
  presets?: Record<string, T>;
}

export function createGUI<T extends TInitial>({
  inspector,
  initials,
  settings,
  presets,
}: IProps<T>) {
  const current = extend(initials as any, {}) as T;

  const onChangeArray: (() => void)[] = [];

  const onChange = () => onChangeArray.forEach((fn) => fn());

  // Add presets

  if (presets && Object.keys(presets).length) {
    const presetGUI = inspector?.createParameters('Preset');
    const presetsKeys = Object.keys(presets);

    const obj = { preset: presetsKeys[0] };
    presetGUI?.add(obj, 'preset', presetsKeys).onChange((val) => {
      const preset = presets[val];
      if (!preset) {
        return;
      }

      deepAssign(current, preset);

      onChange();
    });
  }

  // Add settings

  const folderKeys = Object.keys(settings) as FolderKey<T>[];
  folderKeys.forEach((folderName) => {
    const folder = inspector?.createParameters(folderName);
    const refFolder = current[folderName] as T[typeof folderName];

    const settingsKeys = Object.keys(settings[folderName]) as TSettingKey<
      T,
      typeof folderName
    >[];
    settingsKeys.forEach((settingsName) => {
      const guiKey = settingsName as string;

      const initialValue = current[folderName][settingsName];
      const settingsFolder = settings[folderName][settingsName];

      if (initialValue instanceof Color) {
        const helper = { color: initialValue.getHex() };

        folder
          ?.addColor(helper, 'color')
          .name(guiKey)
          .onChange((val) => {
            const color = new Color(val);
            (current[folderName][settingsName] as unknown as Color).copy(color);
            onChange();
          });

        return;
      }

      if (typeof initialValue === 'boolean') {
        folder
          ?.add(refFolder, guiKey as any)
          .name(guiKey)
          .listen()
          .onChange(onChange);
      }

      if (typeof initialValue === 'number') {
        folder
          ?.add(
            refFolder,
            guiKey as any,
            ('min' in settingsFolder ? settingsFolder.min : undefined) ?? 0,
            ('max' in settingsFolder ? settingsFolder.max : undefined) ?? 1,
            'step' in settingsFolder ? settingsFolder.step : undefined,
          )
          .name(guiKey)
          .listen()
          .onChange(onChange);
      }
    });
  });

  return {
    settings: current,
    onChange: (fn: () => void) => {
      onChangeArray.push(fn);
    },
  };
}
