import * as THREE from 'three';
import { Cube } from './Cube';
import { GLTFModel } from './GLTFModel';

interface iScene {
  initialize(): void
  initCubes(): void
  updateCubes(level: number): void
  get getObjects(): THREE.Object3D[]
  get gameBox(): THREE.Box3
  get lavaBox(): THREE.Box3
  get endingPlatform(): THREE.Box3
  get totalObjects(): number
  get loadedObjects(): number
}

export class Scene extends THREE.Scene implements iScene {
  /**
   * @type {THREE.DirectionalLight} lighting for the THREE.js scene
   */
  private light: THREE.DirectionalLight = new THREE.DirectionalLight(0xffffff, 1);  
  private helperLight: THREE.AmbientLight = new THREE.AmbientLight(0xffffff, 1);

  private helperCamera = new THREE.CameraHelper(this.light.shadow.camera);

  private plane: THREE.Mesh = new THREE.Mesh();

  private sceneFog: THREE.Fog = new THREE.Fog(0xccdff, 500, 2000);
  
  /**
   * @type {number} properties for 3D object spawning (object count and width)
   */
  private treeCount: number = 24;
  private cubeCount: number = 13;
  private cubeWidth: number = 2.2;

  private sceneObjects: THREE.Object3D[] = [];

  /**
   * @type {THREE.Box3} hitboxes for the platforms and boundaries that player interacts with
   */
  private _gameBox: THREE.Box3 = new THREE.Box3();
  private _lavaBox: THREE.Box3 = new THREE.Box3();
  private _endingPlatform: THREE.Box3 = new THREE.Box3();

  /**
   * @type {number} counting the objects loaded for the loading bar when the program starts
   */
  private _totalObjects: number = this.treeCount + 3;
  private _loadedObjects: number = 0;

  constructor() {
    super();

    this.initialize();
  }

  /**
   * adding helpers to visualize where in-game lighting and hitboxes are in the scene
   * Optional Method, does not affect any functionality
   */
  private addHelpers(): void {
    const lightHelper = new THREE.DirectionalLightHelper(this.light, 5, 0x0000ff);
    this.add(lightHelper);

    this.add(this.helperCamera);

    const gameBoxHelper = new THREE.Box3Helper( this._gameBox );

    this.add(gameBoxHelper);

    const lavaBoxHelper = new THREE.Box3Helper( this._lavaBox );
    this.add(lavaBoxHelper);

    const endingPlatformHelper = new THREE.Box3Helper( this._endingPlatform );
    this.add(endingPlatformHelper);
  }

  /**
   * intializing all of the parts of the scene
   */
  public initialize() {
    this.fog = this.sceneFog;
    this.background = new THREE.Color(0x87cefa);

    this.initLights();
    this.initObjects();

    this.initCubes();

    this.initPlane();

    //this.addHelpers();
  }

  /** 
   * loading the 3D objects into the scene
   * @returns { Promise<void> }
   * acts as async function to make sure that all objects load before program begins
   */
  private async initObjects(): Promise<void> {
    const modelsToLoad = [
      { path: './assets/cat_house.glb', position: new THREE.Vector3(5, -1, 25), scale: 1, rotation: 1 },
      { path: './assets/cartoon_fallen_tree.glb', position: new THREE.Vector3(0.7, -1, 2), scale: 0.01, rotation: 1 },
      { path: './assets/cartoon_fallen_tree.glb', position: new THREE.Vector3(2, -1, -12), scale: 0.01, rotation: -1 },
      { path: './assets/cartoon_fallen_tree.glb', position: new THREE.Vector3(7, -1, -20), scale: 0.01, rotation: 0.25 },
      { path: './assets/cartoon_fallen_tree.glb', position: new THREE.Vector3(9, -1, -30), scale: 0.01, rotation: 0.5 },
      { path: './assets/cartoon_fallen_tree.glb', position: new THREE.Vector3(3, -1, -43), scale: 0.01, rotation: -1 },
      { path: './assets/cartoon_fallen_tree.glb', position: new THREE.Vector3(5, -1, -57), scale: 0.01, rotation: 0.75 },
      { path: './assets/cartoon_building.glb', position: new THREE.Vector3(3, -1, -110), scale: 6, rotation: 1 }
    ];

    for (const model of modelsToLoad) {
      const newModel = new GLTFModel( model.path, model.scale, model.rotation, model.position.x, model.position.y, model.position.z );
      await newModel.loadModel();
      this.add( newModel.object );

      this._loadedObjects++;
    }
    
    // spawning trees 
    for (let i = 0; i < this.treeCount; i++) {
      let newTree: GLTFModel;

      if (i < this.treeCount/2) newTree = new GLTFModel( './assets/cartoon_tree.glb', 1, 1, -7, -1, (-8 * i) + 15 );
      else newTree = new GLTFModel( './assets/cartoon_tree.glb', 1, 1, 15, -1, (-8 * (i % (this.treeCount / 2)) + 15 ));

      await newTree.loadModel();
      this.add( newTree.object );

      this._loadedObjects++;
    }

    // making the game box
    this._gameBox.setFromCenterAndSize(
      new THREE.Vector3( 4, 29, -59 ),
      new THREE.Vector3( 20, 60, 148 )
    );


    // making the hitbox for the floor below the parkour objects
    this._lavaBox.setFromCenterAndSize(
      new THREE.Vector3( 4, 0.001, -42 ),
      new THREE.Vector3( 20, 0.001, 90 )
    );

    // making the hitbox for the ending platform
    this._endingPlatform.setFromCenterAndSize(
      new THREE.Vector3( 4, 0.01, -128 ),
      new THREE.Vector3( 20, 0.001, 84 )
    );
  }

  /**
   * initializing the cubes that the player will be jumping on
   */
  public initCubes(): void {
    for (let i = 0; i < this.cubeCount; i++) {
      const z = (i * -7) + 3;

      const x = 4;
  
      const newCube = new Cube( this.cubeWidth, x, 3, z );

      this.sceneObjects.push( newCube.object );
      this.add( newCube.object );

      console.log("loaded Cube Object");
    }
  }

  /** 
   * updating the cubes every level the player passes
   * @param { number } level - player's level 
   */
  public updateCubes(level: number): void {
    for (let i = 0; i < this.sceneObjects.length; i++) {
      if (level === 2 || level === 3) {
        // changing the x position (left-right directionality) in the parkour course
        this.sceneObjects[i].position.x = Math.floor( Math.random() * 10 ) - 1;
      }

      else if (level >= 4) {
        // adding y-axis directionality in the course after level 4
        this.sceneObjects[i].position.x = Math.floor( Math.random() * 12 ) - 3;
        
        if (i !== 0) this.sceneObjects[i].position.y = Math.floor (Math.random() * 10 ) + 1
        else this.sceneObjects[i].position.y = 3;
      }
    }

  }

  /**
   * initializing the lights in the program
   * adding a main directional light that casts shadows, and a helper light that passively illuinates all objects
   */
  private initLights(): void {
    // main light
    this.add( this.light );
    this.light.position.set( -150, 300, 150 );
    this.light.castShadow = true;
    this.light.target.position.set( 0, 0, 0 );
    this.light.shadow.mapSize.width = 1024;
    this.light.shadow.mapSize.height = 1024;
    this.light.shadow.camera.near = 0.5;
    this.light.shadow.camera.far = 500;

    // helper light
    this.add( this.helperLight );
    this.helperLight.intensity = 0.7;

  }

  /**
   * initializing the plane (main platform)
   */
  private initPlane(): void {
    const geometry = new THREE.PlaneGeometry( 1000, 1000, 32, 32 );
    const material = new THREE.MeshPhongMaterial({
      color: '#336633',
      side: THREE.DoubleSide
    });

    this.plane = new THREE.Mesh(geometry, material);

    this.plane.receiveShadow = true;
    this.plane.rotation.x = -Math.PI / 2;
    this.plane.position.y = -1;

    this.add(this.plane);
  }

  public get getObjects(): THREE.Object3D[] {
    return this.sceneObjects;
  }

  public get gameBox(): THREE.Box3 {
    return this._gameBox;
  }

  public get lavaBox(): THREE.Box3 {
    // returning the hitbox for the lava floor below the parkour obstacles
    return this._lavaBox;
  }

  public get endingPlatform(): THREE.Box3 {
    // returning the ending platform collision
    return this._endingPlatform;
  }

  public get totalObjects(): number {
    return this._totalObjects;
  }

  public get loadedObjects(): number {
    return this._loadedObjects;
  }

}
