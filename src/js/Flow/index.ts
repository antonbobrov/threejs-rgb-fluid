import {
  OrthographicCamera,
  RepeatWrapping,
  Texture,
  Vector2,
  TextureLoader,
  NoColorSpace,
} from 'three';
import { gaussianBlur } from 'three/examples/jsm/tsl/display/GaussianBlurNode.js';
import {
  add,
  distance,
  div,
  texture,
  uniform,
  vec2,
  screenUV,
  exp,
  negate,
  pow,
  vec4,
  mix,
} from 'three/tsl';
import { WebGPURenderer } from 'three/webgpu';

import { DoubleFBO } from './DoubleFBO';
import { Quad } from './Quad';
import { SingleFBO } from './SingleFBO';
import { IFlowProps, TFlowSettings, TUniforms } from './types';

const TARGET_FPS = 165;
const FLOW_FIXED_MS = 1000 / TARGET_FPS;
const FLOW_MAX_SUBSTEPS = 5;

export class Flow {
  private _camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1);

  private _quad: Quad;

  private _velocityPass: DoubleFBO;
  private _blurPass: SingleFBO;

  private _uniforms: TUniforms;

  private _noiseTexture?: Texture;

  private _accumMs = 0;
  private _lastTime?: number;

  constructor(private _props: IFlowProps) {
    const { resolution, blurDownscale, noiseSrc } = _props;

    if (noiseSrc) {
      const noiseTexture = new TextureLoader().load(noiseSrc);
      noiseTexture.colorSpace = NoColorSpace;
      noiseTexture.wrapS = RepeatWrapping;
      noiseTexture.wrapT = RepeatWrapping;
      this._noiseTexture = noiseTexture;
    }

    // Uniforms
    this._uniforms = {
      mouse: uniform(new Vector2(0, 0)),
      velocity: uniform(new Vector2(0, 0)),
      deltaTime: uniform(0),
    } as TUniforms;

    // Update uniforms
    this.updateUniforms();

    // Create Quad
    this._quad = new Quad();

    // Create passes
    this._velocityPass = new DoubleFBO(resolution);
    this._blurPass = new SingleFBO(resolution / blurDownscale);

    // Init materials
    this._initBlurPass();
    this._initVelocityPass();
  }

  /** Final Texture */
  get texture() {
    return this._velocityPass.sampler;
  }

  /** Update uniforms */
  public updateUniforms() {
    const { settings } = this._props;

    const keys = Object.keys(settings) as (keyof TFlowSettings)[];
    keys.forEach((key) => {
      if (key in this._uniforms) {
        this._uniforms[key].value = settings[key];
      } else {
        this._uniforms[key] = uniform(settings[key]);
      }
    });
  }

  /** Update pointer state */
  public setPointer(x: number, y: number, velX: number, velY: number) {
    this._uniforms.mouse.value.set(x, y);
    this._uniforms.velocity.value.set(velX, velY);
  }

  /** Initialize blur pass material */
  private _initBlurPass() {
    const u = this._uniforms;
    const { uAspectRatio } = this._props;

    const velocity = texture(this._velocityPass.sampler, screenUV);
    const blurDirection = vec2(u.blurRadius, u.blurRadius.mul(uAspectRatio));
    const blur = gaussianBlur(velocity, blurDirection, 1);

    this._blurPass.material.fragmentNode = blur;
  }

  /** Initialize velocity pass material */
  private _initVelocityPass() {
    const u = this._uniforms;
    const { uAspectRatio } = this._props;
    const velocitySampler = this._velocityPass.sampler;
    const blurSampler = this._blurPass.sampler;
    const ratio = vec2(uAspectRatio, 1);
    const fpsScale = u.deltaTime.mul(60 / 1000);

    const localUV = screenUV.mul(ratio);
    const localMouse = u.mouse.mul(ratio);
    const dist = distance(localUV, localMouse);
    const mask = exp(negate(dist).div(u.radius));
    const color = vec2(u.velocity.x, u.velocity.y);
    const splat = color.mul(u.strength).mul(mask);

    const center = vec2(0.5, 0.5);
    const growScale = pow(u.growScale, fpsScale);
    const scaledUV = div(screenUV.sub(center), growScale).add(center);

    const base = texture(velocitySampler, scaledUV).rg;
    const advectUV = scaledUV.sub(base.mul(u.advectionStrength).mul(fpsScale));

    let textureNoise: any = vec2(0);

    if (this._noiseTexture) {
      const noiseUV = scaledUV.mul(ratio).mul(u.noiseScale);
      const noiseSampler = texture(this._noiseTexture, noiseUV);
      textureNoise = noiseSampler.rg.sub(0.5).mul(u.noiseStrength);
    }

    const deformedUV = advectUV.add(textureNoise); //.add(textureNoise);

    const advected = texture(velocitySampler, deformedUV).rg;
    const blurred = texture(blurSampler, deformedUV).rg;

    const decayFactor = exp(negate(u.decay).mul(fpsScale));
    const mixed = mix(advected, blurred, u.blurStrength).mul(decayFactor);

    const outputVelocity = add(mixed, splat);

    this._velocityPass.material.fragmentNode = vec4(outputVelocity, 0, 1);
  }

  /** Render scene with substepping */
  public render(renderer: WebGPURenderer) {
    const u = this._uniforms;
    const now = performance.now();

    if (this._lastTime === undefined) {
      this._lastTime = now;
      u.deltaTime.value = FLOW_FIXED_MS;

      return;
    }

    const rawDtMs = now - this._lastTime;
    this._lastTime = now;

    const frameDtMs = Number.isFinite(rawDtMs)
      ? Math.min(Math.max(rawDtMs, 0), 100)
      : FLOW_FIXED_MS;

    this._accumMs += frameDtMs;

    let steps = 0;
    while (this._accumMs >= FLOW_FIXED_MS && steps < FLOW_MAX_SUBSTEPS) {
      u.deltaTime.value = FLOW_FIXED_MS;
      this._render(renderer);
      this._accumMs -= FLOW_FIXED_MS;
      steps += 1;
    }

    if (steps === FLOW_MAX_SUBSTEPS) {
      this._accumMs = 0;
    }
  }

  private _render(renderer: WebGPURenderer) {
    this._quad.material = this._blurPass.material;
    this._blurPass.render(renderer, this._quad.scene, this._camera);

    this._quad.material = this._velocityPass.material;
    this._velocityPass.render(renderer, this._quad.scene, this._camera);
  }

  public destroy() {
    this._velocityPass.destroy();
    this._blurPass.destroy();
    this._noiseTexture?.dispose();
    this._quad.destroy();
  }
}
