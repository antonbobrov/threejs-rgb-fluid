import {
  PlaneGeometry,
  MeshBasicMaterial,
  Color,
  CanvasTexture,
  LinearFilter,
  SRGBColorSpace,
} from 'three';
import {
  clamp,
  length,
  mix,
  negate,
  pass,
  sin,
  texture,
  uniform,
  uv,
  vec3,
  vec4,
} from 'three/tsl';
import { Mesh, RenderPipeline } from 'three/webgpu';
import { Canvas } from 'vevet';

import { Flow } from './Flow';
import { createGUI } from './gui/createGUI';
import { Pointer } from './Pointer';
import { PRESETS } from './presets';
import { Webgl } from './webgl';

const container = document.getElementById('scene')!;

// Initialize webgl manager

const webgl = new Webgl(container, {
  near: 0.01,
  far: 5000,
  fov: 75,
  perspective: 10,
  render: false,
});

// Create settings

const { settings, onChange } = createGUI({
  inspector: webgl.inspector,
  initials: PRESETS.DEFAULT,
  presets: PRESETS,
  settings: {
    pointer: {
      ease: { min: 0.05, max: 0.3, step: 0.00001 },
    },
    flow: {
      radius: { min: 0.0075, max: 0.04, step: 0.00001 },
      strength: { min: 0.1, max: 2, step: 0.00001 },
      decay: { min: 0, max: 0.1, step: 0.00001 },
      growScale: { min: 1, max: 1.02, step: 0.00001 },
      advectionStrength: { min: 0, max: 0.01, step: 0.00001 },
      blurStrength: { min: 0, max: 1, step: 0.00001 },
      blurRadius: { min: 0, max: 10, step: 0.01 },
      noiseStrength: { min: 0, max: 0.01, step: 0.00001 },
      noiseScale: { min: 0.25, max: 3, step: 0.00001 },
    },
    rgb: {
      frequency: { min: 0, max: 30, step: 1 },
      strength: { min: 0, max: 3, step: 0.00001 },
      mix: { min: 0, max: 1, step: 0.00001 },
    },
    liquid: {
      color: {},
    },
    aberration: {
      strength: { min: 0, max: 1, step: 0.00001 },
    },
    scene: {
      distortion: { min: 0, max: 0.05, step: 0.00001 },
      background: {},
    },
    text: {
      visible: {},
      color: {},
    },
  },
});

webgl.inspector?.hide();

webgl.scene.background = new Color(settings.scene.background);
onChange(() => {
  (webgl.scene.background as Color).set(settings.scene.background);
});

webgl.scene.background = new Color(settings.scene.background);

const renderPipeline = new RenderPipeline(webgl.renderer);

// Create flow

const flowInstance = new Flow({
  name: 'Flow',
  resolution: 512,
  blurDownscale: 2,
  uAspectRatio: webgl.uAspectRatio,
  noiseSrc: 'HDR_LA_0.png',
  settings: settings.flow,
});

onChange(() => flowInstance.updateUniforms());

// Create pointer

const pointer = new Pointer();

webgl.callbacks.on('render', () => {
  const width = Math.max(webgl.width, 1);
  const height = Math.max(webgl.height, 1);

  pointer.update(settings.pointer.ease);

  flowInstance.setPointer(
    pointer.coords.x / width,
    pointer.coords.y / height,
    pointer.velocity.x / width,
    pointer.velocity.y / height,
  );

  flowInstance.render(webgl.renderer);
  renderPipeline.render();
});

// Uniforms

const uSceneDistortion = uniform(settings.scene.distortion);
const uRgbFrequency = uniform(settings.rgb.frequency);
const uRgbStrength = uniform(settings.rgb.strength);
const uRgbMix = uniform(settings.rgb.mix);
const uLiquidColor = uniform(settings.liquid.color);
const uAaberrationStrength = uniform(settings.aberration.strength);

onChange(() => {
  uSceneDistortion.value = settings.scene.distortion;

  uRgbFrequency.value = settings.rgb.frequency;
  uRgbStrength.value = settings.rgb.strength;

  uRgbMix.value = settings.rgb.mix;

  uLiquidColor.value = settings.liquid.color;

  uAaberrationStrength.value = settings.aberration.strength;
});

/// Shaders

const flowTexture = texture(flowInstance.texture);
const flowDirection = flowTexture.rg;
const scenePass = pass(webgl.scene, webgl.camera).getTextureNode();

const remapSin = (x: any) => sin(x).mul(0.5).add(0.5);

const rgbPhase = clamp(flowDirection, -2, 2).mul(-0.15);
const phase = rgbPhase.mul(uRgbFrequency.mul(Math.PI));
const rgb = vec3(
  remapSin(phase.add(0)),
  remapSin(phase.add(2)),
  remapSin(phase.add(4)),
);
const rgbStrength = length(flowDirection).mul(uRgbStrength);
const liquidColor = mix(uLiquidColor, rgb, uRgbMix);

const caStrength = rgbStrength.mul(uAaberrationStrength).mul(uSceneDistortion);
const caOffset = flowDirection.mul(caStrength);

const uvOffset = flowDirection
  .mul(negate(uSceneDistortion))
  .mul(length(liquidColor));
const sceneUV = uv().add(uvOffset);
const sceneColor = texture(scenePass, sceneUV);

const caR = texture(scenePass, sceneUV.add(caOffset)).r;
const caG = texture(scenePass, sceneUV.sub(caOffset)).g;
const caB = texture(scenePass, sceneUV.sub(caOffset)).b;
const caColor = vec4(vec3(caR, caG, caB), sceneColor.a);
const output = mix(caColor, liquidColor, rgbStrength);

const flowPreviewColor = flowDirection.mul(0.5).add(0.5);
const flowPreview = vec4(vec3(flowPreviewColor, 0), 1).toInspector('Flow');

renderPipeline.outputNode = flowPreview;
renderPipeline.outputNode = output;

// Text

const font = `"Modak", system-ui`;
const text = 'You are \n awesome';

const canvas = new Canvas({
  width: 600,
  height: 300,
  dpr: 2,
  append: false,
  onResize: (_data, { ctx, dpr, width, height }) => {
    ctx.clearRect(0, 0, width, height);

    ctx.font = `${100 * dpr}px ${font}`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const cx = width / 2;
    const cy = height / 2;

    ctx.fillStyle = `#${settings.text.color.getHexString()}`;

    const lines = text.split('\n').map((l) => l.trim());
    const lineGap = 85 * dpr;

    if (lines.length === 1) {
      ctx.fillText(lines[0], cx, cy);

      return;
    }

    const startY = cy - ((lines.length - 1) * lineGap) / 2;
    lines.forEach((line, idx) => {
      ctx.fillText(line, cx, startY + idx * lineGap);
    });

    ctx.restore();
  },
});

const map = new CanvasTexture(canvas.canvas);
map.colorSpace = SRGBColorSpace;
map.minFilter = LinearFilter;
map.magFilter = LinearFilter;
map.needsUpdate = true;

const planeRatio = canvas.width / canvas.height;
const planeWidth = 3.3;

const helloPlane = new Mesh(
  new PlaneGeometry(planeWidth, planeWidth / planeRatio, 1, 1),
  new MeshBasicMaterial({ map, transparent: true }),
);

helloPlane.position.set(0, 0, 6.2);
webgl.scene.add(helloPlane);

onChange(() => {
  helloPlane.visible = settings.text.visible;
});

document.fonts
  .load(`160px ${font}`)
  .then(() => document.fonts.ready)
  .finally(() => {
    canvas.resize();
    map.needsUpdate = true;
  })
  .catch(() => {});

onChange(() => {
  canvas.resize();
  map.needsUpdate = true;
});
