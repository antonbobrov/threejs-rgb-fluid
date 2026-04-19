import { WebGPURendererParameters } from 'three/src/renderers/webgpu/WebGPURenderer.Nodes.js';

export interface IWebglCallbacksMap {
  resize: undefined;
  render: undefined;
}

export interface IWebglProps extends Omit<
  WebGPURendererParameters,
  'context' | 'canvas'
> {
  fov?: number;
  perspective?: number;
  near?: number;
  far?: number;
  inspector?: boolean;
  render?: boolean;
}
