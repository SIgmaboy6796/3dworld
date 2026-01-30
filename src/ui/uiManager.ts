import { GameManager } from '../game/gameManager'
import { ResourceManager } from '../game/resourceManager'

export class UIManager {
  private resourceManager: ResourceManager
  private gameManager: GameManager
  private currentPlayer: number = 0
  private mainMenuEl: HTMLDivElement | null = null
  private radialEl: HTMLDivElement | null = null
  private isDark: boolean = true

  constructor(gameManager: GameManager, resourceManager: ResourceManager) {
    this.gameManager = gameManager
    this.resourceManager = resourceManager
    this.setupUI()
  }

  private setupUI(): void {
    const style = document.createElement('style')
    style.textContent = `
      /* UI container - glass panel */
      #game-ui {
        position: absolute;
        top: 20px;
        right: 20px;
        background: rgba(8,10,12,0.45);
        backdrop-filter: blur(8px) saturate(120%);
        border: 1px solid rgba(255,255,255,0.06);
        border-radius: 12px;
        padding: 12px;
        font-size: 13px;
        width: 220px;
        pointer-events: auto;
        color: var(--text);
        box-shadow: 0 8px 30px rgba(0,0,0,0.45);
      }

      .player-card { background: transparent; border-radius:8px; padding:8px }
      .player-card strong { display:block; font-size:12px }

      .resource-bar { display:none }

      /* compact counters */
      .counters { display:flex; gap:10px; }
      .counter { background: rgba(255,255,255,0.03); border-radius:10px; padding:8px; min-width:96px; text-align:center; }
      .counter .icon { font-size:16px; display:block }
      .counter .value { font-weight:700; margin-top:6px }

      /* main menu card */
      #main-menu { position: absolute; inset:0; display:flex; align-items:center; justify-content:center; background: linear-gradient(180deg, rgba(0,0,0,0.6), rgba(0,0,0,0.85)); z-index:50 }
      #main-menu .card { width:420px; padding:28px; border-radius:12px; background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); border:1px solid rgba(255,255,255,0.04); text-align:center }
      #main-menu button { width:90%; padding:12px; margin:8px auto; border-radius:10px; background:var(--accent); border:none; color:white; font-weight:600 }

      /* theme toggle */
      #theme-toggle { position:absolute; top:18px; right:18px; z-index:100; background:var(--panel); border:1px solid var(--panel-border); padding:8px 10px; border-radius:10px; cursor:pointer; box-shadow:0 6px 18px rgba(0,0,0,0.25) }

      /* radial menu - sleeker */
      .radial-menu { position:absolute; width:200px; height:200px; pointer-events:none; transform: translate(-50%,-50%) scale(0); transition: transform 220ms cubic-bezier(.2,.9,.2,1), opacity 180ms; opacity:0; z-index:60 }
      .radial-menu.open { pointer-events:auto; transform: translate(-50%,-50%) scale(1); opacity:1 }
      .radial-menu .center { position:absolute; left:50%; top:50%; transform:translate(-50%,-50%); width:64px; height:64px; border-radius:50%; background:linear-gradient(180deg,var(--accent),#2563eb); display:flex; align-items:center; justify-content:center; color:#fff; box-shadow:0 10px 30px rgba(9,10,15,0.6) }
      .radial-menu button.item { position:absolute; left:50%; top:50%; transform-origin: -50% -50%; width:52px; height:52px; border-radius:50%; border:none; background:var(--panel); color:var(--text); cursor:pointer; box-shadow:0 8px 20px rgba(0,0,0,0.35); transition: transform 260ms cubic-bezier(.2,.9,.2,1), opacity 200ms }
      .radial-menu button.item .icon { font-size:18px; display:block }
      .radial-menu button.item:hover { transform: scale(1.06) }

    `
    document.head.appendChild(style)

    const container = document.createElement('div')
    container.id = 'game-ui'
    document.body.appendChild(container)

    this.createThemeToggle()
    this.createMainMenu()
    this.createRadialMenu()

    this.createTooltip()

    this.updateUI()
    setInterval(() => this.updateUI(), 500)
  }

  private createTooltip() {
    const tip = document.createElement('div')
    tip.id = 'hex-tooltip'
    tip.style.position = 'absolute'
    tip.style.pointerEvents = 'none'
    tip.style.padding = '8px 10px'
    tip.style.background = 'rgba(0,0,0,0.75)'
    tip.style.color = '#fff'
    tip.style.borderRadius = '8px'
    tip.style.fontSize = '12px'
    tip.style.opacity = '0'
    tip.style.transition = 'opacity 120ms ease'
    tip.style.zIndex = '80'
    document.body.appendChild(tip)

    window.addEventListener('hexHover', (e: any) => {
      const detail = e.detail
      const el = document.getElementById('hex-tooltip')!
      if (detail.hex) {
        const hex = detail.hex
        el.innerHTML = `<div style="font-weight:700; margin-bottom:6px;">${hex.address.substring(0,10)}...</div><div style="font-size:12px; opacity:0.9">${hex.data.terrainType} • ${hex.data.resources} res • ${hex.data.units} units</div>`
        el.style.left = `${detail.x}px`
        el.style.top = `${detail.y - 8}px`
        el.style.opacity = '1'
      } else {
        el.style.opacity = '0'
      }
    })
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
      // Inform other systems (render/scene) about theme change
      window.dispatchEvent(new CustomEvent('themeChange', { detail: { isDark: this.isDark } }))
    })
  }

  private createMainMenu() {
    const overlay = document.createElement('div')
    overlay.id = 'main-menu'
    const card = document.createElement('div')
    card.className = 'card'
    card.innerHTML = `
      <h2>3D Hexagon RTS</h2>
      <p style="margin:10px 0 12px;">Choose play mode</p>
      <button id="single-btn" style="width:100%; padding:12px; margin-bottom:10px;">Single Player</button>
      <button id="multi-btn" style="width:100%; padding:12px; margin-bottom:10px;">Multiplayer</button>
      <hr style="margin:12px 0; opacity:0.06" />
      <div style="display:flex; gap:8px; align-items:center; justify-content:center; margin-bottom:8px;">
        <input id="player-name" placeholder="Your name" style="padding:8px; border-radius:6px; width:58%; border:1px solid rgba(255,255,255,0.04)" />
        <input id="player-color" type="color" value="#ff6666" style="width:40px; height:40px; border-radius:6px; border: none; padding:0" />
      </div>
      <div style="font-size:12px; color:var(--text); opacity:0.8; margin-top:6px;">Press ESC to toggle menu</div>
    `
    overlay.appendChild(card)
    document.body.appendChild(overlay)
    this.mainMenuEl = overlay

    document.getElementById('single-btn')!.addEventListener('click', () => this.startSinglePlayer())
    document.getElementById('multi-btn')!.addEventListener('click', () => this.startMultiplayer())

    // player settings apply
    document.getElementById('player-color')!.addEventListener('change', (e: Event) => {
      const input = e.target as HTMLInputElement
      const val = input?.value || '#ff6666'
      const hexInt = parseInt(val.replace('#', ''), 16)
      ;(this as any).gameManager.setPlayerColor(this.currentPlayer, hexInt)
    })
    document.getElementById('player-name')!.addEventListener('blur', (e: Event) => {
      const input = e.target as HTMLInputElement
      const val = input?.value || `Player ${this.currentPlayer + 1}`
      ;(this as any).gameManager.setPlayerName(this.currentPlayer, val)
    })

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

    const icons: Record<string, string> = {
      claim: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M6 3v18" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/><path d="M6 3c2.5.5 4.5 0 6 1.2 1.5 1.2 3 1 5 1.2v7c-2 .2-3.5-.2-5 1.2C10.5 14.8 8.5 14.4 6 15.2V3z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      soldier: `<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2v6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M9 10l6 6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
      archer: `<svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M3 21L21 3" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/><path d="M7 21l4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/></svg>`,
      scout: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M11 19a8 8 0 1 1 0-16 8 8 0 0 1 0 16z" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M21 21l-4.35-4.35" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>`,
      barracks: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 11l9-6 9 6" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M3 11v8h18v-8" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`,
      market: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M3 9h18v10H3z" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M3 9l2-4h14l2 4" stroke="currentColor" stroke-width="1.4" fill="none"/></svg>`,
      tower: `<svg width="20" height="20" viewBox="0 0 24 24"><path d="M8 21h8l-1-6h-6l-1 6z" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M12 3v6" stroke="currentColor" stroke-width="1.6"/></svg>`
    }

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
      btn.innerHTML = `<span class="icon" aria-hidden="true">${icons[a.id] || a.label}</span>`
      btn.setAttribute('title', a.label)
      btn.setAttribute('aria-label', a.cb)
      // position in circle
      const angle = (i / actions.length) * Math.PI * 2
      const r = 82
      const x = Math.cos(angle) * r
      const y = Math.sin(angle) * r
      btn.style.transform = `translate(${x}px, ${y}px) scale(0.0001)`
      // staggered entrance
      btn.style.transitionDelay = `${i * 26}ms`
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

    const playerInfo = (this as any).gameManager?.getPlayer ? (this as any).gameManager.getPlayer(this.currentPlayer) : { name: `Player ${this.currentPlayer + 1}`, color: 0xff6666 }

    let html = `<div style="display:flex; gap:10px; align-items:center;"><div style="width:12px; height:12px; border-radius:50%; background:${playerInfo ? '#' + (playerInfo.color.toString(16)).padStart(6, '0') : '#ff6666'}"></div><h3 style="margin-left:6px; font-size:15px">${playerInfo?.name || `Player ${this.currentPlayer + 1}`}</h3></div>`

    // Display player information (simplified for 1 player in dev)
    const resources = this.resourceManager.getResources(this.currentPlayer)
    const income = this.resourceManager.getIncome(this.currentPlayer)

    html += '<div class="player-card active">'
    html += `<div><strong>${playerInfo?.name || 'Player 1 (You)'}</strong></div>`
    html += `<div style="margin-top: 5px;">Resources: ${Math.floor(resources)}</div>`
    html += `<div>Income/sec: ${income.toFixed(1)}</div>`
    html += '</div>'

    const troops = this.gameManager.getUnitCount(this.currentPlayer)

    html += `<div class="counters" style="margin-top:12px;">
      <div class="counter"><div class="icon">💎</div><div class="value">${Math.floor(resources)}</div><div class="label" style="font-size:11px; opacity:0.8">Resources</div></div>
      <div class="counter"><div class="icon">⚔️</div><div class="value">${troops}</div><div class="label" style="font-size:11px; opacity:0.8">Troops</div></div>
    </div>`

    html += `<div style="font-size:11px; opacity:0.8; margin-top:8px;">Right-click a hex to open actions</div>`

    container.innerHTML = html
  }

  public setCurrentPlayer(player: number): void {
    this.currentPlayer = player
  }
}
