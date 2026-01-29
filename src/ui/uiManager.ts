import { GameManager } from '../game/gameManager'
import { ResourceManager } from '../game/resourceManager'

export class UIManager {
  private resourceManager: ResourceManager
  private currentPlayer: number = 0

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
        background: rgba(0, 0, 0, 0.8);
        border: 2px solid #4a9eff;
        border-radius: 8px;
        padding: 20px;
        font-size: 14px;
        width: 300px;
        pointer-events: auto;
      }

      .player-card {
        background: rgba(0, 0, 0, 0.6);
        border: 1px solid #4a9eff;
        border-radius: 5px;
        padding: 12px;
        margin-bottom: 10px;
      }

      .player-card.active {
        border-color: #ffff00;
        background: rgba(100, 100, 0, 0.3);
      }

      .resource-bar {
        background: #333;
        border: 1px solid #666;
        border-radius: 3px;
        height: 20px;
        margin-top: 5px;
        overflow: hidden;
      }

      .resource-fill {
        background: linear-gradient(90deg, #4a9eff, #00ff00);
        height: 100%;
        transition: width 0.2s;
        display: flex;
        align-items: center;
        justify-content: flex-end;
        padding-right: 5px;
        font-size: 11px;
      }

      .action-buttons {
        margin-top: 15px;
        padding-top: 15px;
        border-top: 1px solid #4a9eff;
      }

      button {
        background: #4a9eff;
        border: none;
        color: white;
        padding: 8px 12px;
        margin: 5px 0;
        border-radius: 3px;
        cursor: pointer;
        width: 100%;
        font-size: 12px;
      }

      button:hover {
        background: #2d7bcf;
      }

      button:active {
        background: #1a4a99;
      }
    `
    document.head.appendChild(style)

    const container = document.createElement('div')
    container.id = 'game-ui'
    document.body.appendChild(container)

    this.updateUI()
    setInterval(() => this.updateUI(), 500)
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
