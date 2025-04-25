import { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export function Environment() {
  // Create a reference for the grass
  const grassRef = useRef<THREE.Mesh>(null);

  // Create fog for atmospheric depth
  const fog = useMemo(() => new THREE.FogExp2("#b9d5ff", 0.005), []);

  return (
    <group>
      {/* Sky and fog */}
      <fog attach="fog" args={[fog.color, fog.density]} />
      <color attach="background" args={["#b9d5ff"]} />

      {/* Simple reliable ground - no textures */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.1, 0]}
        receiveShadow
      >
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#7bc74d" roughness={0.8} metalness={0.1} />
      </mesh>

      {/* Backup ground with basic material */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.15, 0]}
        receiveShadow
      >
        <planeGeometry args={[250, 250]} />
        <meshBasicMaterial color="#7bc74d" />
      </mesh>

      {/* Stronger ambient light for general scene illumination */}
      <ambientLight intensity={1.5} color="#ffffff" />

      {/* Brighter directional light for shadows (sun) */}
      <directionalLight
        position={[10, 10, 5]}
        intensity={2.0}
        color="#fffaea"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-far={50}
        shadow-camera-left={-20}
        shadow-camera-right={20}
        shadow-camera-top={20}
        shadow-camera-bottom={-20}
        shadow-bias={-0.0001}
      />

      {/* Add a hemisphere light for better outdoor lighting */}
      <hemisphereLight
        args={["#b9d5ff", "#444444", 1.0]}
        position={[0, 50, 0]}
      />

      {/* Add some trees */}
      <TreeGroup position={[10, 0, 10]} count={5} radius={5} />
      <TreeGroup position={[-15, 0, -8]} count={7} radius={8} />
      <TreeGroup position={[5, 0, -20]} count={4} radius={6} />

      {/* Add some rocks */}
      <RockGroup position={[-5, 0, 15]} count={8} radius={4} />
      <RockGroup position={[20, 0, -5]} count={6} radius={3} />

      {/* Add water */}
      <Water position={[30, -0.05, -15]} size={[20, 20]} />
    </group>
  );
}

// Helper component to create a group of trees
function TreeGroup({
  position,
  count,
  radius,
}: {
  position: [number, number, number];
  count: number;
  radius: number;
}) {
  // Create array to hold tree elements
  const trees = [];

  // Note: We're not loading a 3D model since the file is missing
  // This component will use the fallback geometry instead

  for (let i = 0; i < count; i++) {
    // Position trees in a circle
    const angle = (i / count) * Math.PI * 2;
    const x = position[0] + Math.cos(angle) * radius * Math.random();
    const z = position[2] + Math.sin(angle) * radius * Math.random();
    const scale = 0.8 + Math.random() * 0.4;
    const rotation = Math.random() * Math.PI * 2;

    trees.push(
      <group
        key={`tree-${i}`}
        position={[x, 0, z]}
        rotation={[0, rotation, 0]}
        scale={[scale, scale, scale]}
      >
        {/* Fallback to simple geometry if model isn't loaded */}
        <>
          {/* Tree trunk */}
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.4, 3, 8]} />
            <meshStandardMaterial color="#5c4033" roughness={1} />
          </mesh>

          {/* Tree top */}
          <mesh position={[0, 3.5, 0]} castShadow>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshStandardMaterial color="#1e5631" roughness={0.8} />
          </mesh>
        </>
      </group>
    );
  }

  return <>{trees}</>;
}

// Helper component to create a group of rocks
function RockGroup({
  position,
  count,
  radius,
}: {
  position: [number, number, number];
  count: number;
  radius: number;
}) {
  // Create array to hold rock elements
  const rocks = [];

  // Note: We're not loading a 3D model since the file is missing
  // This component will use the fallback geometry instead

  for (let i = 0; i < count; i++) {
    // Position rocks in a circle with some randomness
    const angle = (i / count) * Math.PI * 2;
    const distance = radius * Math.random();
    const x = position[0] + Math.cos(angle) * distance;
    const z = position[2] + Math.sin(angle) * distance;
    const scale = 0.5 + Math.random();
    const rotation = [
      Math.random() * Math.PI,
      Math.random() * Math.PI,
      Math.random() * Math.PI,
    ];

    rocks.push(
      <group
        key={`rock-${i}`}
        position={[x, 0, z]}
        rotation={rotation as any}
        scale={[scale, scale, scale]}
      >
        {/* Fallback to simple geometry if model isn't loaded */}
        <mesh castShadow>
          <dodecahedronGeometry args={[scale / 2, 1]} />
          <meshStandardMaterial color="#777777" roughness={0.9} />
        </mesh>
      </group>
    );
  }

  return <>{rocks}</>;
}

// Water component with realistic effect
function Water({
  position,
  size,
}: {
  position: [number, number, number];
  size: [number, number];
}) {
  const waterRef = useRef<THREE.Mesh>(null);

  // Create a simple procedural texture instead of loading external files
  const waterTextures = useMemo(() => {
    // Create a canvas for the procedural texture
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext("2d");

    if (ctx) {
      // Draw base color
      ctx.fillStyle = "#2a6d9e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Add some texture variation
      for (let i = 0; i < 5000; i++) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 3 + 1;
        ctx.fillStyle = Math.random() > 0.5 ? "#2a6d9e" : "#3a85b5";
        ctx.fillRect(x, y, size, size);
      }
    }

    // Create texture from canvas
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);

    return {
      map: texture,
      normalMap: texture,
    };
  }, []);

  // Animate water using procedural animation instead of texture loading
  useFrame((state, delta) => {
    if (waterRef.current) {
      const time = state.clock.getElapsedTime();
      // Use the existing texture for animation
      if (waterTextures.map) {
        waterTextures.map.offset.x = Math.sin(time * 0.05) * 0.01;
        waterTextures.map.offset.y = Math.cos(time * 0.03) * 0.01;
      }
    }
  });

  return (
    <mesh
      ref={waterRef}
      position={position}
      rotation={[-Math.PI / 2, 0, 0]}
      receiveShadow
    >
      <planeGeometry args={[size[0], size[1], 32, 32]} />
      <meshStandardMaterial
        color="#2a6d9e"
        metalness={0.1}
        roughness={0.2}
        map={waterTextures.map}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}
