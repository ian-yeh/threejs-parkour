import * as THREE from 'three';
import { Controller } from './Controller';
import { Scene } from './Scene';

interface iPlayer {
  update(controller: Controller, delta: number, scene: Scene): void
  get camera(): THREE.PerspectiveCamera
  get level(): number
}

export class Player implements iPlayer {
  /** @type {boolean} checks if the player is already in the air or not */
  private _canJump: boolean = true;

  /** @type {THREE.PerspectiveCamera} the camera that the player uses to look around the scene */
  private _camera: THREE.PerspectiveCamera;

  /** @type {THREE.Box3} the player's hitbox */
  private _hitBox: THREE.Box3 = new THREE.Box3();
  private _hitBoxSize: THREE.Vector3 = new THREE.Vector3(1, 1, 1);

  private _raycaster: THREE.Raycaster;

  /** @type {THREE.Vector3} constants that player uses for movement physics */
  private velocity: THREE.Vector3 = new THREE.Vector3();
  private direction: THREE.Vector3 = new THREE.Vector3();
  private _mass: number = 20.0;

  /** @type {HTMLParagraphElement} the HTML paragraph where the player's stats are displayed */
  private stats: HTMLParagraphElement = document.getElementById("stats") as HTMLParagraphElement;
  private attempts: number = 0;
  private _level: number = 1;

  /** @type {HTMLAudioElement} HTML audio that plays when player levels up */
  private levelUpSound: HTMLAudioElement = new Audio('./assets/levelup.mp3');

  constructor(
    private width: number,
    private height: number,
  ) {
    this._camera = new THREE.PerspectiveCamera( 75, this.width / this.height, 0.1, 1000 );
    this._camera.position.set(4, 1, 10);

    this._raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3(0, -1, 0), 0, 10);
  }

  /**
   * updating the player's position every frame
   * @param { Controller } controller - the controller that provides events for player movement
   * @param { number } delta - the frame rate scaler
   * @param { Scene } scene - the scene that the player is rendered on  
   */
  public update(controller: Controller, delta: number, scene: Scene): void {

    if (controller.controls.isLocked) {

      // updating player hitbox
      this.updatePlayerHitBox();

      // handling collisions with the game bounds, the floors, and the ending platform
      this.handlePlayerBoxCollisions(this._hitBox, scene.gameBox, controller);
      this.handlePlayerLavaCollisions(this._hitBox, scene.lavaBox, controller);
      this.handlePlayerEndingPlatformCollisions(this._hitBox, scene.endingPlatform, controller, scene);

      // movement logic
      this.velocity.x -= this.velocity.x * this._mass * delta;
      this.velocity.z -= this.velocity.z * this._mass * delta;
      this.velocity.y -= (this._mass * 9.8 * delta); // F(g) = mass * force of gravity

      this.direction.z = Number(controller.fwd) - Number(controller.bwd);
      this.direction.x = Number(controller.right) - Number(controller.left);
      this.direction.normalize();

      if (controller.fwd || controller.bwd) this.velocity.z -= this.direction.z * 225.0 * delta;
      if (controller.left || controller.right) this.velocity.x -= this.direction.x * 225.0 * delta;
      if (controller.jump) {
        if (this._canJump) this.velocity.y = 60.0;
        this._canJump = false;
      }

      controller.controls.moveRight(-this.velocity.x * delta);
      controller.controls.moveForward(-this.velocity.z * delta);

      //raycaster and collision initializations
      this._raycaster.ray.origin.copy(controller.controls.getObject().position);

      const intersections = this._raycaster.intersectObjects(scene.getObjects, false);
      if (intersections.length) {
        this.velocity.y = Math.max(0, this.velocity.y);
        this._canJump = true;
      }

      // updating the player y position
      controller.controls.getObject().position.y += (this.velocity.y * delta);

      // if the player is on the ground, make the velocity 0
      if (controller.controls.getObject().position.y <= 0) {
        this.velocity.y = 0;
        controller.controls.getObject().position.y = 0;

        this._canJump = true;
      }

    }
  }

  /**
   * handling player collisions with the game box, ensuring that player does not go out of boundaries
   * @param { THREE.Box3 } player - player's hitbox
   * @param { THREE.Box3 } gameBox - game boundaries
   * @param { Controler } controller - game controller, stores camera position
   */
  private handlePlayerBoxCollisions(player: THREE.Box3, gameBox: THREE.Box3, controller: Controller): void {
    // check if the player's hitbox is outside the game box
    if (!gameBox.containsBox(player)) {
      // determine which side the player is outside of and adjust position
      const playerCenter = player.getCenter(new THREE.Vector3());
      const gameBoxCenter = gameBox.getCenter(new THREE.Vector3());

      console.log(playerCenter.x);

      // check each axis to see where the player is outside the game box
      if (playerCenter.x < gameBoxCenter.x) {
        // player is to the left of the game box
        controller.controls.getObject().position.x = gameBox.min.x + (this._hitBoxSize.x / 2);
      } else if (playerCenter.x > gameBoxCenter.x) {
        // player is to the right of the game box
        controller.controls.getObject().position.x = gameBox.max.x - (this._hitBoxSize.x / 2);
      }

      else if (playerCenter.y < gameBox.min.y) {
        // player is below the game box
        controller.controls.getObject().position.y = gameBox.min.y + (this._hitBoxSize.y / 2);
      } else if (playerCenter.y > gameBox.max.y) {
        // player is above the game box
        controller.controls.getObject().position.y = gameBox.max.y - (this._hitBoxSize.y / 2);
      }

      else if (playerCenter.z < gameBoxCenter.z) {
        // player is behind the game box
        controller.controls.getObject().position.z = gameBox.min.z + (this._hitBoxSize.z / 2);
      } else if (playerCenter.z > gameBoxCenter.z) {
        // player is in front of the game box
        controller.controls.getObject().position.z = gameBox.max.z - (this._hitBoxSize.z / 2);
      }
    }
  }

  /**
   * handling the player's collisions with the floor hitbox (lava)
   * @param { THREE.Box3 } player - player's hitbox 
   * @param { THREE.Box3 } lavaBox - floor hitbox 
   * @param { Controller } controller - stores camera position 
   */
  private handlePlayerLavaCollisions(player: THREE.Box3, lavaBox: THREE.Box3, controller: Controller): void {
    // resetting player position if they hit the ground
    if (player.intersectsBox(lavaBox)) {
      controller.controls.getObject().position.x = 4;
      controller.controls.getObject().position.z = 12;

      // updating the stats to add another attempt
      this.stats.innerHTML = `
        Attempts: ${++this.attempts} <br>
        Level: ${this._level}
      `
    }
  }

  /**
   * 
   * @param { THREE.Box3 } player - player hitbox
   * @param { THREE.Box3 } endingPlatform - ending platform hitbox
   * @param { Controller } controller - stores camera position
   * @param { Scene } scene - respawns cubes every level change
   */
  private handlePlayerEndingPlatformCollisions(player: THREE.Box3, endingPlatform: THREE.Box3, controller: Controller, scene: Scene): void {
    if (player.intersectsBox(endingPlatform)) {
      controller.controls.getObject().position.x = 4;
      controller.controls.getObject().position.z = 12;

      // updating the player level, then creating a new level
      this.stats.innerHTML = `
        Attempts: ${this.attempts} <br>
        Level: ${++this._level}
      `;
      this.levelUpSound.play();

      scene.updateCubes(this._level);
    }
  }

  /**
   * updating the player hitbox every time player moves
   */
  private updatePlayerHitBox(): void {
    const cameraPosition: THREE.Vector3 = this._camera.position.clone();
    cameraPosition.y += this._hitBoxSize.y/2;
    this._hitBox.setFromCenterAndSize(cameraPosition, this._hitBoxSize);
  }

  public get camera(): THREE.PerspectiveCamera {
    return this._camera;
  }

  public get level(): number {
    return this._level;
  }

}
