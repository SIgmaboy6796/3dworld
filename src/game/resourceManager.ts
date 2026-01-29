import { HexTile } from '../world/hexagonWorld'

export class ResourceManager {
  private resources: Map<number, number> = new Map()
  private incomePerSecond: Map<number, number> = new Map()

  constructor(playerCount: number) {
    for (let i = 0; i < playerCount; i++) {
      this.resources.set(i, 1000) // Starting resources
      this.incomePerSecond.set(i, 0)
    }
  }

  public addResources(player: number, amount: number): boolean {
    const current = this.resources.get(player) || 0
    this.resources.set(player, current + amount)
    return true
  }

  public removeResources(player: number, amount: number): boolean {
    const current = this.resources.get(player) || 0
    if (current < amount) return false
    this.resources.set(player, current - amount)
    return true
  }

  public getResources(player: number): number {
    return this.resources.get(player) || 0
  }

  public addIncome(player: number, amount: number): void {
    const current = this.incomePerSecond.get(player) || 0
    this.incomePerSecond.set(player, current + amount)
  }

  public removeIncome(player: number, amount: number): void {
    const current = this.incomePerSecond.get(player) || 0
    this.incomePerSecond.set(player, Math.max(0, current - amount))
  }

  public getIncome(player: number): number {
    return this.incomePerSecond.get(player) || 0
  }

  public update(deltaTime: number): void {
    // Add income
    this.incomePerSecond.forEach((income, player) => {
      this.addResources(player, income * deltaTime)
    })
  }

  public calculateIncomeFromHexagons(ownedHexagons: HexTile[]): number {
    return ownedHexagons.reduce((total, hex) => {
      let income = hex.data.resources / 100 // Convert resources to income
      if (hex.data.terrainType === 'mountain') income *= 1.5
      if (hex.data.terrainType === 'water') income *= 0.5
      return total + income
    }, 0)
  }
}
