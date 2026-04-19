import {
  FloatType,
  HalfFloatType,
  OrthographicCamera,
  RenderTarget,
  Scene,
} from 'three';
import { uniformTexture } from 'three/tsl';
import { TextureNode, WebGPURenderer } from 'three/webgpu';
import { vevet } from 'vevet';

export class PingPong {
  protected _scene = new Scene();

  private _targetA: RenderTarget;

  private _targetB: RenderTarget;

  private _currentTarget: RenderTarget;

  private _nextTarget: RenderTarget;

  private _sampler: TextureNode<'vec4'>;

  constructor(resolution: number) {
    const type = vevet.osName.includes('ios') ? HalfFloatType : FloatType;

    this._targetA = new RenderTarget(resolution, resolution, {
      depthBuffer: false,
      stencilBuffer: false,
      type,
    });

    this._targetB = new RenderTarget(resolution, resolution, {
      depthBuffer: false,
      stencilBuffer: false,
      type,
    });

    this._currentTarget = this._targetA;
    this._nextTarget = this._targetB;

    this._sampler = uniformTexture(this._currentTarget.texture);
  }

  /** Render target texture */
  get texture() {
    return this._currentTarget.texture;
  }

  /** Render target sampler */
  get sampler() {
    return this._sampler;
  }

  public render(
    renderer: WebGPURenderer,
    scene: Scene,
    camera: OrthographicCamera,
    isForce = false,
  ) {
    this._sampler.value = this.texture;

    if (isForce) {
      renderer.setRenderTarget(this._currentTarget);
      renderer.render(scene, camera);
    }

    renderer.setRenderTarget(this._nextTarget);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    const save = this._currentTarget;
    this._currentTarget = this._nextTarget;
    this._nextTarget = save;
  }

  /** Destroy the class */
  public destroy() {
    this._targetA.dispose();
    this._targetB.dispose();
  }
}
