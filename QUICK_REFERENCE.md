# Quick Reference

## Game Controls

| Action | Control |
|--------|---------|
| Rotate camera | Click + Drag mouse |
| Zoom in/out | Scroll wheel |
| Select hexagon | Left click |
| Reset camera | R key |
| Switch player | P key |

## Action Buttons (Right Panel)

| Button | Key | Cost | Effect |
|--------|-----|------|--------|
| Claim Hex | 1 | 50 | Claim selected hexagon |
| Spawn Soldier | 2 | 100 | Create soldier unit |
| Spawn Archer | 3 | 100 | Create archer unit |
| Spawn Scout | 4 | 75 | Create scout unit |
| Build Barracks | B | 200 | Military building |
| Build Market | M | 150 | Trading building |
| Build Tower | T | 300 | Defense structure |

## Unit Stats

| Unit | Health | Cost | Speed | Range |
|------|--------|------|-------|-------|
| Soldier | 20 | 100 | Normal | Melee |
| Archer | 15 | 100 | Normal | Ranged |
| Scout | 10 | 75 | Fast | Melee |

## Resource Generation

| Terrain | Multiplier | Base Income |
|---------|-----------|-------------|
| Mountain | 1.5x | High |
| Land | 1.0x | Medium |
| Water | 0.5x | Low |

## File Locations

| Component | File |
|-----------|------|
| Main app | `src/main.ts` |
| Hex grid | `src/world/hexagonWorld.ts` |
| Game logic | `src/game/gameManager.ts` |
| Units | `src/game/gameManager.ts` |
| Buildings | `src/game/buildingManager.ts` |
| Resources | `src/game/resourceManager.ts` |
| Input/Camera | `src/input/inputManager.ts` |
| UI | `src/ui/uiManager.ts` |
| HTML | `index.html` |
| Config | `vite.config.ts` |

## Common Code Patterns

### Accessing Selected Hex
```typescript
const selected = gameManager.getSelectedHexagon()
if (selected) {
  console.log(`Hex owner: ${selected.data.owner}`)
}
```

### Checking Resources
```typescript
const resources = resourceManager.getResources(playerId)
if (resources >= cost) {
  resourceManager.removeResources(playerId, cost)
}
```

### Creating a New Unit Type
```typescript
// 1. Add to type
type: 'soldier' | 'archer' | 'scout' | 'newType'

// 2. Add cost
costs['newType'] = 150

// 3. Call spawn
gameManager.spawnUnit('newType')
```

### Modifying Hexagon Properties
```typescript
const hex = gameManager.getSelectedHexagon()
hex.data.owner = 0  // Set owner
hex.data.units += 1  // Add units
hex.data.resources -= 50  // Use resources
```

## Useful Console Commands

```javascript
// Get selected hex
gameManager.getSelectedHexagon()

// Get all hexagons
hexagonWorld.getHexagons()

// Get current player
gameManager.getCurrentPlayer()

// Check FPS
// Look at top-left corner of screen

// Trigger actions
window.gameActions.claimHex()
window.gameActions.spawnSoldier()
window.gameActions.buildBarracks()
```

## Development Commands

```bash
npm install      # Install dependencies
npm run dev      # Start dev server
npm run build    # Build for production
npm test         # Run tests (when added)
```

## Camera Positioning

Default position: `(0, 40, 50)`
- X: Left/right
- Y: Up/down
- Z: Forward/backward

To modify default position, edit `main.ts`:
```typescript
camera.position.set(x, y, z)
```

## Performance Tips

- Reduce world radius for slower machines: `new HexagonWorld(scene, 3)`
- Move camera further for better overview
- Close UI panels for clearer view
- Use Firefox/Chrome for best performance

## Keyboard Shortcuts (Future)

```
R - Reset camera
P - Switch player
D - Debug mode (future)
M - Show minimap (future)
```

## Resources (External Links)

- **Three.js**: https://threejs.org/
- **H3**: https://h3geo.org/
- **Vite**: https://vitejs.dev/
- **TypeScript**: https://www.typescriptlang.org/

## Project Statistics

- **Total Files**: 10+
- **Lines of Code**: ~1000+
- **Main Classes**: 6 (GameManager, HexagonWorld, BuildingManager, ResourceManager, InputManager, UIManager)
- **Unit Types**: 3 (Soldier, Archer, Scout)
- **Building Types**: 3 (Barracks, Market, Tower)
- **Terrain Types**: 3 (Land, Water, Mountain)

## Browser Compatibility

- Chrome/Chromium: ✓ Recommended
- Firefox: ✓ Good
- Safari: ✓ Supported
- Edge: ✓ Supported

**Minimum Requirements:**
- WebGL support
- ES2020+ JavaScript
- 2GB RAM
- Modern GPU

## Troubleshooting Quick Links

| Issue | Solution |
|-------|----------|
| Game won't start | Check browser console for errors |
| Hexagons not visible | Rotate camera or reset with R |
| Can't select hexagons | Click directly on hex surface |
| Slow performance | Reduce radius or move camera back |
| Resources not updating | Wait for UI update (0.5s) |

## Next Steps

1. **Clone/Fork** the repository
2. **Read** GETTING_STARTED.md for gameplay
3. **Explore** src/ folder structure
4. **Modify** gameManager.ts to add features
5. **Test** changes with `npm run dev`
6. **Build** with `npm run build`

## Getting Help

- **Errors**: Check browser DevTools Console
- **Architecture**: Read ARCHITECTURE.md
- **Development**: Read DEVELOPMENT.md
- **Gameplay**: Read GETTING_STARTED.md
