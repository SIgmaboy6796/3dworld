# Getting Started with 3DWorld RTS

## What is 3DWorld RTS?

A real-time strategy game built on a spherical hexagon grid using the H3 system. Similar to openfront.io but with a 3D perspective.

## Key Systems

### 1. Hexagon Grid (H3 System)
- The world is made up of hexagons generated using the H3 library
- Each hexagon has a specific address, terrain type, and owner
- Terrain types affect resource generation (Mountains > Land > Water)

### 2. Units
Three types of units can be spawned:
- **Soldier** (20 HP, 100 resources) - Standard unit
- **Archer** (15 HP, 100 resources) - Ranged unit
- **Scout** (10 HP, 75 resources) - Fast reconnaissance

### 3. Buildings
Strategic structures that boost gameplay:
- **Barracks** (200 resources) - Trains units
- **Market** (150 resources) - Generates trade income
- **Tower** (300 resources) - Defensive structure

### 4. Resource Management
- Start with 1000 resources
- Claim hexagons to generate income
- Mountain hexes generate 50% more resources
- Water hexes generate 50% less

## How to Play

### Camera Controls
1. **Rotate**: Click and drag with mouse
2. **Zoom**: Mouse wheel up/down
3. **Reset**: Press `R`

### Selecting Hexagons
- Click on any hexagon to select it
- Selected hex is highlighted in blue
- Info panel shows hex details

### Taking Actions
Click the buttons in the Game UI panel (top right):

**Claiming Hexagons**
- Click "1 - Claim Hex (50)" to claim a hexagon
- Costs 50 resources per claim
- Claimed hexagons generate income

**Spawning Units**
- "2 - Spawn Soldier (100)" - Standard combat unit
- "3 - Spawn Archer (100)" - Ranged attacker
- "4 - Spawn Scout (75)" - Fast unit

**Building Structures**
- "B - Build Barracks (200)" - Military building
- "M - Build Market (150)" - Trading outpost
- "T - Build Tower (300)" - Defense structure

## Strategy Tips

1. **Early Game**: Claim hexagons near you to generate income
2. **Mountain Advantage**: Claim mountainous terrain for better income
3. **Unit Composition**: Mix soldiers, archers, and scouts for balanced army
4. **Defense**: Build towers on strategic hexagons
5. **Expansion**: Claim neighboring hexagons for territory control

## Game Architecture

```
3dworld/
├── src/
│   ├── main.ts                 # Entry point
│   ├── world/
│   │   └── hexagonWorld.ts    # H3 grid system
│   ├── game/
│   │   ├── gameManager.ts     # Core game logic
│   │   ├── buildingManager.ts # Building system
│   │   └── resourceManager.ts # Resource system
│   ├── input/
│   │   └── inputManager.ts    # Input/camera controls
│   └── ui/
│       └── uiManager.ts       # UI rendering
├── index.html
├── vite.config.ts
├── tsconfig.json
└── package.json
```

## Development Notes

### Adding New Unit Types
1. Add to `Unit` interface in `gameManager.ts`
2. Update `spawnUnit()` method
3. Add costs to `costs` object

### Adding New Building Types
1. Add case to `createBuilding()` in `buildingManager.ts`
2. Update UI buttons in `uiManager.ts`
3. Add costs to building costs object

### Customizing the World
In `main.ts`, change the `HexagonWorld` initialization:
```typescript
// Larger radius = more hexagons = slower performance
const hexagonWorld = new HexagonWorld(scene, 5) // radius: 5
```

## Future Features

- [ ] Multiplayer networking
- [ ] Unit pathfinding
- [ ] Combat system
- [ ] Tech tree
- [ ] Fog of war
- [ ] Minimap
- [ ] Sound effects
- [ ] Multiple camera modes

## Performance Notes

- Each hexagon is a 3D mesh, so larger grids impact performance
- Recommended radius: 3-5 on most machines
- Close camera for better selection accuracy
- Mouse rotation works on any mouse button (right or left)

## Troubleshooting

**Game runs slowly:**
- Reduce world radius in `main.ts`
- Move camera further away

**Can't select hexagons:**
- Ensure you're clicking directly on hexagon surfaces
- Try rotating camera for better angle

**Resources not updating:**
- Resources update every half second
- Check the Resource bar in UI

## Credits

Built with:
- Three.js (3D rendering)
- H3-js (hexagonal grids)
- Vite (build tool)
- TypeScript (type safety)
