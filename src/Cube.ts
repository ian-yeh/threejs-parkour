import * as THREE from 'three';
import { BaseObject } from './Object';

interface iCube {
  get object(): THREE.Object3D
  get hitBoxHelper(): THREE.Box3Helper
  get hitBox(): THREE.Box3
}

export class Cube extends BaseObject implements iCube {
  // components of cube
  private geometry: THREE.BoxGeometry;
  private material: THREE.MeshPhongMaterial;
  private cube: THREE.Mesh;

  // components for cube hitbox
  private cubeBox: THREE.Box3;
  private _hitBoxHelper: THREE.Box3Helper;

  constructor(
    private _length: number,
    _x: number,
    _y: number,
    _z: number,
  ) {
    super(_x, _y, _z);

    // initializing the geometry and material for the cube
    this.geometry = new THREE.BoxGeometry(this._length, this._length, this._length);
    this.material = new THREE.MeshPhongMaterial( { color: 0xFFFFFF } );

    this.cube = new THREE.Mesh(this.geometry, this.material);

    // setting cube position
    this.cube.position.x = this._x;
    this.cube.position.y = this._y;
    this.cube.position.z = this._z;

    // shadow settings
    this.cube.castShadow = true;
    this.cube.receiveShadow = true;

    // adding cube hitbox
    this.cubeBox = new THREE.Box3();
    this.cubeBox.setFromObject(this.cube);
    this._hitBoxHelper = new THREE.Box3Helper(this.cubeBox, new THREE.Color(0x0000ff));
  }

  public get object(): THREE.Object3D {
    return this.cube;
  }

  public get hitBoxHelper(): THREE.Box3Helper {
    return this._hitBoxHelper;
  }

  public get hitBox(): THREE.Box3 {
    return this.cubeBox;
  }

}
