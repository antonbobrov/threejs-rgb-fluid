import { PerspectiveCamera, Scene } from 'three';
import { Inspector } from 'three/examples/jsm/inspector/Inspector.js';
import { uniform } from 'three/tsl';
import { UniformNode, WebGPURenderer } from 'three/webgpu';
import { Callbacks, IOnResize, onResize, vevet } from 'vevet';

import { IWebglCallbacksMap, IWebglProps } from './types';

export class Webgl {
  private _props: IWebglProps;

  private _canvas: HTMLCanvasElement;

  private _camera: PerspectiveCamera;

  private _renderer: WebGPURenderer;

  private _scene: Scene;

  private _callbacks: Callbacks<IWebglCallbacksMap>;

  private _resizer?: IOnResize;

  private _width: number;

  private _height: number;

  private _aspect: UniformNode<'float', number>;

  private _inspector?: Inspector;

  get props() {
    return this._props;
  }

  get container() {
    return this._container;
  }

  get callbacks() {
    return this._callbacks;
  }

  get scene() {
    return this._scene;
  }

  get renderer() {
    return this._renderer;
  }

  get camera() {
    return this._camera;
  }

  get inspector() {
    return this._inspector;
  }

  constructor(
    private _container: HTMLElement,
    initProps?: IWebglProps,
  ) {
    const defaultProps: IWebglProps = {
      near: 1,
      far: 10000,
      inspector: true,
      render: true,
    };

    this._props = { ...defaultProps, ...initProps };

    // Save initial sizes
    this._width = this._container.offsetWidth;
    this._height = this._container.offsetHeight;
    this._aspect = uniform(this._width / this._height);

    // Create canvas
    this._canvas = document.createElement('canvas');
    _container.appendChild(this._canvas);

    // Create camera
    this._camera = new PerspectiveCamera(
      this.fov,
      this.uAspect.value,
      this._props.near,
      this._props.far,
    );
    this._camera.position.set(0, 0, this.perspective);

    // Create renderer
    this._renderer = new WebGPURenderer({
      ...this._props,
      canvas: this._canvas,
    });

    this._renderer
      .init()
      .then(() => {
        this._resizer = onResize({
          element: _container,
          callback: () => this.resize(),
        });
      })
      .catch(() => {});

    // Create inspector
    if (this._props.inspector) {
      this._inspector = new Inspector();
      this._renderer.inspector = this._inspector;
    }

    // Create scene
    this._scene = new Scene();

    // Create callbacks
    this._callbacks = new Callbacks();

    // Create an animation frame
    this._renderer.setAnimationLoop(this.render.bind(this));
  }

  /** Resize the scene */
  public resize() {
    this._width = this._container.offsetWidth;
    this._height = this._container.offsetHeight;
    this._aspect.value = this._width / this._height;

    this._camera.fov = this.fov;
    this._camera.aspect = this.uAspect.value;
    this._camera.position.set(0, 0, this.perspective);
    this._camera.updateProjectionMatrix();

    this._renderer.setSize(this.width, this.height);
    this._renderer.setPixelRatio(Math.min(vevet.dpr, 2));

    this.callbacks.emit('resize', undefined);

    this.render();
  }

  /** Renderer width */
  get width() {
    return this._width;
  }

  /** Renderer height */
  get height() {
    return this._height;
  }

  /** Aspect ratio */
  get uAspect() {
    return this._aspect;
  }

  /** Camera FOV */
  private get fov() {
    const height = this._container.offsetHeight;
    const perspective = this._props.perspective ?? 2000;

    return (
      this._props.fov ||
      180 * ((2 * Math.atan(height / 2 / perspective)) / Math.PI)
    );
  }

  /** Camera perspective */
  private get perspective() {
    return this._props.perspective ?? 2000;
  }

  /** Render the scene */
  public render() {
    if (!this._renderer.initialized) {
      return;
    }

    this.callbacks.emit('render', undefined);

    if (this.width > 0 && this.height > 0 && this._props.render) {
      this._renderer.render(this._scene, this._camera);
    }
  }

  /** Destroy the manager */
  destroy() {
    this._canvas.remove();

    this._renderer.dispose();

    this._callbacks.destroy();
    this._resizer?.remove();
  }
}
