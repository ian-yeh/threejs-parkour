import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

interface iController {
  get fwd(): boolean
  get bwd(): boolean
  get right(): boolean
  get left(): boolean
  get jump(): boolean
  set jump(val: boolean)
}

export class Controller implements iController {
  /** @type { PointerLockControls } control module used from THREE.js library */
  public controls: PointerLockControls;

  // booleans for user-keyboard interactions
  private _fwd: boolean = false;
  private _bwd: boolean = false;
  private _left: boolean = false;
  private _right: boolean = false;

  private _jump: boolean = false;

  constructor(
    private camera: THREE.Camera,
    private keyForForward: string,
    private keyForLeft: string,
    private keyForBackward: string,
    private keyForRight: string,
    private keyForJump: string,
  ) {
    this.controls = new PointerLockControls( this.camera, document.body );

    // HTML ELEMENTS
    const blocker: HTMLDivElement = document.getElementById('blocker') as HTMLDivElement;
	  const instructions: HTMLDivElement = document.getElementById('instructions') as HTMLDivElement;

    // adding event listeners

    document.addEventListener('keydown', (e: KeyboardEvent) => {
      this.handleKeyDown(e)
    });

    document.addEventListener('keyup', (e: KeyboardEvent) => {
      this.handleKeyUp(e)
    });

    instructions.addEventListener('click', () => {
      this.controls.lock();
    });

    // hide instructions when player is in the game
    this.controls.addEventListener('lock', () => {
      instructions.style.display = "none";
      blocker.style.display = "none";
    });

    // show instructions when player gets out of game
    this.controls.addEventListener('unlock', () => {
      blocker.style.display = "block";
      instructions.style.display = "";
    });
  }

  /**
   * handling keydown events for player movement
   * @param { KeyboardEvent } e
   */
  private handleKeyDown(e: KeyboardEvent): void {
    switch (e.key) {
      case this.keyForForward:
        this._fwd = true;
        break;

      case this.keyForLeft:
        this._left = true;
        break;

      case this.keyForBackward:
        this._bwd = true;
        break;

      case this.keyForRight:
        this._right = true;
        break;

      case this.keyForJump:
        this._jump = true;
        break;

    }
  }

    /**
   * handling keyup events for player movement
   * @param { KeyboardEvent } e
   */
  private handleKeyUp(e: KeyboardEvent): void {
    switch (e.key) {
      case this.keyForForward:
        this._fwd = false;
        break;

      case this.keyForLeft:
        this._left = false;
        break;

      case this.keyForBackward:
        this._bwd = false;
        break;

      case this.keyForRight:
        this._right = false;
        break;

      case this.keyForJump:
        this._jump = false;
        break;

    }
  }

  public get fwd(): boolean {
    return this._fwd;
  }
  
  public get bwd(): boolean {
    return this._bwd;
  }

  public get left(): boolean {
    return this._left;
  }
  
  public get right(): boolean {
    return this._right;
  }

  public get jump(): boolean {
    return this._jump;
  }

  public set jump(val: boolean) {
    this._jump = val;
  }


}
