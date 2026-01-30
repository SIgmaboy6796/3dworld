import * as THREE from 'three'
import { HexagonWorld, HexTile } from '../world/hexagonWorld'
import { BuildingManager } from './buildingManager'
import { ResourceManager } from './resourceManager'
import { UIManager } from '../ui/uiManager'

export interface Unit {
  id: string
  owner: number
  position: THREE.Vector3
  type: 'soldier' | 'archer' | 'scout'
  health: number
  maxHealth: number
  mesh?: THREE.Mesh
}

export class GameManager {
  private scene: THREE.Scene
  private hexagonWorld: HexagonWorld
  private selectedHexagon: HexTile | null = null
  private units: Unit[] = []
  private takeoverTasks: Array<{ id: string; target: string; owner: number; attackers: number; progress: number; rate: number }> = []
  private takeoverPercent: number = 50
  private buildingManager: BuildingManager
  private resourceManager: ResourceManager
  private uiManager: UIManager
  private players: Map<number, { name: string; color: number }> = new Map()
  private currentPlayer: number = 0

  constructor(scene: THREE.Scene, hexagonWorld: HexagonWorld) {
    this.scene = scene
    this.hexagonWorld = hexagonWorld
    this.buildingManager = new BuildingManager(scene)
    this.resourceManager = new ResourceManager(3) // 3 players
    this.uiManager = new UIManager(this, this.resourceManager)
    this.initializePlayers()
    this.setupGameActions()

    // Listen for coverage toggle from UI
    window.addEventListener('fullCoverageToggle', (e: any) => {
      const enabled = !!e.detail?.enabled
      this.hexagonWorld.regenerate(enabled)
    })

    // Listen for takeover percentage changes
    this.takeoverPercent = 50
    window.addEventListener('takeoverPercentChanged', (e: any) => {
      if (typeof e.detail?.percent === 'number') this.takeoverPercent = Math.max(1, Math.min(100, Math.round(e.detail.percent)))
    })
  }

  private initializePlayers() {
    this.players.set(0, { name: 'Player 1', color: 0xff6666 })
    this.players.set(1, { name: 'Player 2', color: 0x66a3ff })
    this.players.set(2, { name: 'Player 3', color: 0xffd166 })
  }

  public setPlayerName(player: number, name: string) {
    const p = this.players.get(player)
    if (p) p.name = name
  }

  public setPlayerColor(player: number, colorHex: number) {
    const p = this.players.get(player)
    if (p) p.color = colorHex
  }

  private setupGameActions() {
    ;(window as any).gameActions = {
      claimHex: () => this.initiateTakeover(),
      spawnSoldier: () => this.spawnUnit('soldier'),
      spawnArcher: () => this.spawnUnit('archer'),
      spawnScout: () => this.spawnUnit('scout'),
      buildBarracks: () => this.buildBuilding('barracks'),
      buildMarket: () => this.buildBuilding('market'),
      buildTower: () => this.buildBuilding('tower')
    }
  }

  public selectHexagon(hex: HexTile): void {
    this.selectedHexagon = hex
    this.hexagonWorld.selectHexagon(hex)
    this.updateHexInfo(hex)
  }

  private updateHexInfo(hex: HexTile): void {
    const info = document.getElementById('hex-info')
    if (!info) return

    const neighbors = this.hexagonWorld.getNeighboringHexagons(hex.address)
    const ownerName = hex.data.owner !== null ? (this.players.get(hex.data.owner)?.name || `Player ${hex.data.owner}`) : 'None'
    const ownerColor = hex.data.owner !== null ? this.players.get(hex.data.owner)?.color : null

    info.innerHTML = `
      <div><strong>Hex Address:</strong> ${hex.address.substring(0, 12)}...</div>
      <div><strong>Terrain:</strong> ${hex.data.terrainType}</div>
      <div><strong>Resources:</strong> ${hex.data.resources}</div>
      <div><strong>Owner:</strong> ${ownerColor ? `<span style="display:inline-block;width:12px;height:12px;background:#${(ownerColor.toString(16)).padStart(6,'0')};border-radius:50%;margin-right:6px;vertical-align:middle;"></span>` : ''}${ownerName}</div>
      <div><strong>Units:</strong> ${hex.data.units}</div>
      <div><strong>Neighbors:</strong> ${neighbors.length}</div>
      <hr/>
      <div style="font-size: 11px;">Use buttons above to interact</div>
    `
  }

  // Start a takeover operation using the currently selected hex and the configured takeover percent
  public initiateTakeover(): void {
    if (!this.selectedHexagon) return

    const hex = this.selectedHexagon
    if (hex.data.owner !== null && hex.data.owner === this.currentPlayer) {
      console.log('Already owned')
      return
    }

    // Determine available troops (simple: total units owned - already committed)
    const totalOwned = this.getUnitCount(this.currentPlayer)
    const committed = this.takeoverTasks.filter(t => t.owner === this.currentPlayer).reduce((s, t) => s + t.attackers, 0)
    const available = Math.max(0, totalOwned - committed)

    const commit = Math.max(1, Math.round((this.takeoverPercent / 100) * totalOwned))
    if (available <= 0 || commit <= 0) {
      console.log('No troops available for takeover')
      return
    }

    const attackers = Math.min(commit, available)

    // base time to takeover ~ 8 seconds per attacker at 1 attacker, so more attackers speed it up
    const baseTime = 8.0
    const rate = attackers / baseTime

    const id = `to_${Date.now()}_${Math.round(Math.random()*1000)}`
    this.takeoverTasks.push({ id, target: hex.address, owner: this.currentPlayer, attackers, progress: 0, rate })

    console.log(`Started takeover on ${hex.address} with ${attackers} attackers (rate ${rate.toFixed(3)})`)
  }

  // Instant claim helper used internally when takeover completes
  private finalizeTakeover(targetAddress: string, owner: number) {
    const hex = this.hexagonWorld.getHexagonByAddress(targetAddress)
    if (!hex) return
    hex.data.owner = owner
    const player = this.players.get(owner)
    if (player) {
      const mat = hex.mesh.material as any
      if (mat && mat.color) {
        const base = mat.color.clone()
        const tint = new THREE.Color(player.color)
        base.lerp(tint, 0.5)
        mat.color.copy(base)
      }
    }
    // cleanup info UI
    this.updateHexInfo(hex)
  }

  public spawnUnit(type: 'soldier' | 'archer' | 'scout'): void {
    if (!this.selectedHexagon) return

    const costs: { [key: string]: number } = {
      soldier: 100,
      archer: 100,
      scout: 75
    }

    if (!this.resourceManager.removeResources(this.currentPlayer, costs[type])) {
      console.log(`Not enough resources to spawn ${type}`)
      return
    }

    const hex = this.selectedHexagon
    const unit: Unit = {
      id: `unit_${this.units.length}_${Date.now()}`,
      owner: this.currentPlayer,
      position: hex.position.clone(),
      type,
      health: type === 'archer' ? 15 : type === 'scout' ? 10 : 20,
      maxHealth: type === 'archer' ? 15 : type === 'scout' ? 10 : 20
    }

    this.units.push(unit)
    hex.data.units++
    this.createUnitVisual(unit, hex)
    this.updateHexInfo(hex)
  }

  private createUnitVisual(unit: Unit, hex: HexTile): void {
    const geometry = new THREE.SphereGeometry(0.5, 8, 8)
    const player = this.players.get(unit.owner)!
    const material = new THREE.MeshPhongMaterial({ color: player.color })
    const mesh = new THREE.Mesh(geometry, material)

    // Position above the hex
    const offset = hex.position.clone().normalize().multiplyScalar(1.5)
    mesh.position.copy(hex.position.clone().add(offset))

    this.scene.add(mesh)
    unit.mesh = mesh
  }

  public buildBuilding(type: 'barracks' | 'market' | 'tower'): void {
    if (!this.selectedHexagon) return

    const costs: { [key: string]: number } = {
      barracks: 200,
      market: 150,
      tower: 300
    }

    if (!this.resourceManager.removeResources(this.currentPlayer, costs[type])) {
      console.log(`Not enough resources to build ${type}`)
      return
    }

    const hex = this.selectedHexagon
    this.buildingManager.createBuilding(this.currentPlayer, hex.position, type)
    this.updateHexInfo(hex)
  }

  public update(deltaTime: number): void {
    // Update resources
    this.resourceManager.update(deltaTime)

    // Update unit positions
    this.units.forEach(unit => {
      // Simple animation
      if (unit.mesh) {
        unit.mesh.rotation.y += deltaTime * 0.5
      }
    })

    // Update takeover tasks
    for (let i = this.takeoverTasks.length - 1; i >= 0; i--) {
      const t = this.takeoverTasks[i]
      t.progress += t.rate * deltaTime
      // visual feedback on the hex being attacked
      const hex = this.hexagonWorld.getHexagonByAddress(t.target)
      if (hex) {
        const mat = hex.mesh.material as any
        const ownerColor = this.players.get(t.owner)?.color || 0x7fd1ff
        if (mat && mat.emissive) {
          // set emissive color scaled by progress
          const c = new THREE.Color(ownerColor)
          const intensity = Math.min(0.9, 0.12 + 0.8 * Math.min(1, t.progress))
          mat.emissive.copy(c)
          mat.emissiveIntensity = intensity
        }
      }

      if (t.progress >= 1) {
        // takeover complete
        this.finalizeTakeover(t.target, t.owner)
        // remove task
        this.takeoverTasks.splice(i, 1)
      }
    }
  }

  public getUnitCount(player: number): number {
    return this.units.filter(u => u.owner === player).length
  }

  public getSelectedHexagon(): HexTile | null {
    return this.selectedHexagon
  }

  public getCurrentPlayer(): number {
    return this.currentPlayer
  }

  public getPlayer(player: number) {
    return this.players.get(player)
  }

  public switchPlayer(): void {
    this.currentPlayer = (this.currentPlayer + 1) % this.players.size
    this.uiManager.setCurrentPlayer(this.currentPlayer)
  }
}
