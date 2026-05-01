import { Vector2 } from 'three';
import { addEventListener, damp } from 'vevet';

export class Pointer {
  private _prev = new Vector2(0, 0);
  private _target = new Vector2(0, 0);
  private _current = new Vector2(0, 0);
  private _velocity = new Vector2(0, 0);

  private _isActive = false;
  private _lastTime?: number;

  private _listeners: (() => void)[] = [];

  get coords() {
    return this._current;
  }

  get velocity() {
    return this._velocity;
  }

  constructor() {
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
    let x = 0;
    let y = 0;

    if (evt instanceof MouseEvent) {
      x = evt.clientX;
      y = evt.clientY;
    } else {
      x = evt.touches[0].clientX;
      y = evt.touches[0].clientY;
    }

    this._target.set(x, y);

    if (!this._isActive) {
      this._current.copy(this._target);
      this._velocity.set(0, 0);
      this._isActive = true;
    }
  }

  private _handleLeave() {
    this._isActive = false;
  }

  public update(ease: number) {
    const now = performance.now();

    const { _current: current, _target: target, _prev: prev, velocity } = this;

    prev.copy(current);

    if (!this._lastTime) {
      current.copy(target);
      this.velocity.set(0, 0);
    } else {
      const dt = now - this._lastTime;

      current.x = damp(current.x, target.x, ease, dt);
      current.y = damp(current.y, target.y, ease, dt);

      const vdt = Math.max(dt / 1000, 1e-6);
      const dx = current.x - prev.x;
      const dy = current.y - prev.y;
      velocity.set(dx / vdt, dy / vdt);
    }

    this._lastTime = now;
  }

  public destroy() {
    this._listeners.forEach((listener) => listener());
  }
}
