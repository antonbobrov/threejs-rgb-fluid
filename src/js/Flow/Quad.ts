import { Mesh, PlaneGeometry, Scene } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';

export class Quad {
  private _geometry = new PlaneGeometry(2, 2);

  protected _material = new MeshBasicNodeMaterial({ transparent: false });

  private _mesh: Mesh;

  private _scene: Scene;

  get mesh() {
    return this._mesh;
  }

  get material() {
    return this._material;
  }

  get scene() {
    return this._scene;
  }

  constructor() {
    this._mesh = new Mesh(this._geometry, this._material);
    this._scene = new Scene();
    this._scene.add(this._mesh);
  }

  public destroy() {
    this._scene.remove(this._mesh);
    this._geometry.dispose();
    this._material.dispose();
  }
}
