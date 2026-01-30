import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass'
import { HexagonWorld } from './world/hexagonWorld'
import { GameManager } from './game/gameManager'
import { InputManager } from './input/inputManager'

// Initialize scene
const scene = new THREE.Scene()
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000)
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })

renderer.setSize(window.innerWidth, window.innerHeight)
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
renderer.toneMapping = THREE.ACESFilmicToneMapping
renderer.toneMappingExposure = 1.0
renderer.setClearColor(0x000816, 1)
document.body.appendChild(renderer.domElement)

// Post-processing composer
const composer = new EffectComposer(renderer)
const renderPass = new RenderPass(scene, camera)
composer.addPass(renderPass)
const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.28, 0.6, 0.2)
bloom.threshold = 0.2
bloom.strength = 0.9
bloom.radius = 0.5
composer.addPass(bloom)


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
  if (!starCtx) return

  // create a set of stars with slight twinkle
  const stars: Array<{x:number,y:number,r:number,baseA:number,phase:number,speed:number}> = []
  const count = 700
  for (let i = 0; i < count; i++) {
    stars.push({ x: Math.random()*starCanvas.width, y: Math.random()*starCanvas.height, r: Math.random()*1.2, baseA: 0.15 + Math.random()*0.85, phase: Math.random()*Math.PI*2, speed: 0.6 + Math.random()*1.4 })
  }

  const draw = (t:number) => {
    if (!starCtx || !starCanvas) return
    starCtx.clearRect(0,0,starCanvas.width, starCanvas.height)
    starCtx.fillStyle = '#000'
    starCtx.fillRect(0,0,starCanvas.width, starCanvas.height)
    for (const s of stars) {
      const a = Math.max(0.05, Math.min(1, s.baseA * (0.8 + 0.25*Math.sin(s.phase + t*0.001*s.speed))))
      starCtx.globalAlpha = a
      starCtx.fillStyle = `#ffffff`
      starCtx.beginPath()
      starCtx.arc(s.x, s.y, s.r, 0, Math.PI*2)
      starCtx.fill()
    }
    starCtx.globalAlpha = 1
    requestAnimationFrame(draw)
  }

  draw(performance.now())
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

  // let world tweak its visuals
  if ((hexagonWorld as any)?.setTheme) (hexagonWorld as any).setTheme(isDark)
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
// Enable fullCoverage=true to sample the globe and deduplicate H3 cells across lat/lng
const hexagonWorld = new HexagonWorld(scene, 4, 2, 90, true)
// ensure the world uses the current theme tone
hexagonWorld.setTheme(!document.body.classList.contains('light'))
const gameManager = new GameManager(scene, hexagonWorld)
const inputManager = new InputManager(camera, hexagonWorld, gameManager)

// Pause globe rotation while menu open for clearer menu presentation
window.addEventListener('menuOpen', (e: any) => {
  hexagonWorld.setMenuOpen(!!e.detail?.open)
})

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
  composer.setSize(width, height)
  composer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1))
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
  // rotate globe
  hexagonWorld.update(deltaTime)

  // Render (postprocessing)
  composer.render()
}

animate()
