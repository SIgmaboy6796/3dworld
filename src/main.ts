import * as THREE from 'three'
import { HexagonWorld } from './world/hexagonWorld'
import { GameManager } from './game/gameManager'
import { InputManager } from './input/inputManager'

// Initialize scene
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setClearColor(0x000816, 1)
document.body.appendChild(renderer.domElement)

// Initialize game systems
const hexagonWorld = new HexagonWorld(scene, 5) // Radius 5 - adjust for more/fewer hexagons
const gameManager = new GameManager(scene, hexagonWorld)
const inputManager = new InputManager(camera, hexagonWorld, gameManager)

// Setup camera
camera.position.set(0, 40, 50)
camera.lookAt(0, 0, 0)

// Setup lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.6)
scene.add(ambientLight)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
directionalLight.position.set(50, 50, 50)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.far = 500
scene.add(directionalLight)

// Handle window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
})

// FPS counter
let lastTime = performance.now()
let frameCount = 0

const animate = () => {
  requestAnimationFrame(animate)

  // Calculate FPS
  const currentTime = performance.now()
  const deltaTime = (currentTime - lastTime) / 1000
  lastTime = currentTime
  frameCount++

  if (frameCount % 30 === 0) {
    const fps = Math.round(1 / deltaTime)
    document.getElementById('fps')!.textContent = `FPS: ${fps}`
  }

  // Update game
  gameManager.update(deltaTime)
  inputManager.update(camera)

  // Render
  renderer.render(scene, camera)
}

animate()
