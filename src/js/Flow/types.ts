import { UniformNode, Vector2, Vector3 } from 'three/webgpu';

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
  noiseTextureScale: number;
  noiseTextureStrength: number;
};

type TUniformMap = {
  number: UniformNode<'float', number>;
  vec2: UniformNode<'vec2', Vector2>;
  vec3: UniformNode<'vec3', Vector3>;
};

export type TUniforms = {
  mouse: TUniformMap['vec2'];
  velocity: TUniformMap['vec3'];
} & Record<keyof TFlowSettings, TUniformMap['number']>;

export interface IFlowProps {
  name: string;
  resolution: number;
  blurResolution: number;
  uAspect: TUniformMap['number'];
  noiseSrc?: string;
  settings: TFlowSettings;
}
