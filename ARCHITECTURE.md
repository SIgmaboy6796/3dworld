# Architecture & Technical Details

## System Design

### Modular Architecture
The game is built with clear separation of concerns:

```
Input Layer (InputManager)
    ↓
Game Logic Layer (GameManager, ResourceManager, BuildingManager)
    ↓
World Layer (HexagonWorld - H3 Grid)
    ↓
Rendering Layer (Three.js Scene)
    ↓
UI Layer (UIManager)
```

## Core Components

### 1. HexagonWorld (`src/world/hexagonWorld.ts`)
Manages the hexagonal grid using the H3 system.

**Key Features:**
- Generates hexagon grid on sphere surface
- Stores hex properties (terrain, owner, resources)
- Provides neighbor calculation
- Handles visual selection

**Key Methods:**
```typescript
generateHexagonGrid()      // Creates all hexagons
latLngToSpherePosition()   // Converts coordinates to 3D
getHexagonAtRay()          // Raycast selection
selectHexagon()            // Visual selection
getNeighboringHexagons()   // Get adjacent hexes
```

### 2. GameManager (`src/game/gameManager.ts`)
Central game logic hub.

**Responsibilities:**
- Unit spawning
- Hexagon claiming
- Building placement
- Player management
- Game state

**Game Actions:**
```typescript
selectHexagon()     // Select hex for interaction
claimHexagon()      // Claim hex (costs resources)
spawnUnit()         // Create unit (costs resources)
buildBuilding()     // Place building (costs resources)
```

### 3. ResourceManager (`src/game/resourceManager.ts`)
Handles resource economy.

**Features:**
- Resource tracking per player
- Income calculation
- Resource generation from hexagons
- Transaction validation

**Terrain Multipliers:**
- Mountain: 1.5x income
- Land: 1.0x income
- Water: 0.5x income

### 4. BuildingManager (`src/game/buildingManager.ts`)
Manages building creation and lifecycle.

**Building Types:**
```typescript
type: 'barracks'  // Military training (200 resources)
type: 'market'    // Trade income (150 resources)
type: 'tower'     // Defense structure (300 resources)
```

### 5. InputManager (`src/input/inputManager.ts`)
Handles all user interactions.

**Controls:**
- Mouse rotation: Spherical coordinates
- Zoom: Distance scaling
- Selection: Raycasting
- Keyboard shortcuts

**Key Methods:**
```typescript
rotateCamera()      // Spherical camera rotation
onMouseWheel()      // Zoom in/out
onMouseClick()      // Hex selection
onKeyDown()         // Keyboard actions
```

### 6. UIManager (`src/ui/uiManager.ts`)
Renders game UI and player information.

**Elements:**
- Resource display
- Action buttons
- Current player indicator
- Hex info panel

## H3 System Integration

The H3 system provides:
- **Hierarchical indexing** of hexagons
- **Distance metrics** between hexagons
- **Neighbor relationships** (6 neighbors per hex)
- **Consistent coordinates** across zoom levels

### Key H3 Functions Used:
```typescript
h3.latLngToCell()      // Convert lat/lng to H3 index
h3.cellToLatLng()      // Convert H3 index to lat/lng
h3.gridDisk()          // Get hexagons in radius
h3.gridDistance()      // Distance between hexagons
```

## Rendering Pipeline

### Three.js Setup:
1. **Scene**: World container
2. **Camera**: Perspective camera with spherical controls
3. **Renderer**: WebGL with antialiasing
4. **Lighting**: Ambient + Directional
5. **Meshes**: 
   - Hexagon cylinders (terrain)
   - Unit spheres (units)
   - Building boxes/cones (structures)

### Material Approach:
- **Phong Material** for realistic lighting
- **Color encoding** for ownership
- **Emissive highlighting** for selection
- **Edge geometry** for hexagon outlines

## Data Flow

### Claiming a Hexagon:
```
User Click
  ↓
InputManager.onMouseClick()
  ↓
GameManager.selectHexagon()
  ↓
User Presses "1" / Clicks Button
  ↓
GameManager.claimHexagon()
  ↓
ResourceManager.removeResources()
  ↓
Update HexTile.owner
  ↓
Update mesh color
  ↓
UIManager updates display
```

### Spawning a Unit:
```
User Presses "2" / Clicks Button
  ↓
GameManager.spawnUnit('soldier')
  ↓
ResourceManager.removeResources(100)
  ↓
Create Unit object
  ↓
Create visual mesh
  ↓
Add to scene
  ↓
Update hex.units++
```

## Performance Considerations

### Optimization Strategies:
1. **Mesh Reuse**: Hexagon geometry shared across instances
2. **Material Pooling**: Reuse materials where possible
3. **Efficient Raycasting**: Only test hexagon meshes
4. **Update Throttling**: UI updates on 500ms interval
5. **LOD Potential**: Could add level-of-detail for distant hexes

### Current Bottlenecks:
- Number of meshes (each hex = 1 mesh + 1 line mesh)
- Full scene update every frame
- No spatial partitioning for queries

### Future Optimizations:
- Combine hex meshes into single buffered geometry
- Implement spatial indexing (quadtree)
- Use frustum culling
- Batch rendering of similar objects

## Extension Points

### Adding New Unit Types:
1. Define in `Unit` interface
2. Add spawn method call
3. Define mesh creation
4. Set cost and stats

### Adding New Buildings:
1. Add case in `BuildingManager.createBuilding()`
2. Define geometry and color
3. Set cost and effects
4. Add UI button

### Adding Game Features:
1. **Combat System**: Add to `GameManager.update()`
2. **Unit Movement**: Modify `Unit` interface and movement logic
3. **Tech Tree**: Create new `TechManager` class
4. **Fog of War**: Add visibility layer in HexagonWorld
5. **Minimap**: Create canvas-based map in UIManager

## Testing

### To test locally:
```bash
npm run dev          # Start dev server
# Navigate to http://localhost:5173
# Test each action button
# Monitor console for errors
```

### To build for production:
```bash
npm run build        # Creates dist/ folder
npm run preview      # Test build locally
```

## File Structure Best Practices

```
src/
├── main.ts              # Only initialization
├── world/               # World-related systems
├── game/                # Game mechanics
├── input/               # Input handling
├── ui/                  # User interface
├── types/               # Type definitions (could be added)
└── utils/               # Utility functions (could be added)
```

Each system is self-contained and communicates through public methods on the GameManager.
