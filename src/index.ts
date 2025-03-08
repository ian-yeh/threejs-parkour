import * as THREE from 'three';
import { Scene } from './Scene';
import { Player } from './Player';
import { Controller } from './Controller';

interface iGame {
  draw(time: number): void
}

class Game implements iGame {
  public static _instance: Game;
  
  // game settings
  private FPS: number = 60;
  private timeBetweenFrames: number = 1000/this.FPS;
  private prevTime: number = 0;

  /** @type { number } canvas dimensions */
  private width: number = window.innerWidth;
  private height: number = window.innerHeight;

  /** @type { Scene } declaration for THREE.js scene to be rendered */
  private scene = new Scene();

  /** @type { Player } initializing player for movement and camera */
  private player: Player = new Player(this.width, this.height);

  /** @type { Controller } intializing the controller with chosen keybinds */
  private controller: Controller = new Controller(this.player.camera, "w", "a", "s", "d", " ");

  private canvas: HTMLCanvasElement = document.getElementById("gameCanvas") as HTMLCanvasElement;

  /** @type { THREE.WebGLRenderer } rendering the THREE.js content on the canvas */
  private renderer = new THREE.WebGLRenderer({
    canvas: this.canvas,
  });

  private loadDiv: HTMLDivElement = document.getElementById("loader") as HTMLDivElement;

  constructor() {
    this.setRendererSize();
    this.addEventListeners();

    requestAnimationFrame((time) => this.draw(time));
  }

  /** 
   * drawing the content onto the renderer
   * @param { number } time - tells when to recall draw function in requestAnimationFrame
   */
  public draw(time: number): void {
    if (time - this.prevTime > this.timeBetweenFrames - 0.2) {

      // for loading screen
      if ( this.scene.loadedObjects < this.scene.totalObjects ) this.loadDiv.style.display = "block";
      else this.loadDiv.style.display = "none";

      // updating player movement
      this.player.update(this.controller, (time - this.prevTime) / 1000, this.scene);

      // re-rendering content
      this.renderer.render(this.scene, this.player.camera);

      this.prevTime = time;
    }

    // all the drawing logic using canvas
    requestAnimationFrame((time) => this.draw(time));
  }

  /** adding a resize event listener */
  private addEventListeners(): void {
    window.addEventListener('resize', () => {
      this.setRendererSize();
    });
  }

  /**
   * changing the window dimensions every time the user resizes window
   */
  private setRendererSize(): void {
    this.width = window.innerWidth;
    this.height = window.innerHeight;

    this.renderer.setSize(this.width, this.height);

    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    this.player.camera.aspect = this.width / this.height;
    this.player.camera.updateProjectionMatrix();
  }

  public static get instance(): Game {
    // if an instance of game was not created, make a new one. Otherwise return the only instance of game
    if (!Game._instance) Game._instance = new Game();
    return Game._instance;
  }
}

class Driver {
  constructor() {
    Game.instance;
  }
}

new Driver();
