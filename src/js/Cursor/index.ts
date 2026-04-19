import { addEventListener, clamp, lerp, Raf, vevet } from 'vevet';

export class Cursor {
  private _target = { x: 0, y: 0 };

  private _current = { x: 0, y: 0 };

  private _impulseTarget = { x: 0, y: 0, z: 0 };

  private _impulseCurrent = { x: 0, y: 0, z: 0 };

  private _isActive = false;

  private _raf: Raf;

  private _listeners: (() => void)[] = [];

  get coords() {
    return this._current;
  }

  get impulse() {
    return this._impulseCurrent;
  }

  constructor(onRender: () => void) {
    this._raf = new Raf({
      onFrame: () => {
        this._handleFrame();
        onRender();
      },
    });

    this._listeners.push(
      addEventListener(window, 'mousemove', this._handleMove.bind(this)),
    );

    this._listeners.push(
      addEventListener(window, 'touchmove', this._handleMove.bind(this)),
    );

    this._listeners.push(
      addEventListener(window, 'touchend', this._handleLeave.bind(this)),
    );

    this._listeners.push(
      addEventListener(
        document.body,
        'mouseleave',
        this._handleLeave.bind(this),
      ),
    );
  }

  private _handleMove(evt: MouseEvent | TouchEvent) {
    const r = Math.sqrt(vevet.height ** 2 + vevet.width ** 2) / 2;
    const impulseThreshold = r * 0.1;

    let x = 0;
    let y = 0;

    if (evt instanceof MouseEvent) {
      x = evt.clientX;
      y = evt.clientY;
    } else {
      x = evt.touches[0].clientX;
      y = evt.touches[0].clientY;
    }

    const deltaX = x - this._target.x;
    const deltaY = y - this._target.y;

    const impulseDelta =
      (Math.sqrt(deltaX ** 2 + deltaY ** 2) * 2) / impulseThreshold;
    const impulseX = clamp(deltaX / impulseThreshold, -1, 1);
    const impulseY = clamp(deltaY / impulseThreshold, -1, 1);

    this._target = { x, y };

    this._impulseTarget = {
      x: clamp(this._impulseTarget.x + impulseX, -1, 1),
      y: clamp(this._impulseTarget.y + impulseY, -1, 1),
      z: clamp(this._impulseTarget.z + impulseDelta),
    };

    if (!this._isActive) {
      this._current = { x, y };
      this._impulseTarget = { x: 0, y: 0, z: 0 };
      this._impulseCurrent = { ...this._impulseTarget };

      this._isActive = true;
    }

    this._raf.play();
  }

  private _handleLeave() {
    this._isActive = false;
  }

  private _handleFrame() {
    const ease = this._raf.lerpFactor(0.3);
    const decayEase = this._raf.lerpFactor(0.1);
    const approximation = 0.0001;

    this._current.x = lerp(
      this._current.x,
      this._target.x,
      ease,
      approximation,
    );

    this._current.y = lerp(
      this._current.y,
      this._target.y,
      ease,
      approximation,
    );

    this._impulseTarget.x = lerp(
      this._impulseTarget.x,
      0,
      decayEase,
      approximation,
    );
    this._impulseTarget.y = lerp(
      this._impulseTarget.y,
      0,
      decayEase,
      approximation,
    );
    this._impulseTarget.z = lerp(
      this._impulseTarget.z,
      0,
      decayEase,
      approximation,
    );

    this._impulseCurrent.x = lerp(
      this._impulseCurrent.x,
      this._impulseTarget.x,
      ease,
      approximation,
    );

    this._impulseCurrent.y = lerp(
      this._impulseCurrent.y,
      this._impulseTarget.y,
      ease,
      approximation,
    );

    this._impulseCurrent.z = lerp(
      this._impulseCurrent.z,
      this._impulseTarget.z,
      ease,
      approximation,
    );

    if (
      this._current.x === this._target.x &&
      this._current.y === this._target.y &&
      this._impulseCurrent.x === this._impulseTarget.x &&
      this._impulseCurrent.y === this._impulseTarget.y &&
      this._impulseCurrent.z === this._impulseTarget.z
    ) {
      this._raf.pause();
    }
  }
}
