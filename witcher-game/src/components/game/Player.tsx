import { useRef, useState, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF, useAnimations } from "@react-three/drei";
import * as THREE from "three";
import { Player as PlayerType } from "@/types/game";

interface PlayerProps {
  controls: {
    moveForward: boolean;
    moveBackward: boolean;
    moveLeft: boolean;
    moveRight: boolean;
    attack: boolean;
    block: boolean;
  };
  onAttack: (position: THREE.Vector3, direction: THREE.Vector3) => void;
  updatePosition: (position: THREE.Vector3) => void;
}

export function Player({ controls, onAttack, updatePosition }: PlayerProps) {
  const group = useRef<THREE.Group>(null);
  const [player, setPlayer] = useState<PlayerType>({
    id: "player",
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    health: 100,
    maxHealth: 100,
    isAttacking: false,
    isBlocking: false,
    isDead: false,
    moveSpeed: 0.15,
    attackPower: 20,
    isMoving: false,
    direction: [0, 0, 1],
  });

  // Placeholder for the real model
  // In a real implementation, you would load a GLTF model for the Witcher
  // const { nodes, materials, animations } = useGLTF('/models/witcher.glb');
  // const { actions } = useAnimations(animations, group);

  const [currentAnimation, setCurrentAnimation] = useState("idle");

  // Camera following logic
  const cameraTargetPosition = useRef(new THREE.Vector3(0, 1.5, -5));
  const cameraLookAt = useRef(new THREE.Vector3());
  const playerPosition = useRef(new THREE.Vector3());
  const playerDirection = useRef(new THREE.Vector3(0, 0, 1));
  const cameraPitch = useRef(0.3); // Camera pitch angle (looking down slightly)
  const cameraDistance = useRef(7); // Distance behind player

  // Handle player movement and actions
  useFrame((state, delta) => {
    if (!group.current) return;

    // Update player position ref for camera
    playerPosition.current.set(...player.position);

    // Get forward and right vectors from camera (for input direction)
    const cameraForward = new THREE.Vector3(0, 0, -1).applyQuaternion(
      state.camera.quaternion
    );
    cameraForward.y = 0; // Keep movement on xz plane
    cameraForward.normalize();

    const cameraRight = new THREE.Vector3(1, 0, 0).applyQuaternion(
      state.camera.quaternion
    );
    cameraRight.y = 0;
    cameraRight.normalize();

    // Initialize movement direction
    const moveDirection = new THREE.Vector3(0, 0, 0);

    // Track if S key is pressed separately
    let backwardMovement = false;

    // Add camera-relative input directions
    if (controls.moveForward) moveDirection.add(cameraForward);
    if (controls.moveBackward) {
      backwardMovement = true;
      // Don't add to moveDirection yet, we'll handle S key separately
    }
    if (controls.moveRight) moveDirection.add(cameraRight);
    if (controls.moveLeft) moveDirection.sub(cameraRight);

    // Calculate move distance with delta for consistent speed
    const moveDistance = player.moveSpeed * delta * 60;

    // Handle backward movement separately (S key)
    if (backwardMovement && !moveDirection.length() && group.current) {
      // Store reference to avoid null checks
      const currentGroup = group.current;

      // Only backward - move directly backward without rotation
      const backDir = new THREE.Vector3(
        -Math.sin(currentGroup.rotation.y),
        0,
        -Math.cos(currentGroup.rotation.y)
      );

      currentGroup.position.x += backDir.x * moveDistance;
      currentGroup.position.z += backDir.z * moveDistance;

      // Set movement flag but don't change rotation
      setPlayer((prev) => ({
        ...prev,
        position: [
          currentGroup.position.x,
          currentGroup.position.y,
          currentGroup.position.z,
        ],
        isMoving: true,
      }));

      // Send position update
      updatePosition(
        new THREE.Vector3(
          currentGroup.position.x,
          currentGroup.position.y,
          currentGroup.position.z
        )
      );

      // Set animation
      if (currentAnimation !== "run") {
        setCurrentAnimation("run");
      }
    }
    // Handle all other movement normally
    else if (moveDirection.length() > 0) {
      // Normalize for consistent speed in all directions
      moveDirection.normalize();

      // If also pressing S while strafing or moving forward, add some backward influence
      if (backwardMovement) {
        const backInfluence = new THREE.Vector3(
          -Math.sin(group.current.rotation.y),
          0,
          -Math.cos(group.current.rotation.y)
        ).multiplyScalar(0.3); // 30% influence

        moveDirection.add(backInfluence).normalize();
      }

      // Rotate player to face movement direction
      const targetRotation = Math.atan2(moveDirection.x, moveDirection.z);

      // Smooth rotation
      let currentRotation = group.current.rotation.y;
      const rotDiff = targetRotation - currentRotation;

      // Handle angle wrap-around
      let rotDiffAdjusted = ((rotDiff + Math.PI) % (Math.PI * 2)) - Math.PI;
      if (rotDiffAdjusted < -Math.PI) rotDiffAdjusted += Math.PI * 2;

      // Apply smooth rotation
      group.current.rotation.y += rotDiffAdjusted * 0.15;

      // Update player direction reference
      playerDirection.current.set(
        Math.sin(group.current.rotation.y),
        0,
        Math.cos(group.current.rotation.y)
      );

      // Apply movement
      group.current.position.x += moveDirection.x * moveDistance;
      group.current.position.z += moveDirection.z * moveDistance;

      // Boundary check
      const boundaryLimit = 50;
      group.current.position.x = Math.max(
        -boundaryLimit,
        Math.min(boundaryLimit, group.current.position.x)
      );
      group.current.position.z = Math.max(
        -boundaryLimit,
        Math.min(boundaryLimit, group.current.position.z)
      );

      // Create new position as Vector3
      const newPos = new THREE.Vector3(
        group.current.position.x,
        group.current.position.y,
        group.current.position.z
      );

      // Update player state
      setPlayer((prev) => ({
        ...prev,
        position: [newPos.x, newPos.y, newPos.z],
        rotation: [0, group.current?.rotation.y || 0, 0],
        isMoving: true,
        direction: [
          playerDirection.current.x,
          playerDirection.current.y,
          playerDirection.current.z,
        ],
      }));

      // Send position update to parent
      updatePosition(newPos);

      // Set animation
      if (currentAnimation !== "run") {
        setCurrentAnimation("run");
      }
    } else if (player.isMoving) {
      setPlayer((prev) => ({ ...prev, isMoving: false }));

      if (currentAnimation !== "idle") {
        setCurrentAnimation("idle");
      }
    }

    // Camera follows player - position behind player
    const cameraOffset = new THREE.Vector3(
      -Math.sin(group.current.rotation.y) * 7,
      3,
      -Math.cos(group.current.rotation.y) * 7
    );

    cameraTargetPosition.current.copy(
      new THREE.Vector3(...player.position).add(cameraOffset)
    );

    cameraLookAt.current.set(
      group.current.position.x,
      group.current.position.y + 1,
      group.current.position.z
    );

    // Camera smoothing
    state.camera.position.lerp(cameraTargetPosition.current, 0.1);
    state.camera.lookAt(cameraLookAt.current);

    // Handle attack
    if (controls.attack && !player.isAttacking && !player.isBlocking) {
      setPlayer((prev) => ({ ...prev, isAttacking: true }));

      setCurrentAnimation("attack");
      // In a real implementation: actions['attack']?.reset().fadeIn(0.1).play();

      // Notify parent component about the attack
      onAttack(new THREE.Vector3(...player.position), playerDirection.current);

      // Attack animation duration
      setTimeout(() => {
        setPlayer((prev) => ({ ...prev, isAttacking: false }));
        setCurrentAnimation(player.isMoving ? "run" : "idle");
        // In a real implementation, reset to previous animation
      }, 500);
    }

    // Handle block
    if (controls.block && !player.isAttacking && !player.isBlocking) {
      setPlayer((prev) => ({ ...prev, isBlocking: true }));

      setCurrentAnimation("block");
      // In a real implementation: actions['block']?.reset().fadeIn(0.1).play();
    } else if (!controls.block && player.isBlocking) {
      setPlayer((prev) => ({ ...prev, isBlocking: false }));
      setCurrentAnimation(player.isMoving ? "run" : "idle");
      // In a real implementation, reset to previous animation
    }
  });

  return (
    <group ref={group}>
      {/* Witcher character model */}
      <group>
        {/* Body */}
        <mesh position={[0, 1, 0]}>
          <capsuleGeometry args={[0.4, 1.2, 4, 8]} />
          <meshStandardMaterial color="#5a4a3f" roughness={0.7} />
        </mesh>

        {/* Head */}
        <mesh position={[0, 2, 0]}>
          <sphereGeometry args={[0.3, 16, 16]} />
          <meshStandardMaterial color="#e0c8b0" roughness={0.6} />
        </mesh>

        {/* Hair */}
        <mesh position={[0, 2.1, 0]}>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial
            color="#f0f0f0"
            roughness={1}
            transparent
            opacity={0.9}
          />
        </mesh>

        {/* Shoulders/Armor */}
        <mesh position={[0, 1.5, 0]} scale={[1.2, 0.3, 0.8]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial
            color={
              player.isAttacking
                ? "#8b0000"
                : player.isBlocking
                ? "#00008b"
                : "#3a3a3a"
            }
            roughness={0.9}
            metalness={0.2}
          />
        </mesh>

        {/* Arms */}
        <mesh
          position={[-0.6, 1.3, 0]}
          rotation={[0, 0, player.isBlocking ? -Math.PI / 3 : -Math.PI / 8]}
        >
          <capsuleGeometry args={[0.15, 0.7, 4, 8]} />
          <meshStandardMaterial color="#5a4a3f" roughness={0.7} />
        </mesh>
        <mesh
          position={[0.6, 1.3, 0]}
          rotation={[0, 0, player.isAttacking ? Math.PI / 3 : Math.PI / 8]}
        >
          <capsuleGeometry args={[0.15, 0.7, 4, 8]} />
          <meshStandardMaterial color="#5a4a3f" roughness={0.7} />
        </mesh>

        {/* Legs */}
        <mesh position={[-0.2, 0.4, 0]}>
          <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>
        <mesh position={[0.2, 0.4, 0]}>
          <capsuleGeometry args={[0.2, 0.8, 4, 8]} />
          <meshStandardMaterial color="#2a2a2a" roughness={0.8} />
        </mesh>

        {/* Medallion */}
        <mesh position={[0, 1.5, 0.4]} scale={[0.1, 0.1, 0.05]}>
          <sphereGeometry args={[1, 16, 16]} />
          <meshStandardMaterial color="gold" metalness={0.8} roughness={0.2} />
        </mesh>
      </group>

      {/* Sword */}
      <group
        position={[0.7, 1.3, 0.2]}
        rotation={[0, 0, player.isAttacking ? Math.PI / 3 : Math.PI / 8]}
      >
        {/* Blade */}
        <mesh position={[0, 0.6, 0]}>
          <boxGeometry args={[0.08, 1.2, 0.02]} />
          <meshStandardMaterial
            color="silver"
            metalness={0.9}
            roughness={0.1}
          />
        </mesh>

        {/* Hilt */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.05, 0.05, 0.2, 8]} />
          <meshStandardMaterial
            color="#3a3a3a"
            metalness={0.5}
            roughness={0.5}
          />
        </mesh>

        {/* Guard */}
        <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.3, 0.05, 0.05]} />
          <meshStandardMaterial
            color="#3a3a3a"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>

        {/* Pommel */}
        <mesh position={[0, -0.15, 0]}>
          <sphereGeometry args={[0.06, 8, 8]} />
          <meshStandardMaterial
            color="#3a3a3a"
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
      </group>
    </group>
  );
}
