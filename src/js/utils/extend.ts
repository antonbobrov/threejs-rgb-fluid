import { deepAssign } from './deepAssign';
import { deepClone } from './deepClone';

type TDeepPartial<T> = T extends (...args: any[]) => any
  ? T
  : T extends readonly (infer U)[]
    ? readonly TDeepPartial<U>[]
    : T extends object
      ? { [K in keyof T]?: TDeepPartial<T[K]> }
      : T;

export function extend<T extends Record<string, any>>(
  base: T,
  patch: TDeepPartial<T>,
): T {
  const result = deepClone(base);

  return deepAssign(result, patch as Partial<T>);
}
