import { Color } from 'three';

import { isPlainObject } from './isPlainObject';

export function deepAssign<T extends Record<string, any>>(
  target: T,
  source: Partial<T>,
): T {
  const keys = Object.keys(source) as (keyof T)[];

  keys.forEach((key) => {
    const src = source[key];
    if (src === undefined) return;

    const dst = target[key];

    const srcAny = src as any;
    const dstAny = dst as any;

    if (srcAny instanceof Color && dstAny instanceof Color) {
      dstAny.copy(srcAny);

      return;
    }

    if (isPlainObject(srcAny) && isPlainObject(dstAny)) {
      deepAssign(dstAny, srcAny);

      return;
    }

    target[key] = src as T[keyof T];
  });

  return target;
}
