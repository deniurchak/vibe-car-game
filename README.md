# Witcher Game

A browser-based 3D Witcher game built with Next.js, TypeScript, and Three.js. This project features:

- 3rd person view for the witcher character
- WASD movement controls
- Combat mechanics (attack with left click, block with right click)
- Enemy AI with different behaviors (aggressive wolves/bears, fleeing deer)
- Health system with visual health bars
- Score tracking
- Immersive 3D environment

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Game Controls

- **W, A, S, D**: Move the character
- **Left Mouse Button**: Attack with sword
- **Right Mouse Button**: Block incoming attacks

## Game Mechanics

- Enemies have different behaviors:
  - Wolves and bears will chase and attack you
  - Deer will flee when you get close
- Your health is displayed at the top of the screen
- Blocking reduces damage taken
- Score increases when you kill enemies

## Technologies Used

- Next.js
- TypeScript
- Three.js
- React Three Fiber
- Tailwind CSS

## Future Enhancements

- Add more detailed character/enemy models
- Implement additional combat moves
- Add sound effects and music
- Implement different zones/levels
- Add inventory system

## License

This project is MIT licensed.
