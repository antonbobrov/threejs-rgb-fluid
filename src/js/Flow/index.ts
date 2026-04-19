import {
  OrthographicCamera,
  RepeatWrapping,
  Texture,
  Vector2,
  NearestFilter,
  TextureLoader,
  NoColorSpace,
} from 'three';
import {
  mx_fractal_noise_vec3,
  add,
  distance,
  div,
  exp,
  float,
  length,
  mix,
  negate,
  oneMinus,
  screenUV,
  texture,
  uniform,
  vec2,
  vec3,
} from 'three/tsl';
import { Vector3, WebGPURenderer } from 'three/webgpu';

import { BlurPass } from './BlurPass';
import { PingPong } from './PingPong';
import { Quad } from './Quad';
import { IFlowProps, TFlowSettings, TUniforms } from './types';

const startColor = vec2(0.5, 0.5);

export class Flow {
  private _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  private _initialized = false;

  private _pingPong: PingPong;

  private _start: Quad;
  private _velocity: Quad;
  private _advection: Quad;
  private _blur: BlurPass;

  private _uniforms: TUniforms;

  private _noiseTexture?: Texture;

  constructor(private props: IFlowProps) {
    const { resolution, blurResolution, noiseSrc } = props;

    if (noiseSrc) {
      const noiseTexture = new TextureLoader().load(noiseSrc);
      noiseTexture.colorSpace = NoColorSpace;
      noiseTexture.wrapS = RepeatWrapping;
      noiseTexture.wrapT = RepeatWrapping;
      noiseTexture.minFilter = NearestFilter;
      noiseTexture.magFilter = NearestFilter;
      this._noiseTexture = noiseTexture;
    }

    // Uniforms
    this._uniforms = {
      mouse: uniform(new Vector2(0, 0)),
      velocity: uniform(new Vector3(0, 0, 0)),
    } as TUniforms;
    this.updateUniforms();

    // Ping pong
    this._pingPong = new PingPong(resolution);

    // Neutral pass
    this._start = new Quad();
    this._start.material.colorNode = vec3(startColor, float(0));

    // Velocity pass
    this._velocity = new Quad();
    this._initVelocity();

    // Blur pass
    this._blur = new BlurPass(blurResolution, this._uniforms.blurRadius);

    // Advection pass
    this._advection = new Quad();
    this._initAdvection();
  }

  /** Renderer texture */
  get texture() {
    return this._pingPong.texture;
  }

  /** Update uniforms */
  public updateUniforms() {
    const keys = Object.keys(this.props.settings) as (keyof TFlowSettings)[];
    keys.forEach((key) => {
      if (key in this._uniforms) {
        this._uniforms[key].value = this.props.settings[key];
      } else {
        this._uniforms[key] = uniform(this.props.settings[key]);
      }
    });
  }

  /** Update pointer state */
  public setPointer(
    x: number,
    y: number,
    velX: number,
    velY: number,
    velZ: number,
  ) {
    this._uniforms.mouse.value.set(x, y);
    this._uniforms.velocity.value.set(velX, velY, velZ);
  }

  /** Initialize velocity computation */
  private _initVelocity() {
    const u = this._uniforms;
    const ratio = vec2(this.props.uAspect, 1);

    // Calculate splat
    const localUV = screenUV.mul(ratio);
    const localMouse = u.mouse.mul(ratio);
    const dist = distance(localUV, localMouse);
    const mask = exp(negate(dist).div(u.radius.mul(u.velocity.z)));
    const color = vec2(u.velocity.x, u.velocity.y);
    const splat = color.mul(u.velocity.z).mul(u.strength).mul(mask);

    const center = vec2(0.5, 0.5);
    const scaledUV = div(screenUV.sub(center), u.growScale).add(center);

    const base = texture(this._pingPong.sampler, scaledUV).rg;
    const decayed = mix(vec2(0.5, 0.5), base, u.decay);
    const output = add(decayed, splat);

    this._velocity.material.colorNode = output;
  }

  /** Initialize advection computation */
  private _initAdvection() {
    const u = this._uniforms;
    const base = texture(this._pingPong.sampler, screenUV).rg;

    const flow = base.sub(0.5);
    const ratio = vec2(this.props.uAspect, 1);
    const advectUV = screenUV.sub(flow.mul(u.advectionStrength));

    const basicNoiseUV = screenUV.mul(ratio).mul(u.noiseScale).mul(base);
    const basicNoiseSample = mx_fractal_noise_vec3(vec3(basicNoiseUV, 0), 4).rg;
    const basicNoise = basicNoiseSample.mul(
      u.noiseStrength.mul(oneMinus(length(base))),
    );

    let textureNoise: any = vec2(0);

    if (this._noiseTexture) {
      const noiseUV = screenUV.mul(ratio).mul(u.noiseTextureScale);
      const noiseSampler = texture(this._noiseTexture, noiseUV);
      textureNoise = noiseSampler.rg.sub(0.5).mul(u.noiseTextureStrength);
    }

    const deformedUV = advectUV.add(basicNoise).add(textureNoise);

    const advectedRaw = texture(this._pingPong.sampler, deformedUV);
    const advectedBlurred = texture(this._blur.sampler, deformedUV);

    const advectedSample = mix(advectedRaw, advectedBlurred, u.blurStrength);

    this._advection.material.colorNode = advectedSample;
  }

  public render(renderer: WebGPURenderer) {
    if (!this._initialized) {
      this._pingPong.render(renderer, this._start.scene, this._camera, true);
      this._initialized = true;
    }

    this._blur.render(renderer, this._camera, this._pingPong.texture);

    this._pingPong.render(renderer, this._advection.scene, this._camera);
    this._pingPong.render(renderer, this._velocity.scene, this._camera);
  }

  public destroy() {
    this._start.destroy();
    this._advection.destroy();
    this._velocity.destroy();
    this._pingPong.destroy();
    this._blur.destroy();
    this._noiseTexture?.dispose();
  }
}
