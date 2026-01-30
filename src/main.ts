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
// Ensure canvas sits above any background layers
renderer.domElement.style.position = 'relative'
renderer.domElement.style.zIndex = '2'

// Starfield & theme handling
let starCanvas: HTMLCanvasElement | null = null
let starCtx: CanvasRenderingContext2D | null = null

function createStarfield() {
  if (starCanvas) return
  starCanvas = document.createElement('canvas')
  starCanvas.id = 'starfield'
  starCanvas.style.position = 'fixed'
  starCanvas.style.left = '0'
  starCanvas.style.top = '0'
  starCanvas.style.width = '100%'
  starCanvas.style.height = '100%'
  starCanvas.style.zIndex = '1'
  starCanvas.style.pointerEvents = 'none'
  starCanvas.width = window.innerWidth
  starCanvas.height = window.innerHeight
  starCtx = starCanvas.getContext('2d')
  if (starCtx) {
    starCtx.fillStyle = '#000'
    starCtx.fillRect(0,0,starCanvas.width, starCanvas.height)
    for (let i = 0; i < 200; i++) {
      const x = Math.random() * starCanvas.width
      const y = Math.random() * starCanvas.height
      const r = Math.random() * 1.2
      starCtx.fillStyle = `rgba(255,255,255,${0.7*Math.random()+0.3})`
      starCtx.beginPath()
      starCtx.arc(x, y, r, 0, Math.PI*2)
      starCtx.fill()
    }
  }
  document.body.insertBefore(starCanvas, renderer.domElement)
}

function removeStarfield() {
  if (!starCanvas) return
  starCanvas.remove()
  starCanvas = null
  starCtx = null
}

window.addEventListener('themeChange', (e: any) => {
  const isDark = e.detail?.isDark ?? true
  if (isDark) {
    // dark mode
    renderer.setClearColor(0x000000, 1)
    createStarfield()
  } else {
    // light mode - bluish sky
    renderer.setClearColor(0x68b8ff, 1)
    removeStarfield()
  }
})

// initialize theme from body class
if (document.body.classList.contains('light')) {
  renderer.setClearColor(0x68b8ff, 1)
} else {
  renderer.setClearColor(0x000000, 1)
  createStarfield()
}

// Initialize game systems
// kRadius: number of hex rings (4 -> modest map)
// resolution: H3 resolution (3 is fine for dev), sphereRadius: visual size
// Use resolution 2 for larger hex cells and a larger visual sphere
const hexagonWorld = new HexagonWorld(scene, 4, 2, 90)
const gameManager = new GameManager(scene, hexagonWorld)
const inputManager = new InputManager(camera, hexagonWorld, gameManager)

// Setup camera - pulled back to see the larger sphere
camera.position.set(0, 140, 200)
camera.lookAt(0, 0, 0)

// Setup better lighting for materials
const hemi = new THREE.HemisphereLight(0xeeeeff, 0x444455, 0.7)
scene.add(hemi)

const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9)
directionalLight.position.set(100, 150, 120)
directionalLight.castShadow = true
directionalLight.shadow.mapSize.width = 2048
directionalLight.shadow.mapSize.height = 2048
directionalLight.shadow.camera.far = 500
scene.add(directionalLight)

// subtle rim light for nicer silhouettes
const rim = new THREE.DirectionalLight(0x90cdf4, 0.25)
rim.position.set(-80, -40, -60)
scene.add(rim)

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
