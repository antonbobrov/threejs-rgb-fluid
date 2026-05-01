import { HalfFloatType, OrthographicCamera, RenderTarget, Scene } from 'three';
import { uniformTexture } from 'three/tsl';
import {
  MeshBasicNodeMaterial,
  TextureNode,
  WebGPURenderer,
} from 'three/webgpu';

export class DoubleFBO {
  private _targetA: RenderTarget;
  private _targetB: RenderTarget;

  private _read: RenderTarget;
  private _write: RenderTarget;

  private _sampler: TextureNode<'vec4'>;

  private _material: MeshBasicNodeMaterial;

  constructor(resolution: number) {
    const type = HalfFloatType;

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

    this._read = this._targetA;
    this._write = this._targetB;

    this._sampler = uniformTexture(this._read.texture);

    this._material = new MeshBasicNodeMaterial();
  }

  get sampler() {
    return this._sampler;
  }

  get material() {
    return this._material;
  }

  private _swap() {
    const save = this._read;
    this._read = this._write;
    this._write = save;
  }

  public render(
    renderer: WebGPURenderer,
    scene: Scene,
    camera: OrthographicCamera,
  ) {
    this._sampler.value = this._read.texture;

    renderer.setRenderTarget(this._write);
    renderer.render(scene, camera);
    renderer.setRenderTarget(null);

    this._swap();
  }

  public destroy() {
    this._targetA.dispose();
    this._targetB.dispose();
    this._material.dispose();
  }
}
