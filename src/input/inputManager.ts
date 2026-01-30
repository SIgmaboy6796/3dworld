import * as THREE from 'three'
import { HexagonWorld } from '../world/hexagonWorld'
import { GameManager } from '../game/gameManager'

export class InputManager {
  private camera: THREE.Camera
  private hexagonWorld: HexagonWorld
  private gameManager: GameManager
  private raycaster: THREE.Raycaster
  private mouse: THREE.Vector2
  private isDragging: boolean = false
  private previousMousePosition: { x: number; y: number } = { x: 0, y: 0 }

  constructor(camera: THREE.Camera, hexagonWorld: HexagonWorld, gameManager: GameManager) {
    this.camera = camera
    this.hexagonWorld = hexagonWorld
    this.gameManager = gameManager
    this.raycaster = new THREE.Raycaster()
    this.mouse = new THREE.Vector2()

    this.setupEventListeners()
  }

  private setupEventListeners(): void {
    // Mouse events for hex selection
    document.addEventListener('click', (event) => this.onMouseClick(event))

    // Mouse events for camera rotation
    document.addEventListener('mousedown', (event) => this.onMouseDown(event))
    document.addEventListener('mousemove', (event) => this.onMouseMove(event))
    document.addEventListener('mouseup', () => this.onMouseUp())

    // Wheel for zoom
    document.addEventListener('wheel', (event) => this.onMouseWheel(event), { passive: false })

    // Keyboard events
    document.addEventListener('keydown', (event) => this.onKeyDown(event))
  }

  private onMouseClick(event: MouseEvent): void {
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    this.raycaster.setFromCamera(this.mouse, this.camera)

    const hex = this.hexagonWorld.getHexagonAtRay(this.raycaster)
    if (hex) {
      this.gameManager.selectHexagon(hex)
    }
  }

  private onMouseDown(event: MouseEvent): void {
    if (event.button === 2 || event.button === 0) {
      this.isDragging = true
      this.previousMousePosition = { x: event.clientX, y: event.clientY }
    }
  }

  private onMouseMove(event: MouseEvent): void {
    // always update mouse coordinates for hover/raycast
    this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
    this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1

    // Hover handling when not dragging
    if (!this.isDragging) {
      this.raycaster.setFromCamera(this.mouse, this.camera)
      const hex = this.hexagonWorld.getHexagonAtRay(this.raycaster)
      this.hexagonWorld.setHoverHexagon(hex)
      window.dispatchEvent(new CustomEvent('hexHover', { detail: { hex, x: event.clientX, y: event.clientY } }))
    }

    if (!this.isDragging) return

    const deltaX = event.clientX - this.previousMousePosition.x
    const deltaY = event.clientY - this.previousMousePosition.y

    this.rotateCamera(deltaX, deltaY)
    this.previousMousePosition = { x: event.clientX, y: event.clientY }
  }

  private onMouseUp(): void {
    this.isDragging = false
  }

  private onMouseWheel(event: WheelEvent): void {
    event.preventDefault()
    
    const direction = this.camera.position.clone().normalize()
    const distance = this.camera.position.length()
    const newDistance = event.deltaY > 0 ? distance * 1.1 : distance / 1.1

    // Clamp distance
    const clampedDistance = Math.max(20, Math.min(150, newDistance))
    
    this.camera.position.copy(direction.multiplyScalar(clampedDistance))
  }

  private rotateCamera(deltaX: number, deltaY: number): void {
    const sphere = {
      radius: this.camera.position.length(),
      phi: Math.acos(this.camera.position.y / this.camera.position.length()),
      theta: Math.atan2(this.camera.position.z, this.camera.position.x)
    }

    sphere.theta -= deltaX * 0.005
    sphere.phi -= deltaY * 0.005

    // Clamp phi
    sphere.phi = Math.max(0.1, Math.min(Math.PI - 0.1, sphere.phi))

    const x = sphere.radius * Math.sin(sphere.phi) * Math.cos(sphere.theta)
    const z = sphere.radius * Math.sin(sphere.phi) * Math.sin(sphere.theta)
    const y = sphere.radius * Math.cos(sphere.phi)

    this.camera.position.set(x, y, z)
    this.camera.lookAt(0, 0, 0)
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.key.toLowerCase()) {
      case 'r':
        // Reset camera
        this.camera.position.set(0, 40, 50)
        this.camera.lookAt(0, 0, 0)
        break
      case '1':
        // Claim hexagon
        this.gameManager.claimHexagon()
        break
      case '2':
        // Spawn soldier
        this.gameManager.spawnUnit('soldier')
        break
      case '3':
        // Spawn archer
        this.gameManager.spawnUnit('archer')
        break
      case '4':
        // Spawn scout
        this.gameManager.spawnUnit('scout')
        break
      case 'p':
        // Switch player
        this.gameManager.switchPlayer()
        console.log(`Switched to player ${this.gameManager.getCurrentPlayer()}`)
        break
    }
  }

  public update(camera: THREE.Camera): void {
    this.camera = camera
  }
}
