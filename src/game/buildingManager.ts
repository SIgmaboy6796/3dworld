import * as THREE from 'three'

export interface Building {
  id: string
  owner: number
  position: THREE.Vector3
  type: 'barracks' | 'market' | 'tower'
  health: number
  maxHealth: number
  mesh: THREE.Mesh
}

export class BuildingManager {
  private scene: THREE.Scene
  private buildings: Map<string, Building> = new Map()

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  public createBuilding(owner: number, position: THREE.Vector3, type: 'barracks' | 'market' | 'tower'): Building {
    const id = `building_${this.buildings.size}_${Date.now()}`
    
    let geometry: THREE.BufferGeometry
    let color: number

    switch (type) {
      case 'barracks':
        geometry = new THREE.BoxGeometry(1, 2, 1)
        color = 0xff6b6b
        break
      case 'market':
        geometry = new THREE.BoxGeometry(1, 1.5, 1)
        color = 0xffd93d
        break
      case 'tower':
        geometry = new THREE.ConeGeometry(0.8, 3, 8)
        color = 0x6bcf7f
        break
    }

    const material = new THREE.MeshPhongMaterial({ color })
    const mesh = new THREE.Mesh(geometry, material)

    // Position above the hex surface
    const offset = position.clone().normalize().multiplyScalar(2)
    mesh.position.copy(position.clone().add(offset))

    this.scene.add(mesh)

    const building: Building = {
      id,
      owner,
      position: mesh.position.clone(),
      type,
      health: type === 'tower' ? 100 : type === 'barracks' ? 80 : 60,
      maxHealth: type === 'tower' ? 100 : type === 'barracks' ? 80 : 60,
      mesh
    }

    this.buildings.set(id, building)
    return building
  }

  public getBuildings(): Building[] {
    return Array.from(this.buildings.values())
  }

  public removeBuilding(id: string): void {
    const building = this.buildings.get(id)
    if (building) {
      this.scene.remove(building.mesh)
      this.buildings.delete(id)
    }
  }
}
