import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { Enemy as EnemyType } from "@/types/game";

interface EnemyProps {
  initialPosition: [number, number, number];
  type: "wolf" | "bear" | "deer";
  playerPosition: THREE.Vector3;
  onDeath: (id: string) => void;
  onAttackPlayer: (damage: number) => void;
  id: string;
}

export function Enemy({
  initialPosition,
  type,
  playerPosition,
  onDeath,
  onAttackPlayer,
  id,
}: EnemyProps) {
  const group = useRef<THREE.Group>(null);
  const [enemy, setEnemy] = useState<EnemyType>(() => {
    // Different enemy types have different stats
    const baseStats = {
      wolf: {
        health: 50,
        maxHealth: 50,
        detectionRadius: 15,
        attackRadius: 2,
        attackPower: 10,
      },
      bear: {
        health: 100,
        maxHealth: 100,
        detectionRadius: 12,
        attackRadius: 2.5,
        attackPower: 20,
      },
      deer: {
        health: 30,
        maxHealth: 30,
        detectionRadius: 18,
        attackRadius: 0, // Deer doesn't attack
        attackPower: 0,
      },
    };

    return {
      id,
      position: initialPosition,
      rotation: [0, 0, 0],
      health: baseStats[type].health,
      maxHealth: baseStats[type].maxHealth,
      isAttacking: false,
      isBlocking: false,
      isDead: false,
      type,
      detectionRadius: baseStats[type].detectionRadius,
      attackRadius: baseStats[type].attackRadius,
      attackPower: baseStats[type].attackPower,
      aggroState: "idle" as const,
    };
  });

  const lastAttackTime = useRef(0);
  const attackCooldown = 1000; // 1 second between attacks

  // AI behavior
  useFrame((state, delta) => {
    if (!group.current || enemy.isDead) return;

    // Update position from the group
    setEnemy((prev) => ({
      ...prev,
      position: [
        group.current!.position.x,
        group.current!.position.y,
        group.current!.position.z,
      ],
      rotation: [0, group.current!.rotation.y, 0],
    }));

    // Distance to player
    const distanceToPlayer = new THREE.Vector3(...enemy.position).distanceTo(
      playerPosition
    );

    // Log distance for debugging
    if (Math.random() < 0.01) {
      // Only log occasionally to prevent spam
      console.log(
        `${enemy.type} ${id} distance to player: ${distanceToPlayer.toFixed(
          2
        )}, detection radius: ${enemy.detectionRadius}`
      );
    }

    // Update AI state based on distance to player
    if (distanceToPlayer <= enemy.attackRadius && enemy.type !== "deer") {
      // Attack range - try to attack player
      if (enemy.aggroState !== "attack") {
        setEnemy((prev) => ({ ...prev, aggroState: "attack" }));
      }

      // Attack player on cooldown
      const now = Date.now();
      if (now - lastAttackTime.current > attackCooldown) {
        lastAttackTime.current = now;
        setEnemy((prev) => ({ ...prev, isAttacking: true }));

        // Perform attack
        onAttackPlayer(enemy.attackPower);

        // Reset attack state after animation
        setTimeout(() => {
          setEnemy((prev) => ({ ...prev, isAttacking: false }));
        }, 300);
      }
    } else if (distanceToPlayer <= enemy.detectionRadius) {
      // Chase range - move toward player
      if (enemy.type === "deer") {
        if (enemy.aggroState !== "flee") {
          setEnemy((prev) => ({ ...prev, aggroState: "flee" }));
        }

        // Calculate direction away from player for fleeing
        const direction = new THREE.Vector3(...enemy.position)
          .sub(playerPosition)
          .normalize();

        // Rotate to face away from player
        const angle = Math.atan2(direction.x, direction.z);
        group.current.rotation.y = angle;

        // Move away
        const speed = 0.08 * delta * 60;
        group.current.position.x += direction.x * speed;
        group.current.position.z += direction.z * speed;
      } else {
        if (enemy.aggroState !== "chase") {
          setEnemy((prev) => ({ ...prev, aggroState: "chase" }));
        }

        // Calculate direction to player
        const direction = new THREE.Vector3()
          .subVectors(playerPosition, new THREE.Vector3(...enemy.position))
          .normalize();

        // Rotate to face player
        const angle = Math.atan2(direction.x, direction.z);
        group.current.rotation.y = angle;

        // Move toward player
        const speed = 0.05 * delta * 60;
        group.current.position.x += direction.x * speed;
        group.current.position.z += direction.z * speed;
      }
    } else {
      // Outside detection range - idle behavior
      if (enemy.aggroState !== "idle") {
        setEnemy((prev) => ({ ...prev, aggroState: "idle" }));
      }

      // Random movement could be implemented here
    }
  });

  // Handle taking damage
  const takeDamage = (amount: number) => {
    const newHealth = Math.max(0, enemy.health - amount);
    const isDead = newHealth <= 0;

    setEnemy((prev) => ({
      ...prev,
      health: newHealth,
      isDead,
    }));

    if (isDead) {
      onDeath(enemy.id);
    }
  };

  // Initialize userData in the group ref for identification
  useEffect(() => {
    if (group.current) {
      // Store id in userData instead of using data attributes
      group.current.userData.enemyId = id;
      // Expose the takeDamage function on the ref
      // @ts-ignore - Adding a custom property to the ref
      group.current.takeDamage = takeDamage;
    }
  }, [id]);

  // Enemy color based on type
  const getEnemyColor = () => {
    switch (enemy.type) {
      case "wolf":
        return "gray";
      case "bear":
        return "brown";
      case "deer":
        return "tan";
      default:
        return "purple";
    }
  };

  // Enemy size based on type
  const getEnemySize = () => {
    switch (enemy.type) {
      case "wolf":
        return [0.8, 0.8, 1.5] as [number, number, number];
      case "bear":
        return [1.5, 1.2, 2] as [number, number, number];
      case "deer":
        return [0.7, 1.2, 1.5] as [number, number, number];
      default:
        return [1, 1, 1] as [number, number, number];
    }
  };

  return (
    <group ref={group} position={new THREE.Vector3(...initialPosition)}>
      {!enemy.isDead && (
        <>
          {/* More realistic animal models based on type */}
          {enemy.type === "wolf" && (
            <group>
              {/* Wolf body */}
              <mesh position={[0, 0.5, 0]}>
                <capsuleGeometry args={[0.3, 0.8, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#777777"} roughness={0.8} />
              </mesh>
              {/* Wolf head */}
              <mesh position={[0, 0.6, 0.5]}>
                <sphereGeometry args={[0.25, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#777777"} roughness={0.7} />
              </mesh>
              {/* Wolf snout */}
              <mesh position={[0, 0.5, 0.7]} rotation={[Math.PI/2, 0, 0]}>
                <coneGeometry args={[0.15, 0.3, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#666666"} roughness={0.7} />
              </mesh>
              {/* Wolf legs */}
              <mesh position={[-0.2, 0.2, 0.3]}>
                <capsuleGeometry args={[0.08, 0.4, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#777777"} roughness={0.8} />
              </mesh>
              <mesh position={[0.2, 0.2, 0.3]}>
                <capsuleGeometry args={[0.08, 0.4, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#777777"} roughness={0.8} />
              </mesh>
              <mesh position={[-0.2, 0.2, -0.3]}>
                <capsuleGeometry args={[0.08, 0.4, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#777777"} roughness={0.8} />
              </mesh>
              <mesh position={[0.2, 0.2, -0.3]}>
                <capsuleGeometry args={[0.08, 0.4, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#777777"} roughness={0.8} />
              </mesh>
              {/* Wolf tail */}
              <mesh position={[0, 0.5, -0.6]} rotation={[0.3, 0, 0]}>
                <capsuleGeometry args={[0.05, 0.5, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#ff3333" : "#777777"} roughness={0.8} />
              </mesh>
            </group>
          )}

          {enemy.type === "bear" && (
            <group>
              {/* Bear body */}
              <mesh position={[0, 0.7, 0]}>
                <capsuleGeometry args={[0.6, 1.2, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
              {/* Bear head */}
              <mesh position={[0, 1.1, 0.7]}>
                <sphereGeometry args={[0.4, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
              {/* Bear snout */}
              <mesh position={[0, 1.0, 1.0]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#552200"} roughness={0.9} />
              </mesh>
              {/* Bear ears */}
              <mesh position={[-0.3, 1.3, 0.7]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
              <mesh position={[0.3, 1.3, 0.7]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
              {/* Bear legs */}
              <mesh position={[-0.4, 0.3, 0.4]}>
                <capsuleGeometry args={[0.15, 0.6, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
              <mesh position={[0.4, 0.3, 0.4]}>
                <capsuleGeometry args={[0.15, 0.6, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
              <mesh position={[-0.4, 0.3, -0.4]}>
                <capsuleGeometry args={[0.15, 0.6, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
              <mesh position={[0.4, 0.3, -0.4]}>
                <capsuleGeometry args={[0.15, 0.6, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc3300" : "#663300"} roughness={0.9} />
              </mesh>
            </group>
          )}

          {enemy.type === "deer" && (
            <group>
              {/* Deer body */}
              <mesh position={[0, 0.8, 0]}>
                <capsuleGeometry args={[0.3, 1.0, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc9966" : "#d2b48c"} roughness={0.7} />
              </mesh>
              {/* Deer head */}
              <mesh position={[0, 1.2, 0.6]}>
                <sphereGeometry args={[0.2, 8, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc9966" : "#d2b48c"} roughness={0.7} />
              </mesh>
              {/* Deer snout */}
              <mesh position={[0, 1.1, 0.8]}>
                <coneGeometry args={[0.1, 0.3, 8]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc9966" : "#c4a484"} roughness={0.7} />
              </mesh>
              {/* Deer antlers */}
              <mesh position={[-0.1, 1.4, 0.5]} rotation={[0.2, 0.3, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
                <meshStandardMaterial color="#8b7355" roughness={0.9} />
              </mesh>
              <mesh position={[0.1, 1.4, 0.5]} rotation={[0.2, -0.3, 0]}>
                <cylinderGeometry args={[0.02, 0.02, 0.4, 6]} />
                <meshStandardMaterial color="#8b7355" roughness={0.9} />
              </mesh>
              {/* Deer legs */}
              <mesh position={[-0.2, 0.4, 0.3]}>
                <capsuleGeometry args={[0.06, 0.8, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc9966" : "#d2b48c"} roughness={0.7} />
              </mesh>
              <mesh position={[0.2, 0.4, 0.3]}>
                <capsuleGeometry args={[0.06, 0.8, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc9966" : "#d2b48c"} roughness={0.7} />
              </mesh>
              <mesh position={[-0.2, 0.4, -0.3]}>
                <capsuleGeometry args={[0.06, 0.8, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc9966" : "#d2b48c"} roughness={0.7} />
              </mesh>
              <mesh position={[0.2, 0.4, -0.3]}>
                <capsuleGeometry args={[0.06, 0.8, 4, 4]} />
                <meshStandardMaterial color={enemy.isAttacking ? "#cc9966" : "#d2b48c"} roughness={0.7} />
              </mesh>
              {/* Deer tail */}
              <mesh position={[0, 0.8, -0.6]}>
                <sphereGeometry args={[0.08, 8, 8]} />
                <meshStandardMaterial color="#ffffff" roughness={0.7} />
              </mesh>
            </group>
          )}

          {/* Health bar */}
          <mesh position={[0, 2, 0]} rotation={[0, 0, 0]}>
            <planeGeometry args={[1, 0.2]} />
            <meshBasicMaterial color="red" side={THREE.DoubleSide} />
          </mesh>
          <mesh
            position={[-(1 - enemy.health / enemy.maxHealth) / 2, 2, 0.01]}
            rotation={[0, 0, 0]}
            scale={[enemy.health / enemy.maxHealth, 1, 1]}
          >
            <planeGeometry args={[1, 0.2]} />
            <meshBasicMaterial color="green" side={THREE.DoubleSide} />
          </mesh>
        </>
      )}
    </group>
  );
}
