import { UniformNode, Vector2 } from 'three/webgpu';

export type TUFloat = UniformNode<'float', number>;

export type TFlowSettings = {
  radius: number;
  strength: number;
  decay: number;
  growScale: number;
  advectionStrength: number;
  blurStrength: number;
  blurRadius: number;
  noiseScale: number;
  noiseStrength: number;
};

type TUniformsTypeMap = {
  float: UniformNode<'float', number>;
  vec2: UniformNode<'vec2', Vector2>;
};

export type TUniforms = {
  mouse: TUniformsTypeMap['vec2'];
  velocity: TUniformsTypeMap['vec2'];
  deltaTime: TUniformsTypeMap['float'];
} & Record<keyof TFlowSettings, TUniformsTypeMap['float']>;

export interface IFlowProps {
  name: string;
  resolution: number;
  blurDownscale: number;
  uAspectRatio: TUniformsTypeMap['float'];
  noiseSrc?: string;
  settings: TFlowSettings;
}
