# LocalMind

A 2D RPG adventure game built with vanilla JavaScript and HTML5 Canvas. Explore a retro-styled world with smooth animations and interactive characters.

## 🎮 Features

- **Retro 2D Graphics**: Pixel-perfect sprite-based visuals with nostalgic feel
- **Smooth Movement**: Fluid player movement with collision detection
- **Interactive World**: Engage with NPCs and explore detailed environments
- **Responsive Controls**: WASD movement with spacebar interactions
- **Animated Sprites**: Character animations for all movement directions

## 🚀 Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, Safari, Edge)
- No additional software installation required

### Running the Game

1. Clone or download this repository
2. Open `index.html` in your web browser
3. Start playing immediately!

## 🎯 Controls

| Key | Action |
|-----|--------|
| **W** | Move Up |
| **A** | Move Left |
| **S** | Move Down |
| **D** | Move Right |
| **Spacebar** | Interact with NPCs / Advance dialogue |

## 🏗️ Project Structure

```
LocalMind/
├── index.html          # Main game page with embedded styles
├── index.js            # Core game loop and player controls
├── classes.js          # Game object classes (Sprite, Boundary, Character)
├── js/
│   └── utils.js        # Utility functions (collision detection)
├── data/               # Game data definitions
├── colisiones/
│   └── collision_map.json  # Map collision boundaries
├── img/
│   ├── DptoMap.png     # Main game background
│   └── Yo/             # Player sprite assets
│       ├── playerDown.png
│       ├── playerLeft.png
│       ├── playerRight.png
│       └── playerUp.png
└── README.md           # This file
```

## 🛠️ Technical Details

### Core Architecture

- **Canvas Rendering**: Fixed 700x700 pixel canvas with 2D context
- **Collision System**: JSON-based collision map with pixel-perfect detection
- **Sprite Animation**: Directional player sprites with smooth transitions
- **Game Loop**: RequestAnimationFrame-based rendering loop

### Key Classes

- **Sprite**: Base rendering class with animation frame support
- **Boundary**: Collision detection rectangles for map boundaries  
- **Character**: NPCs with dialogue systems

### Dependencies

- [GSAP 3.9.1](https://greensock.com/gsap/) - Animation library (loaded via CDN)
- [Google Fonts](https://fonts.google.com/) - Press Start 2P font for retro styling

## 🎨 Game Design

- **Art Style**: Retro pixel art aesthetic with 8-bit inspired graphics
- **Typography**: Press Start 2P font for authentic retro gaming feel
- **Color Scheme**: Classic gaming palette with high contrast
- **Map Design**: Tile-based world with detailed collision boundaries

## 🔧 Development

### File Organization

- Game logic is separated into modular JavaScript files
- Sprite assets are organized by character/object type
- Collision data is stored as JSON for easy editing
- Styles are embedded in HTML for simplicity

### Code Structure

- Object-oriented design with ES6 classes
- Functional utilities for collision detection
- Event-driven input handling
- Smooth animation integration with GSAP

## 📝 License

This project is open source. Feel free to use and modify as needed.

## 🤝 Contributing

Contributions are welcome! Feel free to submit issues and enhancement requests.

---

*Built with ❤️ using vanilla JavaScript and HTML5 Canvas*