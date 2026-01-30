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

    const normal = position.clone().normalize()
    const up = new THREE.Vector3(0, 1, 0)
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(up, normal)

    const group = new THREE.Group()

    // Materials
    const stone = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, roughness: 0.85 })
    const wood = new THREE.MeshStandardMaterial({ color: 0x8b5a2b, roughness: 0.6 })
    const roofMat = new THREE.MeshStandardMaterial({ color: 0x7f2b2b, roughness: 0.45 })

    // Build detailed models per type
    if (type === 'barracks') {
      const base = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.9, 1.2), stone)
      base.position.set(0, 0.45, 0)
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.1, 0.6, 4), roofMat)
      roof.position.set(0, 1.05, 0)
      roof.rotation.y = Math.PI / 4
      const door = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.45, 0.05), wood)
      door.position.set(0, 0.25, 0.62)
      group.add(base, roof, door)
    } else if (type === 'market') {
      const stall = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.6, 1.0), wood)
      stall.position.set(0, 0.3, 0)
      const canopy = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.15, 6, 1, false), new THREE.MeshStandardMaterial({ color: 0xffb84d, roughness: 0.45 }))
      canopy.rotation.x = Math.PI / 2
      canopy.position.set(0, 0.75, 0)
      group.add(stall, canopy)
    } else { // tower
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.6, 1.4, 12), stone)
      base.position.set(0, 0.7, 0)
      const top = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.4, 0.8, 8), roofMat)
      top.position.set(0, 1.6, 0)
      // battlements
      const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.18, 0.4), stone)
      b1.position.set(0.45, 2.0, 0)
      const b2 = b1.clone(); b2.position.set(-0.45, 2.0, 0)
      const b3 = b1.clone(); b3.position.set(0, 2.0, 0.45)
      group.add(base, top, b1, b2, b3)
    }

    // Apply orientation to match planet surface
    group.applyQuaternion(q)

    // Position above hex
    const offsetDistance = 1.2
    group.position.copy(position.clone().add(normal.multiplyScalar(offsetDistance)))

    // Use standard material and add a subtle shadow-catcher plane under building
    group.traverse((o:any) => { if (o.isMesh) o.castShadow = true })

    // Owner tint if owner provided
    if (owner !== null) {
      // We'll apply tint later when player color is known (GameManager may call setPlayerColor)
    }

    this.scene.add(group)

    const building: Building = {
      id,
      owner,
      position: group.position.clone(),
      type,
      health: type === 'tower' ? 100 : type === 'barracks' ? 80 : 60,
      maxHealth: type === 'tower' ? 100 : type === 'barracks' ? 80 : 60,
      mesh: group as unknown as THREE.Mesh
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
