export interface GameState {
  isGameActive: boolean;
  playerHealth: number;
  score: number;
}

export interface Character {
  id: string;
  position: [number, number, number];
  rotation: [number, number, number];
  health: number;
  maxHealth: number;
  isAttacking: boolean;
  isBlocking: boolean;
  isDead: boolean;
}

export interface Player extends Character {
  moveSpeed: number;
  attackPower: number;
  isMoving: boolean;
  direction: [number, number, number];
}

export interface Enemy extends Character {
  type: "wolf" | "bear" | "deer";
  detectionRadius: number;
  attackRadius: number;
  attackPower: number;
  aggroState: "idle" | "chase" | "attack" | "flee";
}

export type GameControls = {
  moveForward: boolean;
  moveBackward: boolean;
  moveLeft: boolean;
  moveRight: boolean;
  attack: boolean;
  block: boolean;
};
