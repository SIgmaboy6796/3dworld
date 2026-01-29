import { GameManager } from '../game/gameManager'
import { ResourceManager } from '../game/resourceManager'

export class UIManager {
  private resourceManager: ResourceManager
  private currentPlayer: number = 0
  private mainMenuEl: HTMLDivElement | null = null
  private radialEl: HTMLDivElement | null = null
  private isDark: boolean = true

  constructor(_gameManager: GameManager, resourceManager: ResourceManager) {
    this.resourceManager = resourceManager
    this.setupUI()
  }

  private setupUI(): void {
    const style = document.createElement('style')
    style.textContent = `
      #game-ui {
        position: absolute;
        top: 20px;
        right: 20px;
        background: var(--panel);
        border: 2px solid var(--panel-border);
        border-radius: 8px;
        padding: 20px;
        font-size: 14px;
        width: 300px;
        pointer-events: auto;
      }

      .player-card {
        background: rgba(0, 0, 0, 0.12);
        border: 1px solid var(--panel-border);
        border-radius: 5px;
        padding: 12px;
        margin-bottom: 10px;
      }

      .player-card.active { box-shadow: 0 4px 12px rgba(0,0,0,0.3) }

      .resource-bar { background: var(--muted); border-radius: 3px; height: 20px; margin-top: 5px; overflow:hidden }
      .resource-fill { background: linear-gradient(90deg, var(--accent), #00ff00); height:100%; transition:width 0.2s; display:flex; align-items:center; justify-content:flex-end; padding-right:5px; font-size:11px }

      .action-buttons { margin-top: 15px; padding-top: 15px; border-top: 1px solid var(--panel-border) }

      button { background: var(--accent); border: none; color: white; padding: 8px 12px; margin: 5px 0; border-radius: 6px; cursor: pointer; width:100%; font-size:12px }
      button:hover { filter:brightness(.95) }

      /* main menu card */
      #main-menu { position: absolute; inset:0; display:flex; align-items:center; justify-content:center; background: rgba(0,0,0,0.6); z-index:50 }
      #main-menu .card { width:360px; padding:22px; border-radius:12px; background:var(--panel); border:1px solid var(--panel-border); text-align:center }

      /* theme toggle */
      #theme-toggle { position:absolute; top:18px; right:18px; z-index:100; background:var(--panel); border:1px solid var(--panel-border); padding:8px 10px; border-radius:8px; cursor:pointer }

      /* radial menu */
      .radial-menu { position:absolute; width:180px; height:180px; pointer-events:none; transform: translate(-50%,-50%) scale(0); transition: transform 200ms cubic-bezier(.2,.9,.2,1), opacity 180ms; opacity:0; z-index:60 }
      .radial-menu.open { pointer-events:auto; transform: translate(-50%,-50%) scale(1); opacity:1 }
      .radial-menu .center { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:56px; height:56px; border-radius:50%; background:var(--accent); display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 6px 18px rgba(0,0,0,0.4) }
      .radial-menu button.item { position:absolute; left:50%; top:50%; transform-origin: -50% -50%; width:48px; height:48px; border-radius:50%; border:none; background:var(--panel); color:var(--text); cursor:pointer; box-shadow:0 6px 14px rgba(0,0,0,0.35); transition: transform 260ms cubic-bezier(.2,.9,.2,1), opacity 200ms }

    `
    document.head.appendChild(style)

    const container = document.createElement('div')
    container.id = 'game-ui'
    document.body.appendChild(container)

    this.createThemeToggle()
    this.createMainMenu()
    this.createRadialMenu()

    this.updateUI()
    setInterval(() => this.updateUI(), 500)
  }

  private createThemeToggle() {
    const btn = document.createElement('div')
    btn.id = 'theme-toggle'
    btn.innerHTML = `<span>Dark</span> / Light`
    document.body.appendChild(btn)
    btn.addEventListener('click', () => {
      this.isDark = !this.isDark
      if (this.isDark) document.body.classList.remove('light')
      else document.body.classList.add('light')
    })
  }

  private createMainMenu() {
    const overlay = document.createElement('div')
    overlay.id = 'main-menu'
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `
      <h2>3D Hexagon RTS</h2>
      <p style="margin:10px 0 18px;">Choose play mode</p>
      <button id="single-btn" style="width:100%; padding:12px; margin-bottom:10px;">Single Player</button>
      <button id="multi-btn" style="width:100%; padding:12px; margin-bottom:10px;">Multiplayer</button>
      <div style="font-size:12px; color:var(--text); opacity:0.8; margin-top:8px;">Press ESC to toggle menu</div>
    `
    overlay.appendChild(card)
    document.body.appendChild(overlay)
    this.mainMenuEl = overlay

    document.getElementById('single-btn')!.addEventListener('click', () => this.startSinglePlayer())
    document.getElementById('multi-btn')!.addEventListener('click', () => this.startMultiplayer())

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') this.toggleMainMenu()
    })
  }

  private hideMainMenu() {
    if (!this.mainMenuEl) return
    this.mainMenuEl.style.display = 'none'
  }

  private toggleMainMenu() {
    if (!this.mainMenuEl) return
    const show = this.mainMenuEl.style.display === 'none'
    this.mainMenuEl.style.display = show ? 'flex' : 'none'
    if (show) this.closeRadial()
  }

  public startSinglePlayer() {
    this.hideMainMenu()
    this.setCurrentPlayer(0)
    this.closeRadial()
  }

  public startMultiplayer() {
    this.hideMainMenu()
    // multiplayer setup placeholder - future implementation
    this.setCurrentPlayer(0)
    this.closeRadial()
  }

  private createRadialMenu() {
    const root = document.createElement('div')
    root.className = 'radial-menu'
    root.id = 'radial-menu'

    const center = document.createElement('div')
    center.className = 'center'
    center.innerHTML = '&#9679;'
    root.appendChild(center)

    const actions: Array<{id:string,label:string,cb:string}> = [
      { id: 'claim', label: '1', cb: 'claimHex' },
      { id: 'soldier', label: '2', cb: 'spawnSoldier' },
      { id: 'archer', label: '3', cb: 'spawnArcher' },
      { id: 'scout', label: '4', cb: 'spawnScout' },
      { id: 'barracks', label: 'B', cb: 'buildBarracks' },
      { id: 'market', label: 'M', cb: 'buildMarket' },
      { id: 'tower', label: 'T', cb: 'buildTower' }
    ]

    actions.forEach((a, i) => {
      const btn = document.createElement('button')
      btn.className = 'item'
      btn.dataset.action = a.cb
      btn.innerHTML = `<span>${a.label}</span>`
      // position in circle
      const angle = (i / actions.length) * Math.PI * 2
      const r = 70
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      btn.style.transform = `translate(${x}px, ${y}px) scale(0.0001)`
      setTimeout(() => { btn.style.transform = `translate(${x}px, ${y}px) scale(1)` }, 20)
      btn.addEventListener('click', () => {
        const action = (btn.dataset.action as string)
        ;(window as any).gameActions?.[action]?.()
        this.closeRadial()
      })
      root.appendChild(btn)
    })

    document.body.appendChild(root)
    this.radialEl = root

    // open on right-click
    document.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.openRadial(e.clientX, e.clientY)
    })
    // close on click elsewhere
    document.addEventListener('click', (e) => {
      if ((e.target as HTMLElement).closest('.radial-menu')) return
      this.closeRadial()
    })
  }

  private openRadial(x:number, y:number) {
    if (!this.radialEl) return
    this.radialEl.style.left = `${x}px`
    this.radialEl.style.top = `${y}px`
    this.radialEl.classList.add('open')
  }

  private closeRadial() {
    if (!this.radialEl) return
    this.radialEl.classList.remove('open')
  }

  private updateUI(): void {
    const container = document.getElementById('game-ui')
    if (!container) return

    let html = '<h3>RTS Game Status</h3>'

    // Display player information (simplified for 1 player in dev)
    const resources = this.resourceManager.getResources(this.currentPlayer)
    const income = this.resourceManager.getIncome(this.currentPlayer)

    html += '<div class="player-card active">'
    html += `<div><strong>Player 1 (You)</strong></div>`
    html += `<div style="margin-top: 5px;">Resources: ${Math.floor(resources)}</div>`
    html += `<div>Income/sec: ${income.toFixed(1)}</div>`
    html += '<div class="resource-bar">'
    html += `<div class="resource-fill" style="width: ${Math.min(100, (resources / 2000) * 100)}%">${Math.floor(resources)}</div>`
    html += '</div>'
    html += '</div>'

    html += '<div class="action-buttons">'
    html += '<div style="font-size: 12px; margin-bottom: 8px;"><strong>Selected Hex Actions:</strong></div>'
    html += '<button onclick="window.gameActions?.claimHex()">1 - Claim Hex (50)</button>'
    html += '<button onclick="window.gameActions?.spawnSoldier()">2 - Spawn Soldier (100)</button>'
    html += '<button onclick="window.gameActions?.spawnArcher()">3 - Spawn Archer (100)</button>'
    html += '<button onclick="window.gameActions?.spawnScout()">4 - Spawn Scout (75)</button>'
    html += '<div style="font-size: 12px; margin-top: 10px; margin-bottom: 5px;"><strong>Buildings:</strong></div>'
    html += '<button onclick="window.gameActions?.buildBarracks()">B - Build Barracks (200)</button>'
    html += '<button onclick="window.gameActions?.buildMarket()">M - Build Market (150)</button>'
    html += '<button onclick="window.gameActions?.buildTower()">T - Build Tower (300)</button>'
    html += '</div>'

    container.innerHTML = html
  }

  public setCurrentPlayer(player: number): void {
    this.currentPlayer = player
  }
}
