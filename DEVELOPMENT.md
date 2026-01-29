# Development Guide

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
3dworld/
├── src/
│   ├── main.ts                    # Application entry point
│   ├── world/
│   │   └── hexagonWorld.ts       # H3 hexagon grid and rendering
│   ├── game/
│   │   ├── gameManager.ts        # Core game logic and state
│   │   ├── buildingManager.ts    # Building creation and management
│   │   └── resourceManager.ts    # Economy and resource tracking
│   ├── input/
│   │   └── inputManager.ts       # Input handling and camera controls
│   └── ui/
│       └── uiManager.ts          # UI rendering and player interface
├── index.html                     # HTML entry point
├── vite.config.ts                # Vite configuration
├── tsconfig.json                 # TypeScript configuration
├── package.json                  # Dependencies and scripts
├── README.md                      # Project overview
├── GETTING_STARTED.md            # Player guide
└── ARCHITECTURE.md               # Technical documentation
```

## Adding Features

### 1. New Unit Type

**Step 1:** Update the `Unit` type in `src/game/gameManager.ts`:
```typescript
export interface Unit {
  id: string
  owner: number
  position: THREE.Vector3
  type: 'soldier' | 'archer' | 'scout' | 'heavy' // Add 'heavy'
  health: number
  maxHealth: number
  mesh?: THREE.Mesh
}
```

**Step 2:** Add spawning logic in `GameManager.spawnUnit()`:
```typescript
public spawnUnit(type: 'soldier' | 'archer' | 'scout' | 'heavy'): void {
  const costs: { [key: string]: number } = {
    soldier: 100,
    archer: 100,
    scout: 75,
    heavy: 250  // Add cost
  }
  // ... rest of method
}
```

**Step 3:** Add UI button in `src/ui/uiManager.ts`:
```typescript
html += '<button onclick="window.gameActions?.spawnHeavy()">5 - Spawn Heavy (250)</button>'
```

**Step 4:** Add action to `setupGameActions()` in `GameManager`:
```typescript
spawnHeavy: () => this.spawnUnit('heavy')
```

### 2. New Building Type

**Step 1:** Update `BuildingManager.createBuilding()` in `src/game/buildingManager.ts`:
```typescript
switch (type) {
  case 'barracks':
    geometry = new THREE.BoxGeometry(1, 2, 1)
    color = 0xff6b6b
    break
  case 'tower':
    geometry = new THREE.ConeGeometry(0.8, 3, 8)
    color = 0x6bcf7f
    break
  case 'wall':  // New building type
    geometry = new THREE.BoxGeometry(3, 1, 0.5)
    color = 0x808080
    break
  // ...
}
```

**Step 2:** Update building type in interface:
```typescript
type: 'barracks' | 'market' | 'tower' | 'wall'
```

**Step 3:** Add UI and costs in GameManager:
```typescript
const costs: { [key: string]: number } = {
  barracks: 200,
  market: 150,
  tower: 300,
  wall: 100  // Add cost
}
```

### 3. New Game Mechanic

**Option A: Add to existing manager**
```typescript
// In GameManager.ts
public upgradeUnit(unitId: string): void {
  const unit = this.units.find(u => u.id === unitId)
  if (!unit) return
  
  if (!this.resourceManager.removeResources(this.currentPlayer, 50)) {
    console.log('Not enough resources')
    return
  }
  
  unit.health = unit.maxHealth
  unit.maxHealth += 5
  // ... update visual
}
```

**Option B: Create new manager class**
```typescript
// src/game/combatManager.ts
export class CombatManager {
  constructor(private hexagonWorld: HexagonWorld) {}
  
  public resolveAttack(attacker: Unit, defender: Unit): void {
    // Combat logic
  }
}

// Then import and use in GameManager
```

## Code Style & Standards

### TypeScript Best Practices
```typescript
// ✓ Good: Type everything
public selectHexagon(hex: HexTile): void { }

// ✗ Bad: Avoid 'any'
public selectHexagon(hex: any): void { }

// ✓ Good: Use interfaces for complex types
interface GameState {
  currentPlayer: number
  selectedHex: HexTile | null
}

// ✓ Good: Use const for non-mutable values
const MAX_HEALTH = 100
```

### Naming Conventions
```typescript
// Classes: PascalCase
class GameManager { }

// Functions/methods: camelCase
public updateGame() { }

// Constants: UPPER_SNAKE_CASE
const MAX_RESOURCES = 1000

// Private members: leading underscore (optional)
private _selectedHexagon: HexTile
```

### File Organization
- One class per file
- Related interfaces in same file as class
- Imports at top, organized by source
- Exports at bottom

## Debugging

### Browser DevTools
1. Open DevTools (F12)
2. Console tab shows game logs
3. Performance tab for profiling
4. Elements tab for DOM inspection

### Common Issues

**Hexagons not showing:**
- Check Three.js scene is rendering
- Verify camera position: `camera.position`
- Check material colors aren't black on black

**Selection not working:**
- Test raycaster with `console.log(raycaster.intersectObjects())`
- Verify mouse coordinates calculation
- Check if mesh is in scene

**Performance issues:**
- Reduce world radius: `new HexagonWorld(scene, 3)`
- Monitor frame rate in UI (FPS counter)
- Check Draw Calls in DevTools > Performance

### Useful Console Commands
```javascript
// Get current game state
window.gameState

// Access game managers
window.gameActions

// Log selected hex
console.log(gameManager.getSelectedHexagon())

// Check performance
console.time('operation')
// ... code to test
console.timeEnd('operation')
```

## Performance Tips

### What slows things down:
- Too many meshes (each hex + outline)
- Complex geometries
- Large textures
- Too many lights
- Full scene updates

### Optimization ideas:
1. **Combine meshes** into single BufferGeometry
2. **Use material instances** instead of per-mesh materials
3. **Implement frustum culling** to skip off-screen meshes
4. **Use lower-poly geometries** for distant objects
5. **Batch operations** in update loop

### Profiling:
```javascript
// In main.ts
const stats = new Stats()
document.body.appendChild(stats.dom)

// In animate loop
stats.begin()
// ... rendering code
stats.end()
```

(Note: Would need `stats.js` library)

## Testing

### Manual Testing Checklist
- [ ] Hexagons render correctly
- [ ] Camera rotates smoothly
- [ ] Zoom works in both directions
- [ ] Click selects hexagon
- [ ] Claim hex reduces resources
- [ ] Spawn unit works
- [ ] Building placement works
- [ ] UI updates correctly
- [ ] No console errors

### Future: Automated Testing
```bash
# Would add Jest/Vitest
npm test

# With coverage
npm test -- --coverage
```

## Building for Production

```bash
# Build minified version
npm run build

# Files created in dist/
# dist/index.html
# dist/assets/

# Preview the build
npm run preview
```

### Deployment Options:
1. **Vercel** - `vercel --prod`
2. **Netlify** - Connect GitHub, auto-deploy
3. **GitHub Pages** - Use gh-pages branch
4. **Traditional host** - Upload dist/ folder

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/new-unit-type

# Make changes, test, commit
git add .
git commit -m "feat: add heavy unit type"

# Push to GitHub
git push origin feature/new-unit-type

# Create Pull Request on GitHub
# Merge when ready

# Delete branch
git branch -d feature/new-unit-type
```

## Resources

- **Three.js Docs**: https://threejs.org/docs/
- **H3 Documentation**: https://h3geo.org/documentation/
- **TypeScript Handbook**: https://www.typescriptlang.org/docs/
- **Vite Guide**: https://vitejs.dev/guide/

## Common Commands

```bash
npm install                # Install dependencies
npm run dev               # Start dev server (hot reload)
npm run build             # Create production build
npm run type-check        # Check TypeScript errors
npm run preview           # Preview production build

# Useful git commands
git status               # See changes
git diff                 # See specific changes
git log                  # See history
```

## Getting Help

If you encounter issues:
1. Check browser console for errors
2. Review relevant TypeScript files
3. Check Three.js/H3 documentation
4. Test with simpler code first
5. Check git history for recent changes

## Contributing

When making changes:
1. Follow code style guidelines
2. Test before committing
3. Write clear commit messages
4. Keep changes focused
5. Update documentation if needed
