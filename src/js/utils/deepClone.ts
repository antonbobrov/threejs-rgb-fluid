import { Color } from 'three';

import { isPlainObject } from './isPlainObject';

function isThreeColor(value: unknown): value is Color {
  return value instanceof Color;
}

export function deepClone<T>(input: T, seen = new WeakMap()): T {
  if (typeof input !== 'object' || input === null) {
    return input;
  }

  if (seen.has(input as any)) {
    return seen.get(input as any);
  }

  if (isThreeColor(input)) {
    return input.clone() as T;
  }

  if (Array.isArray(input)) {
    const arr: any[] = [];
    seen.set(input, arr);
    for (const item of input) {
      arr.push(deepClone(item, seen));
    }

    return arr as T;
  }

  if (isPlainObject(input)) {
    const result: Record<string, any> = {};
    seen.set(input, result);
    for (const key in input) {
      result[key] = deepClone((input as any)[key], seen);
    }

    return result as T;
  }

  return input;
}
