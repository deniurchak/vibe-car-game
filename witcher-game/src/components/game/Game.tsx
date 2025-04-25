import { useRef, useState, useEffect, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { useGameControls } from "@/hooks/useGameControls";
import { Player } from "./Player";
import { Enemy } from "./Enemy";
import { Environment } from "./Environment";
import { GameOverlay } from "../ui/GameOverlay";
import { GameState, Enemy as EnemyType } from "@/types/game";
import * as THREE from "three";
import { Stats, Sky } from "@react-three/drei";

export function Game() {
  // Game state
  const [gameState, setGameState] = useState<GameState>({
    isGameActive: true,
    playerHealth: 100,
    score: 0,
  });

  // Controls
  const controls = useGameControls();

  // Player position for enemy AI - using state to ensure it's properly updated
  const [playerPos, setPlayerPos] = useState(new THREE.Vector3(0, 0, 0));
  const playerPosition = useRef(playerPos);

  // Update ref when state changes
  useEffect(() => {
    playerPosition.current = playerPos;
  }, [playerPos]);

  // Enemies state
  const [enemies, setEnemies] = useState<
    {
      id: string;
      type: "wolf" | "bear" | "deer";
      position: [number, number, number];
    }[]
  >([]);

  // Enemy spawn timer
  useEffect(() => {
    if (!gameState.isGameActive) return;

    // Generate initial enemies
    if (enemies.length === 0) {
      const initialEnemies = [];
      // Generate some wolves
      for (let i = 0; i < 3; i++) {
        initialEnemies.push({
          id: `wolf-${i}`,
          type: "wolf" as const,
          position: [
            (Math.random() - 0.5) * 40,
            0,
            (Math.random() - 0.5) * 40,
          ] as [number, number, number],
        });
      }

      // Generate a bear
      initialEnemies.push({
        id: "bear-1",
        type: "bear" as const,
        position: [
          (Math.random() - 0.5) * 40,
          0,
          (Math.random() - 0.5) * 40,
        ] as [number, number, number],
      });

      // Generate some deer
      for (let i = 0; i < 5; i++) {
        initialEnemies.push({
          id: `deer-${i}`,
          type: "deer" as const,
          position: [
            (Math.random() - 0.5) * 40,
            0,
            (Math.random() - 0.5) * 40,
          ] as [number, number, number],
        });
      }

      setEnemies(initialEnemies);
    }

    // Spawn new enemies periodically
    const spawnInterval = setInterval(() => {
      const spawnChance = Math.random();
      let type: "wolf" | "bear" | "deer" = "wolf";

      if (spawnChance < 0.2) {
        type = "bear";
      } else if (spawnChance < 0.6) {
        type = "deer";
      }

      // Spawn new enemy at a random position around the map
      const angle = Math.random() * Math.PI * 2;
      const distance = 30 + Math.random() * 10; // Spawn between 30-40 units away
      const x = Math.cos(angle) * distance;
      const z = Math.sin(angle) * distance;

      setEnemies((prevEnemies) => [
        ...prevEnemies,
        {
          id: `${type}-${Date.now()}`,
          type,
          position: [x, 0, z] as [number, number, number],
        },
      ]);
    }, 10000); // Spawn a new enemy every 10 seconds

    return () => clearInterval(spawnInterval);
  }, [gameState.isGameActive]);

  // Handle player position updates
  const updatePlayerPosition = (newPosition: THREE.Vector3) => {
    setPlayerPos(newPosition);

    // Log player position occasionally for debugging
    if (Math.random() < 0.01) {
      // Only log occasionally
      console.log(
        `Player position: (${newPosition.x.toFixed(2)}, ${newPosition.y.toFixed(
          2
        )}, ${newPosition.z.toFixed(2)})`
      );
      console.log(`Active enemies: ${enemies.length}`);
    }
  };

  // Handle player attack
  const handlePlayerAttack = (
    position: THREE.Vector3,
    direction: THREE.Vector3
  ) => {
    // Calculate attack range and area
    const attackRange = 2.5;
    const attackAngle = Math.PI / 3; // 60 degrees attack arc

    // This approach won't work with Three.js/React Three Fiber
    // Instead, we'll directly use the enemies state we already have
    enemies.forEach((enemy) => {
      // Find the enemy in the scene using scene traversal instead of DOM elements
      // This is a scene-graph approach which works better with Three.js
      let foundEnemyRef: any = null;

      // Get the canvas element which contains the scene
      const canvas = document.querySelector("canvas");
      if (!canvas) return;

      // Access the Three.js scene through the __r3f property if available
      const scene = (canvas as any).__r3f?.scene;
      if (!scene) return;

      // Find our enemy by its userData enemyId
      scene.traverse((object: THREE.Object3D) => {
        if (object.userData.enemyId === enemy.id && object.type === "Group") {
          foundEnemyRef = object;
        }
      });

      if (!foundEnemyRef || typeof foundEnemyRef.takeDamage !== "function")
        return;

      // Check if enemy is in attack range and angle
      const enemyPosition = foundEnemyRef.position;
      if (!enemyPosition) return;

      const toEnemy = new THREE.Vector3().subVectors(enemyPosition, position);
      const distance = toEnemy.length();

      if (distance <= attackRange) {
        // Check if enemy is in the attack arc
        toEnemy.normalize();
        const angleToDot = toEnemy.dot(direction);

        if (angleToDot > Math.cos(attackAngle / 2)) {
          // Hit! Apply damage to enemy
          foundEnemyRef.takeDamage(20); // Player attack damage
        }
      }
    });
  };

  // Handle enemy attack to player
  const handleEnemyAttack = (damage: number) => {
    // If player is blocking, reduce damage
    const actualDamage = controls.block ? Math.ceil(damage / 2) : damage;

    setGameState((prev) => {
      const newHealth = Math.max(0, prev.playerHealth - actualDamage);

      // Check for player death
      if (newHealth <= 0 && prev.isGameActive) {
        return {
          ...prev,
          playerHealth: 0,
          isGameActive: false,
        };
      }

      return {
        ...prev,
        playerHealth: newHealth,
      };
    });
  };

  // Handle enemy death
  const handleEnemyDeath = (id: string) => {
    // Remove enemy and increase score
    setEnemies((prev) => prev.filter((enemy) => enemy.id !== id));

    setGameState((prev) => ({
      ...prev,
      score: prev.score + 10,
    }));
  };

  // Restart game
  const handleRestart = () => {
    setGameState({
      isGameActive: true,
      playerHealth: 100,
      score: 0,
    });
    setEnemies([]);
  };

  return (
    <div className="w-full h-screen relative">
      <Canvas shadows camera={{ position: [0, 3, 5], fov: 60 }}>
        {/* Debug stats (comment out in production) */}
        <Stats />

        {/* Sky with brighter settings */}
        <Sky sunPosition={[100, 40, 100]} />

        {/* Environment (terrain, trees, etc.) */}
        <Environment />

        {/* Add more light sources */}
        <ambientLight intensity={1.5} color="#ffffff" />
        <directionalLight
          position={[0, 10, 0]}
          intensity={2.5}
          color="#fffaea"
          castShadow
        />
        <hemisphereLight
          args={["#b9d5ff", "#444444", 1.0]}
          position={[0, 50, 0]}
        />

        {/* Extra ground light */}
        <pointLight
          position={[0, 0.5, 0]}
          intensity={1.0}
          color="#ffffff"
          distance={20}
        />

        {/* Player */}
        <Player
          controls={controls}
          onAttack={handlePlayerAttack}
          updatePosition={updatePlayerPosition}
        />

        {/* Enemies */}
        {enemies.map((enemy) => (
          <Enemy
            key={enemy.id}
            id={enemy.id}
            initialPosition={enemy.position}
            type={enemy.type}
            playerPosition={playerPos}
            onDeath={handleEnemyDeath}
            onAttackPlayer={handleEnemyAttack}
          />
        ))}

        {/* Lighter fog for better visibility */}
        <fog attach="fog" args={["#b9d5ff", 40, 80]} />
      </Canvas>

      {/* Game UI Overlay */}
      <GameOverlay gameState={gameState} onRestart={handleRestart} />
    </div>
  );
}
