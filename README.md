# 🎧 Audio Maze Adventure: Accessible Game Design for Blind Students

**Audio Maze Adventure** is an accessibility-first game designed to be fully playable by blind and visually impaired students. The player navigates a procedurally generated maze, collecting essential items like keys, weapons, and health potions, while avoiding or defeating monsters to unlock and reach the exit. Every interaction provides immediate **audio feedback**, allowing players to fully engage with the environment without visual input.

---

## 🧩 Key Design Principles

The project follows universal design principles and accessibility standards, enhancing inclusivity and usability for all players. It is built upon three core accessibility pillars:

- **Perceivable**: All game data is conveyed using audio via text-to-speech narration.
- **Operable**: Full keyboard and mouse support—no reliance on quick reflexes or complex gestures.
- **Understandable**: Clear, consistent responses to user actions, with a predictable interface.

---

## 🔊 Technical Implementation & Audio Systems

### 🗣️ Web Speech API Integration

Using the browser-native `speechSynthesis` interface (Web Speech API), the game provides real-time voice feedback without needing external libraries:

- Instant audio response for every action
- Configurable rate, pitch, and volume
- Priority message queuing to handle multiple simultaneous events
- Tested for compatibility with popular screen readers and browsers

---

## 🧭 Maze Generation & Navigation

The maze uses a **depth-first search** algorithm with recursive backtracking to ensure each maze has a unique and solvable layout.

Key Features:
- Grid-based collision and movement control
- Spatial awareness through adjacent cell checks
- Dynamic item spawning and balanced challenge scaling
- Reachable item placement via pathfinding

---

## 🕹️ User Interface & Interaction Design

### 🎮 Multi-Modal Controls

- **Keyboard**:
  - Arrow keys or WASD for movement
  - `I` for inventory, `H` for health, `L` for location, `R` to repeat the last message
- **Mouse**:
  - **Left-click** anywhere to start/restart the game
  - **Right-click** anywhere to stop/exit the game

### 🧑‍🦯 Emoji-Enhanced Accessibility

Emoji icons are used to enhance screen reader compatibility and improve symbolic recognition:

- 🔑 Key — unlocks exits  
- 👾 Monster — enemy threat  
- ⚔️ Sword / 🛡️ Shield — combat gear  
- 🧪 Potion — health recovery  
- 🚪 Door — exit point

These emojis serve both visually impaired and partially sighted users by offering audio-compatible and recognizable visual cues.

---

## 🛡️ Game Mechanics & Player Experience

### ⚔️ Combat & Survival

- Turn-based combat guided by distinct audio signatures
- Weapon effectiveness based on inventory
- Shield-based defense mechanics
- Health system with voice alerts for low status
- Resource and inventory management for strategic decisions

### 🔉 Spatial Audio & Environment Feedback

- Audio cues indicate direction: “Monster to your north”
- Volume scaling to reflect proximity of threats
- Environmental sound cues (walls, doors, paths, items)
- Location awareness through coordinate-based reporting

---

## 🎮 Live Demo

[Click here to play the game](https://audio-maze-adventure.vercel.app/)


---

## 📌 Note

This project emphasizes inclusivity and accessibility in game development. By combining **audio-driven gameplay**, **emoji-enhanced interfaces**, and **non-visual control schemes**, it serves as a model for engaging and empowering blind students through interactive experiences.

