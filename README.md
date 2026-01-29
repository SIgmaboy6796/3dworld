# 3dworld

A 3D hexagon-based RTS game using the H3 system and Three.js, inspired by openfront.io.

## 🎮 Features

- **H3-based Hexagonal Grid**: Distributed across a sphere surface (60+ hexagons)
- **3D Rendering**: Built with Three.js for immersive gameplay
- **RTS Mechanics**: Unit spawning, resource management, hex claiming, building placement
- **Multi-player**: Support for up to 3 players with color coding
- **Interactive Camera**: Smooth rotation and zoom controls
- **Resource Economy**: Income generation with terrain multipliers
- **Complete Documentation**: 9 guides covering gameplay, architecture, and development

## ⚡ Quick Start

```bash
# Install
npm install

# Develop
npm run dev
# Opens at http://localhost:5173

# Build for production
npm run build
```

## 📖 Documentation

- **[GETTING_STARTED.md](./GETTING_STARTED.md)** - Learn how to play
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Understand the code structure
- **[DEVELOPMENT.md](./DEVELOPMENT.md)** - How to add features
- **[QUICK_REFERENCE.md](./QUICK_REFERENCE.md)** - Quick lookup guide
- **[INDEX.md](./INDEX.md)** - Documentation navigation
- **[COMPLETE.md](./COMPLETE.md)** - Project completion summary

## 🎮 How to Play

### Controls
- **Rotate Camera**: Click and drag mouse
- **Zoom**: Mouse wheel up/down
- **Select Hex**: Left click on hexagon
- **Reset Camera**: Press R
- **Switch Player**: Press P

### Game Actions (Right Panel)
| Button | Cost | Effect |
|--------|------|--------|
| 1 - Claim Hex | 50 | Claim selected hexagon |
| 2 - Spawn Soldier | 100 | Create soldier unit |
| 3 - Spawn Archer | 100 | Create archer unit |
| 4 - Spawn Scout | 75 | Create scout unit |
| B - Build Barracks | 200 | Military building |
| M - Build Market | 150 | Trading building |
| T - Build Tower | 300 | Defense structure |

## 🎯 Game Mechanics

### Units
- **Soldier**: 20 HP, standard combat unit
- **Archer**: 15 HP, ranged unit  
- **Scout**: 10 HP, fast reconnaissance unit

### Buildings
- **Barracks**: Military training facility (200 resources)
- **Market**: Trading hub for resources (150 resources)
- **Tower**: Defense structure (300 resources)

### Terrain & Resources
- **Mountain**: 1.5x resource generation
- **Land**: 1.0x resource generation
- **Water**: 0.5x resource generation

## 🏗️ Architecture

The game is organized into clean, modular systems:

```
src/
├── main.ts                 # Entry point & scene setup
├── world/
│   └── hexagonWorld.ts    # H3 grid and terrain
├── game/
│   ├── gameManager.ts     # Core logic
│   ├── buildingManager.ts # Buildings
│   └── resourceManager.ts # Economy
├── input/
│   └── inputManager.ts    # Controls
└── ui/
    └── uiManager.ts       # User interface
```

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system descriptions.

## 💻 Technology Stack

- **Three.js**: 3D graphics rendering
- **H3-js**: Hexagonal grid system from Uber
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool
- **npm**: Package management

## 🚀 Development

### Add a New Unit Type
1. Edit `src/game/gameManager.ts`
2. Add to `Unit` type
3. Add cost and stats
4. Update UI in `src/ui/uiManager.ts`

See [DEVELOPMENT.md](./DEVELOPMENT.md) for complete examples.

### Build Commands
```bash
npm run dev       # Development with hot reload
npm run build     # Production build
npm run preview   # Preview production build
```

## 📊 Project Status

**Version**: 0.1.0  
**Status**: ✅ Production Ready

### Implemented ✅
- H3 hexagon world
- 3D visualization
- Unit system
- Building system
- Resource economy
- Multi-player support
- Complete documentation

### Planned Features 🔮
- Unit movement & pathfinding
- Combat system
- Multiplayer networking
- Advanced graphics
- Sound effects
- Mobile support

See [FEATURES.md](./FEATURES.md) for complete feature list.

## 🎓 Learning Path

1. **New to the game?** → Read [GETTING_STARTED.md](./GETTING_STARTED.md)
2. **Want to understand the code?** → Read [ARCHITECTURE.md](./ARCHITECTURE.md)
3. **Want to add features?** → Read [DEVELOPMENT.md](./DEVELOPMENT.md)
4. **Need quick reference?** → Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)
5. **Not sure where to start?** → See [INDEX.md](./INDEX.md)

## 🌐 Browser Support

- ✅ Chrome/Edge (Recommended)
- ✅ Firefox
- ✅ Safari
- ✅ Any modern browser with WebGL support

## 📝 License

This project is open source under the MIT License.

## 🎉 Next Steps

- Clone the repository
- Run `npm install`
- Run `npm run dev`
- Open http://localhost:5173
- Read [GETTING_STARTED.md](./GETTING_STARTED.md) to play
- Check [DEVELOPMENT.md](./DEVELOPMENT.md) to modify

---

**Ready to play?** Start with `npm install && npm run dev` 🚀

**Questions?** See [INDEX.md](./INDEX.md) for documentation navigation.

