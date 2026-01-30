import * as h3legacy from 'h3-js/legacy'
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
  private hoveredHex: string | null = null
  private group: THREE.Group

  // kRadius: how many rings of hexes around center. sphereRadius: visual sphere size in world units
  constructor(scene: THREE.Scene, kRadius: number = 5, resolution: number = 3, sphereRadius: number = 60) {
    this.scene = scene
    this.radius = kRadius
    this.resolution = resolution
    ;(this as any).sphereRadius = sphereRadius
    // create group to hold the globe so we can rotate it and show it behind UI
    this.group = new THREE.Group()
    this.scene.add(this.group)
    // create an actual globe mesh under the hexagons
    this.createGlobe()
    this.generateHexagonGrid()
  }

  private createGlobe() {
    const radius = (this as any).sphereRadius || 60
    const geo = new THREE.SphereGeometry(radius - 0.35, 64, 40)
    // Slightly glossy planet material; color tuned to match theme
    const mat = new THREE.MeshStandardMaterial({ color: 0x071a2a, roughness: 0.7, metalness: 0.06 })

    // subtle latitudinal shading using vertex colors would be nicer, but keep simple
    const sphere = new THREE.Mesh(geo, mat)
    sphere.receiveShadow = true
    sphere.castShadow = false
    sphere.renderOrder = -1

    // add faint cloud layer for interest
    const cloudGeo = new THREE.SphereGeometry(radius - 0.3, 48, 32)
    const cloudMat = new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.02, depthWrite: false })
    const clouds = new THREE.Mesh(cloudGeo, cloudMat)
    clouds.renderOrder = -0.5

    this.group.add(sphere)
    this.group.add(clouds)
  }

  private generateHexagonGrid() {
    // Build disk of hexes using H3 and generate per-cell boundary polygons
    const centerHex = (h3legacy as any).geoToH3(0, 0, this.resolution)
    const hexRing = (h3legacy as any).kRing(centerHex, this.radius)

    hexRing.forEach((address: string) => {
      const [lat, lng] = (h3legacy as any).h3ToGeo(address)

      // Convert lat/lng to 3D position on sphere
      const position = this.latLngToSpherePosition(lat, lng)

      // Get the geo boundary for the exact H3 cell polygon
      let boundary: Array<[number, number]> = []
      try {
        boundary = (h3legacy as any).h3ToGeoBoundary(address)
      } catch (e) {
        // If unavailable, approximate a hex by sampling around the center
        const step = 6
        for (let i = 0; i < step; i++) {
          const ang = (i / step) * Math.PI * 2
          const dLat = 0.01 * Math.cos(ang)
          const dLng = 0.01 * Math.sin(ang)
          boundary.push([lat + dLat, lng + dLng])
        }
      }

      // Determine terrain type (simple random for now)
      const rand = Math.random()
      const terrainType: 'land' | 'water' | 'mountain' = 
        rand > 0.7 ? 'water' : rand > 0.3 ? 'mountain' : 'land'

      // Create hexagon mesh using exact boundary polygon
      const mesh = this.createHexagonMesh(position, boundary, terrainType)
      ;(mesh as any).userData = (mesh as any).userData || {}
      ;(mesh as any).userData.h3 = address
      // add to globe group so it rotates behind UI
      this.group.add(mesh)

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
    const radius = (this as any).sphereRadius || 60
    const phi = (90 - lat) * (Math.PI / 180)
    const theta = (lng + 180) * (Math.PI / 180)

    const x = radius * Math.sin(phi) * Math.cos(theta)
    const z = radius * Math.sin(phi) * Math.sin(theta)
    const y = radius * Math.cos(phi)

    return new THREE.Vector3(x, y, z)
  }

  private createHexagonMesh(position: THREE.Vector3, boundary: Array<[number, number]>, terrainType: string): THREE.Mesh {
    // Build tangent basis for projecting boundary points to local 2D plane
    const normal = position.clone().normalize()
    let tangent = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), normal)
    if (tangent.length() < 1e-3) tangent = new THREE.Vector3(1, 0, 0).cross(normal)
    tangent.normalize()
    const bitangent = new THREE.Vector3().crossVectors(normal, tangent).normalize()

    // Project boundary lat/lng to local 2D coordinates
    const shape = new THREE.Shape()
    boundary.forEach((pt, idx) => {
      const [lat, lng] = pt
      const worldPt = this.latLngToSpherePosition(lat, lng)
      const v = worldPt.clone().sub(position)
      const x = v.dot(tangent)
      const y = v.dot(bitangent)
      if (idx === 0) shape.moveTo(x, y)
      else shape.lineTo(x, y)
    })

    // Extrude to give thickness
    const sphereRadius = (this as any).sphereRadius || 60
    const baseDepth = Math.max(0.25, sphereRadius * 0.007)
    // Make mountain tiles thicker, water shallower
    const depth = terrainType === 'mountain' ? baseDepth * 1.6 : terrainType === 'water' ? baseDepth * 0.6 : baseDepth
    const extrudeSettings: any = { depth, bevelEnabled: true, bevelThickness: depth * 0.08, bevelSize: depth * 0.04, bevelSegments: 2 }
    const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings)

    // Brightened material selection per terrain
    let color = 0x4dbd4d // brighter green - land
    let roughness = 0.6
    let metalness = 0.0
    let emissive = 0x000000
    if (terrainType === 'water') { color = 0x36a6ff; roughness = 0.18; metalness = 0.12 }
    if (terrainType === 'mountain') { color = 0x9aa0a6; roughness = 0.9; metalness = 0 }

    const material = new THREE.MeshStandardMaterial({ color, roughness, metalness, emissive, flatShading: false })
    const mesh = new THREE.Mesh(geometry, material)

    // Orient extruded shape so its local +Z aligns with the surface normal
    const q = new THREE.Quaternion()
    q.setFromUnitVectors(new THREE.Vector3(0, 0, 1), normal)
    mesh.applyQuaternion(q)

    // Place mesh slightly above/below the surface depending on terrain
    const offset = terrainType === 'mountain' ? 0.045 : terrainType === 'water' ? -0.02 : 0.02
    mesh.position.copy(position.clone().add(normal.clone().multiplyScalar(offset)))

    // Subtle edge highlight using edges but very faint
    const edges = new THREE.EdgesGeometry(geometry)
    const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0x0f1724, opacity: 0.18, transparent: true }))
    mesh.add(line)

    return mesh
  }

  public setHoverHexagon(hex: HexTile | null) {
    // Clear previous hover
    if (this.hoveredHex && this.hexagons.has(this.hoveredHex)) {
      const prev = this.hexagons.get(this.hoveredHex)!
      if (!prev.data.isSelected) {
        const mat = prev.mesh.material as any
        if (mat && mat.emissive) mat.emissive.setHex(0x000000)
        // restore color if we brightened it earlier
        if (mat && mat.color && mat.userData && mat.userData.originalColor) {
          mat.color.copy(mat.userData.originalColor)
        }
        prev.mesh.scale.set(1,1,1)
      }
    }

    if (!hex) {
      this.hoveredHex = null
      return
    }

    // If a hex is selected, let selection visuals take precedence
    if (hex.data.isSelected) {
      this.hoveredHex = hex.address
      return
    }

    const mat = hex.mesh.material as any
    if (mat) {
      if (!mat.userData) mat.userData = {}
      if (!mat.userData.originalColor) mat.userData.originalColor = mat.color.clone()
      // slight brighten
      mat.color.lerp(new THREE.Color(0xffffff), 0.12)
      if (mat.emissive) mat.emissive.setHex(0x1f8fff)
    }
    hex.mesh.scale.set(1.03, 1.03, 1.03)
    this.hoveredHex = hex.address
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
        const mat = h.mesh.material as any
        if (mat && mat.emissive) mat.emissive.setHex(0x000000)
        h.mesh.scale.set(1, 1, 1)
      }
    })

    // Select new
    hex.data.isSelected = true
    const mat = hex.mesh.material as any
    if (mat) {
      if (mat.emissive) mat.emissive.setHex(0x60c6ff)
      // slight color brighten for selection
      const current = (mat.color && mat.color.clone) ? mat.color.clone() : null
      if (current) mat.color.lerp(new THREE.Color(0x7fd1ff), 0.22)
    }
    hex.mesh.scale.set(1.08, 1.08, 1.08)
  }

  public getHexagons(): HexTile[] {
    return Array.from(this.hexagons.values())
  }

  public getHexagonByAddress(address: string): HexTile | undefined {
    return this.hexagons.get(address)
  }

  public getNeighboringHexagons(address: string): HexTile[] {
    const neighbors = (h3legacy as any).kRing(address, 1)
    return neighbors
      .filter((addr: string) => addr !== address && this.hexagons.has(addr))
      .map((addr: string) => this.hexagons.get(addr)!)
  }

  // rotate globe slowly; call from main animation loop
  private menuOpen: boolean = false

  public setMenuOpen(open: boolean) {
    this.menuOpen = !!open
  }

  public update(deltaTime: number) {
    if (this.group) {
      const speed = this.menuOpen ? 0.02 : 0.06
      this.group.rotation.y += deltaTime * speed
    }
  }
}
