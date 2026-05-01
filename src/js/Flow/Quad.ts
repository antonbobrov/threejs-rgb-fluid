import { Mesh, PlaneGeometry, Scene } from 'three';
import { MeshBasicNodeMaterial } from 'three/webgpu';

export class Quad {
  private _geometry = new PlaneGeometry(2, 2);

  private _mesh: Mesh;

  private _scene: Scene;

  private _baseMaterial: MeshBasicNodeMaterial;

  constructor() {
    this._baseMaterial = new MeshBasicNodeMaterial();

    this._mesh = new Mesh(this._geometry, this._baseMaterial);
    this._scene = new Scene();
    this._scene.add(this._mesh);
  }

  get mesh() {
    return this._mesh;
  }

  set material(value: MeshBasicNodeMaterial) {
    this._mesh.material = value;
  }

  get scene() {
    return this._scene;
  }

  public destroy() {
    this._scene.remove(this._mesh);
    this._geometry.dispose();
    this._baseMaterial.dispose();
  }
}
