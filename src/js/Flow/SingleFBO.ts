import { HalfFloatType, OrthographicCamera, RenderTarget, Scene } from 'three';
import { uniformTexture } from 'three/tsl';
import {
  MeshBasicNodeMaterial,
  TextureNode,
  WebGPURenderer,
} from 'three/webgpu';

export class SingleFBO {
  private _target: RenderTarget;

  private _sampler: TextureNode<'vec4'>;

  private _material: MeshBasicNodeMaterial;

  constructor(resolution: number) {
    this._material = new MeshBasicNodeMaterial();

    this._target = new RenderTarget(resolution, resolution, {
      depthBuffer: false,
      stencilBuffer: false,
      type: HalfFloatType,
    });

    this._sampler = uniformTexture(this._target.texture);
  }

  get texture() {
    return this._target.texture;
  }

  get sampler() {
    return this._sampler;
  }

  get material() {
    return this._material;
  }

  public render(
    renderer: WebGPURenderer,
    scene: Scene,
    camera: OrthographicCamera,
  ) {
    this._sampler.value = this.texture;
    renderer.setRenderTarget(this._target);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);
  }

  public destroy() {
    this._target.dispose();
    this._material.dispose();
  }
}
