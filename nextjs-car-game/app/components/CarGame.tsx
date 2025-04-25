"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import styles from "./CarGame.module.css";

// Car properties interface
interface CarData {
  speed: number;
  maxSpeed: number;
  acceleration: number;
  deceleration: number;
  turnSpeed: number;
  friction: number;
  brakeStrength: number;
  velocity: THREE.Vector3;
  direction: THREE.Vector3;
  position: THREE.Vector3;
  // Add steering properties for smoother turning
  steeringAngle: number;
  maxSteeringAngle: number;
  steeringSpeed: number;
  steeringReturn: number;
  // Add shooting properties
  canShoot: boolean;
  reloadTime: number;
  lastShotTime: number;
}

// Controls interface
interface Controls {
  forward: boolean;
  backward: boolean;
  left: boolean;
  right: boolean;
  shoot: boolean;
}

// Projectile interface
interface Projectile {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  active: boolean;
  lifeTime: number;
}

const CarGame: React.FC = () => {
  const canvasRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const carRef = useRef<THREE.Group | null>(null);
  const roadRef = useRef<THREE.Mesh | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const projectilesRef = useRef<Projectile[]>([]);

  // Car data with initial values - improved for smoother movement
  const carDataRef = useRef<CarData>({
    speed: 0,
    maxSpeed: 0.4, // Slightly reduced for better control
    acceleration: 0.008, // Reduced for smoother acceleration
    deceleration: 0.005,
    turnSpeed: 0.03, // Reduced for smoother turning
    friction: 0.99, // Increased for less abrupt slowdown
    brakeStrength: 0.12, // Adjusted for smoother braking
    velocity: new THREE.Vector3(0, 0, 0),
    direction: new THREE.Vector3(0, 0, 1),
    position: new THREE.Vector3(0, 0.5, 0),
    // New steering properties
    steeringAngle: 0,
    maxSteeringAngle: 0.05,
    steeringSpeed: 0.003,
    steeringReturn: 0.02,
    // Shooting properties
    canShoot: true,
    reloadTime: 1000, // 1 second reload time
    lastShotTime: 0
  });

  // Controls
  const controlsRef = useRef<Controls>({
    forward: false,
    backward: false,
    left: false,
    right: false,
    shoot: false,
  });

  // Initialize the scene
  useEffect(() => {
    if (!canvasRef.current) return;

    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87ceeb); // Sky blue
    sceneRef.current = scene;

    // Create camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, -10);
    camera.lookAt(0, 0, 0);
    cameraRef.current = camera;

    // Create renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    canvasRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Add lights
    addLights();

    // Create environment
    createEnvironment();

    // Create car
    createCar();

    // Handle window resize
    const handleResize = () => {
      if (!rendererRef.current || !cameraRef.current) return;

      cameraRef.current.aspect = window.innerWidth / window.innerHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", handleResize);

    // Animation loop with time delta for consistent movement
    const animate = (time: number) => {
      // Calculate time delta for smooth movement regardless of frame rate
      const delta = lastTimeRef.current ? (time - lastTimeRef.current) / 1000 : 0.016;
      lastTimeRef.current = time;
      
      // Limit delta to prevent large jumps after tab switch or lag
      const cappedDelta = Math.min(delta, 0.1);
      
      updateCar(cappedDelta);
      updateProjectiles(cappedDelta);

      if (
        rendererRef.current &&
        sceneRef.current &&
        cameraRef.current &&
        carRef.current
      ) {
        // Update camera position to follow car with smooth interpolation
        const cameraOffset = new THREE.Vector3(0, 5, -10);
        cameraOffset.applyQuaternion(carRef.current.quaternion);
        
        // Smooth camera follow
        const targetCameraPos = new THREE.Vector3().copy(carRef.current.position).add(cameraOffset);
        cameraRef.current.position.lerp(targetCameraPos, 0.05);
        cameraRef.current.lookAt(carRef.current.position);

        // Render scene
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate(0);

    // Cleanup function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      window.removeEventListener("resize", handleResize);

      if (rendererRef.current && canvasRef.current) {
        canvasRef.current.removeChild(rendererRef.current.domElement);
      }
    };
  }, []);

  // Set up keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "w":
        case "arrowup":
          controlsRef.current.forward = true;
          break;
        case "s":
        case "arrowdown":
          controlsRef.current.backward = true;
          break;
        case "a":
        case "arrowleft":
          controlsRef.current.left = true;
          break;
        case "d":
        case "arrowright":
          controlsRef.current.right = true;
          break;
        case " ": // Space bar
          controlsRef.current.shoot = true;
          handleShoot();
          break;
      }
    };

    const handleKeyUp = (event: KeyboardEvent) => {
      switch (event.key.toLowerCase()) {
        case "w":
        case "arrowup":
          controlsRef.current.forward = false;
          break;
        case "s":
        case "arrowdown":
          controlsRef.current.backward = false;
          break;
        case "a":
        case "arrowleft":
          controlsRef.current.left = false;
          break;
        case "d":
        case "arrowright":
          controlsRef.current.right = false;
          break;
        case " ": // Space bar
          controlsRef.current.shoot = false;
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    // Cleanup
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  // Handle shooting
  const handleShoot = () => {
    if (!carRef.current || !sceneRef.current) return;
    
    const carData = carDataRef.current;
    const currentTime = Date.now();
    
    // Check if can shoot (reload time passed)
    if (carData.canShoot && currentTime - carData.lastShotTime > carData.reloadTime) {
      // Create projectile
      const projectileGeometry = new THREE.SphereGeometry(0.3, 16, 16);
      const projectileMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xff0000,
        emissive: 0xff4400,
        emissiveIntensity: 0.5
      });
      
      const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);
      
      // Position at cannon tip
      const cannonTip = new THREE.Vector3(0, 1.8, 4.5);
      cannonTip.applyQuaternion(carRef.current.quaternion);
      cannonTip.add(carRef.current.position);
      
      projectile.position.copy(cannonTip);
      
      // Set velocity based on car's direction
      const velocity = carData.direction.clone().multiplyScalar(0.8);
      
      // Add to scene
      sceneRef.current.add(projectile);
      
      // Add to projectiles array
      projectilesRef.current.push({
        mesh: projectile,
        velocity: velocity,
        active: true,
        lifeTime: 0
      });
      
      // Update last shot time
      carData.lastShotTime = currentTime;
      
      // Play sound effect (if you want to add sound later)
    }
  };

  // Update projectiles
  const updateProjectiles = (delta: number) => {
    if (!sceneRef.current) return;
    
    projectilesRef.current.forEach((projectile, index) => {
      if (!projectile.active) return;
      
      // Update position
      projectile.mesh.position.add(projectile.velocity);
      
      // Add gravity effect
      projectile.velocity.y -= 0.01;
      
      // Update lifetime
      projectile.lifeTime += delta;
      
      // Check for ground collision
      if (projectile.mesh.position.y <= 0.3) {
        // Create explosion
        createExplosion(projectile.mesh.position);
        
        // Remove projectile
        sceneRef.current?.remove(projectile.mesh);
        projectile.active = false;
      }
      
      // Remove after max lifetime (5 seconds)
      if (projectile.lifeTime > 5) {
        sceneRef.current?.remove(projectile.mesh);
        projectile.active = false;
      }
    });
    
    // Clean up inactive projectiles
    projectilesRef.current = projectilesRef.current.filter(p => p.active);
  };

  // Create explosion effect
  const createExplosion = (position: THREE.Vector3) => {
    if (!sceneRef.current) return;
    
    // Create explosion mesh
    const explosionGeometry = new THREE.SphereGeometry(2, 16, 16);
    const explosionMaterial = new THREE.MeshStandardMaterial({
      color: 0xff5500,
      emissive: 0xff8800,
      emissiveIntensity: 1,
      transparent: true,
      opacity: 0.8
    });
    
    const explosion = new THREE.Mesh(explosionGeometry, explosionMaterial);
    explosion.position.copy(position);
    explosion.position.y = 0.5; // Slightly above ground
    
    sceneRef.current.add(explosion);
    
    // Animate explosion
    let scale = 0.1;
    let opacity = 1;
    
    const animateExplosion = () => {
      if (scale >= 1.5) {
        sceneRef.current?.remove(explosion);
        return;
      }
      
      scale += 0.1;
      opacity -= 0.05;
      
      explosion.scale.set(scale, scale, scale);
      explosionMaterial.opacity = Math.max(0, opacity);
      
      requestAnimationFrame(animateExplosion);
    };
    
    animateExplosion();
  };

  // Add lights to the scene
  const addLights = () => {
    if (!sceneRef.current) return;

    // Directional light (sun)
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 1024;
    directionalLight.shadow.mapSize.height = 1024;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    sceneRef.current.add(directionalLight);

    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    sceneRef.current.add(ambientLight);
  };

  // Create the environment
  const createEnvironment = () => {
    if (!sceneRef.current) return;

    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({
      color: 0x1e8449,
      roughness: 0.8,
      metalness: 0.2,
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    sceneRef.current.add(ground);

    // Create road
    const roadGeometry = new THREE.PlaneGeometry(10, 100);
    const roadMaterial = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.5,
      metalness: 0.3,
    });
    const road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01; // Slightly above ground to prevent z-fighting
    road.receiveShadow = true;
    sceneRef.current.add(road);
    roadRef.current = road;

    // Add road markings
    const markingGeometry = new THREE.PlaneGeometry(0.5, 2);
    const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xffffff });

    for (let i = -45; i < 45; i += 10) {
      const marking = new THREE.Mesh(markingGeometry, markingMaterial);
      marking.rotation.x = -Math.PI / 2;
      marking.position.set(0, 0.02, i);
      marking.receiveShadow = true;
      sceneRef.current.add(marking);
    }

    // Add some trees for environment
    const treeGeometry = new THREE.ConeGeometry(1, 4, 6);
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x228b22 });
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });

    for (let i = 0; i < 30; i++) {
      const tree = new THREE.Group();

      // Create trunk
      const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
      trunk.position.y = 0.5;
      trunk.castShadow = true;
      tree.add(trunk);

      // Create foliage
      const foliage = new THREE.Mesh(treeGeometry, treeMaterial);
      foliage.position.y = 3;
      foliage.castShadow = true;
      tree.add(foliage);

      // Position tree randomly
      const xPos = Math.random() * 80 - 40;
      const zPos = Math.random() * 80 - 40;

      // Don't place trees on the road
      if (Math.abs(xPos) > 5) {
        tree.position.set(xPos, 0, zPos);
        sceneRef.current.add(tree);
      }
    }
  };
  // Create a Warhammer-inspired flying tank model
  const createCar = () => {
    if (!sceneRef.current) return;

    const car = new THREE.Group();

    // Tank body - heavier and more angular than a car
    const bodyGeometry = new THREE.BoxGeometry(3, 1.2, 5);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x2d4b2d }); // Military green
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 1.0; // Hovering above ground
    body.castShadow = true;
    car.add(body);

    // Tank turret
    const turretGeometry = new THREE.CylinderGeometry(1.2, 1.5, 1, 8);
    const turretMaterial = new THREE.MeshStandardMaterial({ color: 0x1a3a1a }); // Darker green
    const turret = new THREE.Mesh(turretGeometry, turretMaterial);
    turret.position.y = 1.8;
    turret.position.z = 0;
    turret.castShadow = true;
    car.add(turret);

    // Main cannon
    const cannonGeometry = new THREE.CylinderGeometry(0.3, 0.3, 4, 16);
    const cannonMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    const cannon = new THREE.Mesh(cannonGeometry, cannonMaterial);
    cannon.position.set(0, 1.8, 2.5);
    cannon.rotation.x = Math.PI / 2;
    cannon.castShadow = true;
    car.add(cannon);

    // Armor plates
    const frontArmorGeometry = new THREE.BoxGeometry(3.2, 1, 0.5);
    const armorMaterial = new THREE.MeshStandardMaterial({ color: 0x3a5a3a });
    const frontArmor = new THREE.Mesh(frontArmorGeometry, armorMaterial);
    frontArmor.position.set(0, 1, 2.7);
    frontArmor.castShadow = true;
    car.add(frontArmor);

    // Side armor plates
    const sideArmorGeometry = new THREE.BoxGeometry(0.5, 0.8, 5.2);
    
    const leftArmor = new THREE.Mesh(sideArmorGeometry, armorMaterial);
    leftArmor.position.set(-1.7, 1, 0);
    leftArmor.castShadow = true;
    car.add(leftArmor);
    
    const rightArmor = new THREE.Mesh(sideArmorGeometry, armorMaterial);
    rightArmor.position.set(1.7, 1, 0);
    rightArmor.castShadow = true;
    car.add(rightArmor);

    // Hover engines (replacing wheels)
    const engineGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.3, 16);
    const engineMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
    const glowMaterial = new THREE.MeshStandardMaterial({
      color: 0x00aaff,
      emissive: 0x0088ff,
      emissiveIntensity: 1.0,
    });

    // Create four hover engines
    for (let x of [-1.3, 1.3]) {
      for (let z of [-2, 2]) {
        const engine = new THREE.Mesh(engineGeometry, engineMaterial);
        engine.position.set(x, 0.5, z);
        engine.rotation.x = Math.PI / 2;
        car.add(engine);
        
        // Add glow effect under each engine
        const glowGeometry = new THREE.CylinderGeometry(0.4, 0.1, 0.5, 16);
        const glow = new THREE.Mesh(glowGeometry, glowMaterial);
        glow.position.set(0, -0.3, 0);
        engine.add(glow);
      }
    }

    // Add imperial insignia
    const insigniaGeometry = new THREE.BoxGeometry(1.5, 0.1, 1.5);
    const insigniaMaterial = new THREE.MeshStandardMaterial({ 
      color: 0xd4af37,
      emissive: 0xd4af37,
      emissiveIntensity: 0.3
    });
    const insignia = new THREE.Mesh(insigniaGeometry, insigniaMaterial);
    insignia.position.set(0, 1.9, 0);
    car.add(insignia);

    // Add weapon systems
    const weaponGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.8);
    const weaponMaterial = new THREE.MeshStandardMaterial({ color: 0x222222 });
    
    // Left weapon
    const leftWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    leftWeapon.position.set(-1.5, 1.5, 1.5);
    car.add(leftWeapon);
    
    // Right weapon
    const rightWeapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
    rightWeapon.position.set(1.5, 1.5, 1.5);
    car.add(rightWeapon);

    // Add to scene
    sceneRef.current.add(car);
    carRef.current = car;

    // Set starting position - hovering above ground
    car.position.set(0, 0.8, 0);
  };
  // Update car position and rotation with delta time for smooth movement
  const updateCar = (delta: number) => {
    if (!carRef.current) return;

    const carData = carDataRef.current;
    const controls = controlsRef.current;

    // Scale all movement values by delta time for consistent movement regardless of frame rate
    const scaledAcceleration = carData.acceleration * delta * 60;
    const scaledBrakeStrength = carData.brakeStrength * delta * 60;
    const scaledSteeringSpeed = carData.steeringSpeed * delta * 60;
    const scaledSteeringReturn = carData.steeringReturn * delta * 60;

    // Apply acceleration
    if (controls.forward) {
      carData.speed += scaledAcceleration;
    }

    // Apply braking
    if (controls.backward) {
      if (carData.speed > 0) {
        carData.speed -= scaledBrakeStrength;
      } else {
        carData.speed -= scaledAcceleration * 0.5; // Reverse is slower
      }
    }

    // Apply friction to slow down
    carData.speed *= Math.pow(carData.friction, delta * 60);

    // Clamp speed
    carData.speed = Math.max(
      Math.min(carData.speed, carData.maxSpeed),
      -carData.maxSpeed * 0.5
    );

    // Gradually apply steering for smoother turning
    if (controls.left) {
      carData.steeringAngle += scaledSteeringSpeed;
    } else if (controls.right) {
      carData.steeringAngle -= scaledSteeringSpeed;
    } else {
      // Return steering to center when not turning
      if (carData.steeringAngle > 0) {
        carData.steeringAngle = Math.max(0, carData.steeringAngle - scaledSteeringReturn);
      } else if (carData.steeringAngle < 0) {
        carData.steeringAngle = Math.min(0, carData.steeringAngle + scaledSteeringReturn);
      }
    }

    // Clamp steering angle
    carData.steeringAngle = Math.max(
      Math.min(carData.steeringAngle, carData.maxSteeringAngle),
      -carData.maxSteeringAngle
    );

    // Apply steering - turning effect is proportional to speed
    const turnEffect = carData.steeringAngle * Math.abs(carData.speed) / carData.maxSpeed;
    carRef.current.rotation.y += turnEffect * Math.sign(carData.speed);

    // Update direction based on car's rotation
    carData.direction
      .set(0, 0, 1)
      .applyAxisAngle(new THREE.Vector3(0, 1, 0), carRef.current.rotation.y);

    // Move car based on speed and direction
    const movement = carData.direction.clone().multiplyScalar(carData.speed);
    carRef.current.position.add(movement);

    // Add hover effect - slight bobbing motion
    const hoverHeight = 0.8 + Math.sin(Date.now() * 0.003) * 0.1;
    carRef.current.position.y = hoverHeight;
  };

  // Handle control buttons for mobile support
  const handleButtonDown = (control: keyof Controls) => {
    controlsRef.current[control] = true;
    
    // Handle shooting separately
    if (control === 'shoot') {
      handleShoot();
    }
  };

  const handleButtonUp = (control: keyof Controls) => {
    controlsRef.current[control] = false;
  };

  return (
    <div className={styles["game-container"]}>
      <div ref={canvasRef} className={styles["game-canvas"]}></div>
      <div className={styles.controls}>
        <p>Use W, A, S, D keys or Arrow keys to drive the car</p>
        <p>W/Up - Accelerate, S/Down - Brake/Reverse</p>
        <p>A/Left - Turn Left, D/Right - Turn Right</p>
        <p>Space - Fire Main Cannon</p>
        
        {/* On-screen controls for mobile and debugging */}
        <div className={styles["mobile-controls"]}>
          <button 
            className={styles["control-button"]}
            onMouseDown={() => handleButtonDown('forward')}
            onMouseUp={() => handleButtonUp('forward')}
            onTouchStart={() => handleButtonDown('forward')}
            onTouchEnd={() => handleButtonUp('forward')}
          >
            Forward (W)
          </button>
          
          <div className={styles["horizontal-controls"]}>
            <button 
              className={styles["control-button"]}
              onMouseDown={() => handleButtonDown('left')}
              onMouseUp={() => handleButtonUp('left')}
              onTouchStart={() => handleButtonDown('left')}
              onTouchEnd={() => handleButtonUp('left')}
            >
              Left (A)
            </button>
            
            <button 
              className={styles["control-button"]}
              onMouseDown={() => handleButtonDown('shoot')}
              onMouseUp={() => handleButtonUp('shoot')}
              onTouchStart={() => handleButtonDown('shoot')}
              onTouchEnd={() => handleButtonUp('shoot')}
            >
              Fire (Space)
            </button>
            
            <button 
              className={styles["control-button"]}
              onMouseDown={() => handleButtonDown('right')}
              onMouseUp={() => handleButtonUp('right')}
              onTouchStart={() => handleButtonDown('right')}
              onTouchEnd={() => handleButtonUp('right')}
            >
              Right (D)
            </button>
          </div>
          
          <button 
            className={styles["control-button"]}
            onMouseDown={() => handleButtonDown('backward')}
            onMouseUp={() => handleButtonUp('backward')}
            onTouchStart={() => handleButtonDown('backward')}
            onTouchEnd={() => handleButtonUp('backward')}
          >
            Backward (S)
          </button>
        </div>
      </div>
    </div>
  );
};

export default CarGame;
