// 3D Car Driving Game with Third-person View

// Scene setup
let scene, camera, renderer;
let car, road, terrain;
let directionalLight, ambientLight;

// Car properties
const carData = {
    speed: 0,
    maxSpeed: 0.3,
    acceleration: 0.005,
    deceleration: 0.003,
    turnSpeed: 0.03,
    friction: 0.95,
    brakeStrength: 0.1,
    velocity: new THREE.Vector3(0, 0, 0),
    direction: new THREE.Vector3(0, 0, 1),
    position: new THREE.Vector3(0, 0.5, 0)
};

// Controls
const controls = {
    forward: false,
    backward: false,
    left: false,
    right: false
};

// Initialize the scene
function init() {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB); // Sky blue
    
    // Create camera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 5, -10);
    camera.lookAt(0, 0, 0);
    
    // Create renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    document.getElementById('gameCanvas').appendChild(renderer.domElement);
    
    // Add lights
    addLights();
    
    // Create environment
    createEnvironment();
    
    // Create car
    createCar();
    
    // Set up event listeners
    setupEventListeners();
    
    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    
    // Start animation loop
    animate();
}

// Create the environment
function createEnvironment() {
    // Create ground plane
    const groundGeometry = new THREE.PlaneGeometry(100, 100);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x1e8449,
        roughness: 0.8,
        metalness: 0.2
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);
    
    // Create road
    const roadGeometry = new THREE.PlaneGeometry(10, 100);
    const roadMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x333333,
        roughness: 0.5,
        metalness: 0.3
    });
    road = new THREE.Mesh(roadGeometry, roadMaterial);
    road.rotation.x = -Math.PI / 2;
    road.position.y = 0.01; // Slightly above ground to prevent z-fighting
    road.receiveShadow = true;
    scene.add(road);
    
    // Add road markings
    const markingGeometry = new THREE.PlaneGeometry(0.5, 2);
    const markingMaterial = new THREE.MeshStandardMaterial({ color: 0xFFFFFF });
    
    for (let i = -45; i < 45; i += 10) {
        const marking = new THREE.Mesh(markingGeometry, markingMaterial);
        marking.rotation.x = -Math.PI / 2;
        marking.position.set(0, 0.02, i);
        marking.receiveShadow = true;
        scene.add(marking);
    }
    
    // Add some trees for environment
    const treeGeometry = new THREE.ConeGeometry(1, 4, 6);
    const treeMaterial = new THREE.MeshStandardMaterial({ color: 0x228B22 });
    const trunkGeometry = new THREE.CylinderGeometry(0.2, 0.2, 1, 8);
    const trunkMaterial = new THREE.MeshStandardMaterial({ color: 0x8B4513 });
    
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
            scene.add(tree);
        }
    }
}

// Create a simple car model
function createCar() {
    car = new THREE.Group();
    
    // Car body
    const bodyGeometry = new THREE.BoxGeometry(2, 1, 4);
    const bodyMaterial = new THREE.MeshStandardMaterial({ color: 0x3498db });
    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    body.position.y = 0.5;
    body.castShadow = true;
    car.add(body);
    
    // Car roof
    const roofGeometry = new THREE.BoxGeometry(1.8, 0.7, 2);
    const roofMaterial = new THREE.MeshStandardMaterial({ color: 0x2980b9 });
    const roof = new THREE.Mesh(roofGeometry, roofMaterial);
    roof.position.y = 1.35;
    roof.position.z = -0.2;
    roof.castShadow = true;
    car.add(roof);
    
    // Windshield
    const windshieldGeometry = new THREE.BoxGeometry(1.7, 0.6, 0.1);
    const windshieldMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xadd8e6,
        transparent: true,
        opacity: 0.7
    });
    const windshield = new THREE.Mesh(windshieldGeometry, windshieldMaterial);
    windshield.position.set(0, 1.3, 0.85);
    car.add(windshield);
    
    // Wheels
    const wheelGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.3, 16);
    wheelGeometry.rotateX(Math.PI / 2);
    const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333 });
    
    // Front left wheel
    const wheelFL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFL.position.set(-1.1, 0.4, 1.2);
    wheelFL.castShadow = true;
    car.add(wheelFL);
    
    // Front right wheel
    const wheelFR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelFR.position.set(1.1, 0.4, 1.2);
    wheelFR.castShadow = true;
    car.add(wheelFR);
    
    // Rear left wheel
    const wheelRL = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRL.position.set(-1.1, 0.4, -1.2);
    wheelRL.castShadow = true;
    car.add(wheelRL);
    
    // Rear right wheel
    const wheelRR = new THREE.Mesh(wheelGeometry, wheelMaterial);
    wheelRR.position.set(1.1, 0.4, -1.2);
    wheelRR.castShadow = true;
    car.add(wheelRR);
    
    // Add headlights
    const headlightGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const headlightMaterial = new THREE.MeshStandardMaterial({ 
        color: 0xFFFFFF,
        emissive: 0xFFFFFF,
        emissiveIntensity: 0.5
    });
    
    // Left headlight
    const headlightL = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlightL.position.set(-0.7, 0.5, 2);
    car.add(headlightL);
    
    // Right headlight
    const headlightR = new THREE.Mesh(headlightGeometry, headlightMaterial);
    headlightR.position.set(0.7, 0.5, 2);
    car.add(headlightR);
    
    // Add to scene
    scene.add(car);
    
    // Set starting position
    car.position.set(0, 0, 0);
}

// Add lights to the scene
function addLights() {
    // Directional light (sun)
    directionalLight = new THREE.DirectionalLight(0xffffff, 1);
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
    scene.add(directionalLight);
    
    // Ambient light
    ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
}

// Set up event listeners for WASD controls
function setupEventListeners() {
    document.addEventListener('keydown', function(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
                controls.forward = true;
                break;
            case 's':
                controls.backward = true;
                break;
            case 'a':
                controls.left = true;
                break;
            case 'd':
                controls.right = true;
                break;
        }
    });
    
    document.addEventListener('keyup', function(event) {
        switch(event.key.toLowerCase()) {
            case 'w':
                controls.forward = false;
                break;
            case 's':
                controls.backward = false;
                break;
            case 'a':
                controls.left = false;
                break;
            case 'd':
                controls.right = false;
                break;
        }
    });
}

// Handle window resize
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

// Update car position and rotation based on controls
function updateCar() {
    // Apply acceleration/braking
    if (controls.forward) {
        carData.speed += carData.acceleration;
    } else if (controls.backward) {
        if (carData.speed > 0) {
            // Apply brakes
            carData.speed -= carData.brakeStrength;
        } else {
            // Move in reverse
            carData.speed -= carData.acceleration / 2; // Slower acceleration in reverse
        }
    } else {
        // Apply deceleration if no controls are pressed
        if (carData.speed > 0) {
            carData.speed -= carData.deceleration;
        } else if (carData.speed < 0) {
            carData.speed += carData.deceleration;
        }
        
        // Stop completely if speed is very low
        if (Math.abs(carData.speed) < carData.deceleration) {
            carData.speed = 0;
        }
    }
    
    // Apply speed limits
    if (carData.speed > carData.maxSpeed) {
        carData.speed = carData.maxSpeed;
    } else if (carData.speed < -carData.maxSpeed / 2) {
        carData.speed = -carData.maxSpeed / 2; // Reverse is slower
    }
    
    // Apply turning
    if (Math.abs(carData.speed) > 0.01) {
        if (controls.left) {
            car.rotation.y += carData.turnSpeed * Math.sign(carData.speed);
        }
        if (controls.right) {
            car.rotation.y -= carData.turnSpeed * Math.sign(carData.speed);
        }
    }
    
    // Update car direction based on its rotation
    carData.direction.set(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), car.rotation.y);
    
    // Move car forward in the direction it's facing
    car.position.x += carData.direction.x * carData.speed;
    car.position.z += carData.direction.z * carData.speed;
    
    // Keep car on the ground
    car.position.y = 0;
    
    // Update camera position and target
    const cameraOffset = new THREE.Vector3(-carData.direction.x * 10, 5, -carData.direction.z * 10);
    camera.position.copy(car.position).add(cameraOffset);
    camera.lookAt(car.position);
}

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    
    // Update car position and camera
    updateCar();
    
    // Render scene
    renderer.render(scene, camera);
}

// Initialize the game when the window loads
window.onload = init; 