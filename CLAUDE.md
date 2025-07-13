# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a browser-based 2D RPG game built with vanilla JavaScript and HTML5 Canvas. The game features:

- An overworld map with player movement and NPC interactions
- Sprite-based graphics and animations
- Smooth transitions using GSAP animations

## Architecture

### Core Game Loop

- `index.js` - Main game loop, player movement, and collision detection
- `classes.js` - Core game classes (Sprite, Boundary, Character)

### Game Systems

- **Sprite System**: Base class for all visual game objects with animation support
- **Collision System**: Boundary-based collision detection for movement and interactions
- **Character Interaction**: NPC dialogue system with spacebar activation

### Data Architecture

- `data/` directory contains all game data as JavaScript objects:
  - `collisions.js` - Map collision boundaries
  - `characters.js` - NPC placement data

### Key Classes

- **Sprite**: Base rendering class with animation frame support
- **Boundary**: Collision detection rectangles for map boundaries
- **Character**: NPCs with dialogue systems

## Running the Game

The game runs directly in a web browser. Open `index.html` in any modern browser.

**Controls:**

- WASD - Player movement
- Spacebar - Interact with NPCs / Advance dialogue

## File Structure

- `index.html` - Main game page with embedded styles and UI elements
- `index.js` - Core game loop and player controls
- `classes.js` - Game object classes
- `js/utils.js` - Utility functions (collision detection)
- `data/` - Game data definitions
- `img/` - Sprite assets and backgrounds

## Dependencies

External libraries loaded via CDN:

- GSAP 3.9.1 - Animation library

## Development Notes

- Canvas size is fixed at 350x350 pixels
- Game uses tile-based collision system with 96x96 pixel boundaries
- Map data is stored as 1D arrays converted to 2D grids (70 tiles wide)
- Transitions use GSAP with fade effects
