import {
  HalfFloatType,
  NearestFilter,
  OrthographicCamera,
  RenderTarget,
  Texture,
} from 'three';
import { Fn } from 'three/src/nodes/TSL.js';
import { div, float, screenUV, texture, uniformTexture, vec2 } from 'three/tsl';
import { TextureNode, WebGPURenderer } from 'three/webgpu';

import { Quad } from './Quad';
import { TUFloat } from './types';

export class BlurPass {
  private _quad = new Quad();

  private _target: RenderTarget;
  private _targetSampler: TextureNode<'vec4'>;

  private _inputSampler: TextureNode<'vec4'>;

  constructor(resolution: number, radius: TUFloat) {
    this._target = new RenderTarget(resolution, resolution, {
      depthBuffer: false,
      stencilBuffer: false,
      type: HalfFloatType,
      minFilter: NearestFilter,
      magFilter: NearestFilter,
    });

    this._targetSampler = uniformTexture(this._target.texture);
    this._inputSampler = uniformTexture(this._target.texture);

    const texelSize = vec2(1 / resolution, 1 / resolution);

    const blur9 = Fn(() => {
      const sampler = this._inputSampler;
      const uv = screenUV;
      const o = texelSize.mul(radius);
      const z = float(0);

      const c = texture(sampler, uv);
      const s1 = texture(sampler, uv.add(vec2(o.x, z)));
      const s2 = texture(sampler, uv.add(vec2(o.x.mul(-1), z)));
      const s3 = texture(sampler, uv.add(vec2(z, o.y)));
      const s4 = texture(sampler, uv.add(vec2(z, o.y.mul(-1))));
      const s5 = texture(sampler, uv.add(vec2(o.x, o.y)));
      const s6 = texture(sampler, uv.add(vec2(o.x.mul(-1), o.y)));
      const s7 = texture(sampler, uv.add(vec2(o.x, o.y.mul(-1))));
      const s8 = texture(sampler, uv.add(vec2(o.x.mul(-1), o.y.mul(-1))));

      const sum = c
        .add(s1)
        .add(s2)
        .add(s3)
        .add(s4)
        .add(s5)
        .add(s6)
        .add(s7)
        .add(s8);

      return div(sum, float(9));
    });

    this._quad.material.colorNode = blur9();
  }

  /** Render target sampler */
  get sampler() {
    return this._targetSampler;
  }

  /** Render target texture */
  get texture() {
    return this._target.texture;
  }

  /** Render the scene */
  public render(
    renderer: WebGPURenderer,
    camera: OrthographicCamera,
    inputTexture: Texture,
  ) {
    this._inputSampler.value = inputTexture;
    renderer.setRenderTarget(this._target);
    renderer.render(this._quad.scene, camera);
    renderer.setRenderTarget(null);
  }

  /** Destroy the class */
  public destroy() {
    this._quad.destroy();
    this._target.dispose();
  }
}
