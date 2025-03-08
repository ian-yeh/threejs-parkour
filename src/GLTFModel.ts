import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { BaseObject } from './Object';

interface iGLTFModel {
  get object(): THREE.Group
  loadModel(): Promise<void>
  waitForLoad(): Promise<void>
}

export class GLTFModel extends BaseObject implements iGLTFModel {
  /** @type { GLTFLoader } loads GLTF models onto scene */
  private loader: GLTFLoader = new GLTFLoader();

  /** @type { THREE.Group } object that is loaded by the GLTF loader */
  private _object: THREE.Group = new THREE.Group();

  /** @type { boolean } tells program if the object has loaded or not */ 
  private _isLoaded: boolean = false;

  constructor(
    private _src: string,
    private _scaleFactor: number,
    private _rotation: number,
    _x: number,
    _y: number, 
    _z: number,
  ) {
    super ( _x, _y, _z );
  }

  /**
   * loads model from the source
   * @returns Promise, if the object has loaded or not 
   */
  public async loadModel(): Promise<void> {
    return new Promise(( resolve, reject ) => {
      this.loader.load(this._src, (gltf) => {

        // setting model properties
        gltf.scene.scale.set( this._scaleFactor, this._scaleFactor, this._scaleFactor );
        gltf.scene.position.set( this._x, this._y, this._z );
        gltf.scene.rotation.y = this._rotation * Math.PI/2;

        this._object = gltf.scene;
        this._isLoaded = true;

        // resolving promise
        resolve();
      }, undefined, (error) => {
        console.log( error );
        reject(error);
      });
    });
  }

  public get object(): THREE.Group {
    if (!this._isLoaded) {
      throw new Error('Model is not loaded yet.');
    }
    return this._object;
  }

  /**
   * loading model until Promise is fulfilled
   */
  public async waitForLoad(): Promise<void> {
    if (!this._isLoaded) {
      await this.loadModel();
    }
  }
}
