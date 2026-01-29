import * as h3 from 'h3-js'
import * as THREE from 'three'

export interface HexTile {
  address: string
  position: THREE.Vector3
  mesh: THREE.Mesh
  data: {
    owner: number | null
    units: number
    resources: number
    terrainType: 'land' | 'water' | 'mountain'
    isSelected: boolean
  }
}

export class HexagonWorld {
  private scene: THREE.Scene
  private resolution: number
  private hexagons: Map<string, HexTile> = new Map()
  private hexMeshes: THREE.Mesh[] = []
  private radius: number

  constructor(scene: THREE.Scene, radius: number = 5, resolution: number = 3) {
    this.scene = scene
    this.radius = radius
    this.resolution = resolution
    this.generateHexagonGrid()
  }

  private generateHexagonGrid() {
    // Get all hexagons at a given resolution around a center point
    // Use h3-js API: geoToH3 / h3ToGeo / kRing to generate a disk of hexes
    const centerHex = h3.geoToH3(0, 0, this.resolution)
    const hexRing = h3.kRing(centerHex, this.radius)

    hexRing.forEach(address => {
      const [lat, lng] = h3.h3ToGeo(address)
      
      // Convert lat/lng to 3D position on sphere
      const position = this.latLngToSpherePosition(lat, lng)
      
      // Determine terrain type (simple random for now)
      const rand = Math.random()
      const terrainType: 'land' | 'water' | 'mountain' = 
        rand > 0.7 ? 'water' : rand > 0.3 ? 'mountain' : 'land'

      // Create hexagon mesh
      const mesh = this.createHexagonMesh(position, terrainType)
      // tag mesh for raycasting lookup
      ;(mesh as any).userData = (mesh as any).userData || {}
      ;(mesh as any).userData.h3 = address
      this.scene.add(mesh)

      // Store hex data
      const hexTile: HexTile = {
        address,
        position,
        mesh,
        data: {
          owner: null,
          units: 0,
          resources: Math.floor(Math.random() * 100),
          terrainType,
          isSelected: false
        }
      }

      this.hexagons.set(address, hexTile)
      this.hexMeshes.push(mesh)
    })
  }

  private latLngToSpherePosition(lat: number, lng: number): THREE.Vector3 {
    const radius = 30
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi)

    return new THREE.Vector3(x, y, z)
  }

  private createHexagonMesh(position: THREE.Vector3, terrainType: string): THREE.Mesh {
    const geometry = new THREE.CylinderGeometry(2, 2, 0.5, 6)
    
    // Color based on terrain type
    let color = 0x2d5a2d // Green - land
    if (terrainType === 'water') color = 0x1a3a52 // Blue - water
    if (terrainType === 'mountain') color = 0x5a5a5a // Gray - mountain

    const material = new THREE.MeshPhongMaterial({
      color,
      emissive: 0x000000,
      shininess: 30,
      flatShading: false,
      wireframe: false
    })

    const mesh = new THREE.Mesh(geometry, material)
    
    // Orient hexagon to face outward from sphere center
    const normal = position.clone().normalize()
    mesh.position.copy(position)
    
    // Make the hexagon face outward
    const quaternion = new THREE.Quaternion()
    quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), normal)
    mesh.quaternion.copy(quaternion)

    // Add outline
    const edges = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x444444, linewidth: 1 }))
    mesh.add(line)

    return mesh
  }

  public getHexagonAtRay(raycaster: THREE.Raycaster): HexTile | null {
    const intersects = raycaster.intersectObjects(this.hexMeshes, true)

    for (const inter of intersects) {
      let obj: any = inter.object
      // climb up to find top-level mesh we stored
      while (obj && !this.hexMeshes.includes(obj)) {
        obj = obj.parent
      }

      if (obj) {
        // try userData lookup first
        const addr = obj.userData?.h3
        if (addr && this.hexagons.has(addr)) return this.hexagons.get(addr)!

        // fallback: match mesh reference
        for (const hex of this.hexagons.values()) {
          if (hex.mesh === obj) return hex
        }
      }
    }

    return null
  }

  public selectHexagon(hex: HexTile): void {
    // Deselect previous
    this.hexagons.forEach(h => {
      if (h.data.isSelected) {
        h.data.isSelected = false
        ;(h.mesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x000000)
      }
    })

    // Select new
    hex.data.isSelected = true
    ;(hex.mesh.material as THREE.MeshPhongMaterial).emissive.setHex(0x4a9eff)
  }

  public getHexagons(): HexTile[] {
    return Array.from(this.hexagons.values())
  }

  public getHexagonByAddress(address: string): HexTile | undefined {
    return this.hexagons.get(address)
  }

  public getNeighboringHexagons(address: string): HexTile[] {
    const neighbors = h3.gridDisk(address, 1)
    return neighbors
      .filter(addr => addr !== address && this.hexagons.has(addr))
      .map(addr => this.hexagons.get(addr)!)
  }
}
