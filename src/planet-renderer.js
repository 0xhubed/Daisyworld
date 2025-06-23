/**
 * 3D Planet Renderer for Daisyworld
 * Uses Three.js to create an interactive 3D visualization of the planet
 */

import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export class PlanetRenderer {
  constructor(container, model) {
    this.container = container;
    this.model = model;
    
    // Performance optimization variables
    this.lastTextureUpdate = 0;
    this.textureUpdateInterval = 400; // Update texture every 400ms for much better performance
    this.skipFrames = 0;
    this.maxSkipFrames = 3; // Skip 3 out of 4 update calls
    
    // Setup scene, camera, renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true, 
      alpha: true,
      powerPreference: "high-performance" // Optimize for performance
    });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)); // Limit pixel ratio for performance
    this.container.appendChild(this.renderer.domElement);
    
    // Setup lighting
    this.setupLights();
    
    // Create planet
    this.createPlanet();
    
    // Create stars background
    this.createStars();
    
    // Add controls
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.05;
    this.controls.rotateSpeed = 0.5;
    this.controls.minDistance = 4;
    this.controls.maxDistance = 20;
    
    // Position camera
    this.camera.position.z = 5;
    
    // Handle resize
    window.addEventListener('resize', () => this.resize());
    
    // Start animation loop
    this.animate();
  }
  
  setupLights() {
    // Enhanced ambient light for better visibility
    const ambientLight = new THREE.AmbientLight(0x404040, 0.8);
    this.scene.add(ambientLight);
    
    // Main directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1.2);
    this.sunLight.position.set(10, 5, 10);
    this.sunLight.castShadow = true;
    this.sunLight.shadow.mapSize.width = 2048;
    this.sunLight.shadow.mapSize.height = 2048;
    this.scene.add(this.sunLight);
    
    // Add rim light for dramatic effect
    const rimLight = new THREE.DirectionalLight(0x4080ff, 0.3);
    rimLight.position.set(-5, 2, -5);
    this.scene.add(rimLight);
    
    // Create enhanced sun visual
    this.createSun();
  }
  
  createSun() {
    const sunGeometry = new THREE.SphereGeometry(0.5, 32, 32);
    const sunMaterial = new THREE.MeshBasicMaterial({ 
      color: 0xffdd00,
      emissive: 0xffdd00,
      emissiveIntensity: 1
    });
    
    this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
    this.sun.position.copy(this.sunLight.position).normalize().multiplyScalar(15);
    this.scene.add(this.sun);
    
    // Add sun glow
    const sunGlowGeometry = new THREE.SphereGeometry(0.8, 32, 32);
    const sunGlowMaterial = new THREE.ShaderMaterial({
      uniforms: {
        "c": { value: 0.2 },
        "p": { value: 5.0 },
        glowColor: { value: new THREE.Color(0xffdd00) },
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normal);
          vec3 vNormel = normalize(viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    this.sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    this.sunGlow.position.copy(this.sun.position);
    this.scene.add(this.sunGlow);
  }
  
  createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 2000;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 100;
      positions[i+1] = (Math.random() - 0.5) * 100;
      positions[i+2] = (Math.random() - 0.5) * 100;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    
    const starMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    this.stars = new THREE.Points(starGeometry, starMaterial);
    this.scene.add(this.stars);
  }
  
  createPlanet() {
    // Enhanced geometry for better sphere appearance
    const planetGeometry = new THREE.SphereGeometry(2, 80, 80);
    
    // Higher resolution canvas for better detail
    this.planetCanvas = document.createElement('canvas');
    this.planetCanvas.width = 1024;
    this.planetCanvas.height = 512;
    this.planetCtx = this.planetCanvas.getContext('2d');
    
    // Generate initial texture
    this.updatePlanetTexture();
    
    // Create normal map for surface detail
    this.createNormalMap();
    
    // Create enhanced material with realistic properties
    this.planetTexture = new THREE.CanvasTexture(this.planetCanvas);
    this.planetTexture.wrapS = THREE.RepeatWrapping;
    this.planetTexture.wrapT = THREE.RepeatWrapping;
    this.planetTexture.minFilter = THREE.LinearFilter;
    this.planetTexture.magFilter = THREE.LinearFilter;
    
    this.planetMaterial = new THREE.MeshStandardMaterial({
      map: this.planetTexture,
      normalMap: this.normalTexture,
      normalScale: new THREE.Vector2(0.3, 0.3),
      roughness: 0.9,
      metalness: 0.0,
      bumpMap: this.planetTexture,
      bumpScale: 0.05,
      envMapIntensity: 0.3
    });
    
    // Create mesh with shadow casting
    this.planet = new THREE.Mesh(planetGeometry, this.planetMaterial);
    this.planet.castShadow = true;
    this.planet.receiveShadow = true;
    this.scene.add(this.planet);
    
    // Add enhanced atmosphere
    this.createAtmosphere();
    
    // Add subtle cloud layer
    this.createCloudLayer();
  }
  
  createNormalMap() {
    // Create a normal map canvas for surface detail
    const normalCanvas = document.createElement('canvas');
    normalCanvas.width = 512;
    normalCanvas.height = 256;
    const normalCtx = normalCanvas.getContext('2d');
    
    // Generate procedural normal map for terrain detail
    const imageData = normalCtx.createImageData(normalCanvas.width, normalCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % normalCanvas.width;
      const y = Math.floor((i / 4) / normalCanvas.width);
      
      // Create subtle terrain variations using noise
      const noise = Math.sin(x * 0.1) * Math.cos(y * 0.1) * 0.5 + 0.5;
      const intensity = noise * 30 + 127;
      
      data[i] = intensity;     // R
      data[i + 1] = intensity; // G  
      data[i + 2] = 255;       // B (pointing up)
      data[i + 3] = 255;       // A
    }
    
    normalCtx.putImageData(imageData, 0, 0);
    this.normalTexture = new THREE.CanvasTexture(normalCanvas);
  }
  
  createCloudLayer() {
    // Create subtle cloud layer for atmosphere
    const cloudGeometry = new THREE.SphereGeometry(2.05, 32, 32);
    const cloudCanvas = document.createElement('canvas');
    cloudCanvas.width = 512;
    cloudCanvas.height = 256;
    const cloudCtx = cloudCanvas.getContext('2d');
    
    // Generate cloud texture
    cloudCtx.fillStyle = 'rgba(255, 255, 255, 0)';
    cloudCtx.fillRect(0, 0, cloudCanvas.width, cloudCanvas.height);
    
    // Add some cloud patches
    for (let i = 0; i < 20; i++) {
      const x = Math.random() * cloudCanvas.width;
      const y = Math.random() * cloudCanvas.height;
      const radius = Math.random() * 30 + 10;
      const opacity = Math.random() * 0.3 + 0.1;
      
      const gradient = cloudCtx.createRadialGradient(x, y, 0, x, y, radius);
      gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
      gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      
      cloudCtx.fillStyle = gradient;
      cloudCtx.beginPath();
      cloudCtx.arc(x, y, radius, 0, Math.PI * 2);
      cloudCtx.fill();
    }
    
    const cloudTexture = new THREE.CanvasTexture(cloudCanvas);
    const cloudMaterial = new THREE.MeshLambertMaterial({
      map: cloudTexture,
      transparent: true,
      opacity: 0.4
    });
    
    this.clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
    this.scene.add(this.clouds);
  }
  
  createAtmosphere() {
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        "c": { value: 0.3 },
        "p": { value: 3.0 },
        glowColor: { value: new THREE.Color(0x88ccff) },
        viewVector: { value: new THREE.Vector3() }
      },
      vertexShader: `
        uniform vec3 viewVector;
        uniform float c;
        uniform float p;
        varying float intensity;
        void main() {
          vec3 vNormal = normalize(normal);
          vec3 vNormel = normalize(viewVector);
          intensity = pow(c - dot(vNormal, vNormel), p);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        varying float intensity;
        void main() {
          vec3 glow = glowColor * intensity;
          gl_FragColor = vec4(glow, 1.0);
        }
      `,
      side: THREE.BackSide,
      blending: THREE.AdditiveBlending,
      transparent: true
    });
    
    this.atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    this.scene.add(this.atmosphere);
  }
  
  updatePlanetTexture() {
    // Create more realistic base terrain
    this.planetCtx.fillStyle = '#4a3728';  // Darker, richer soil
    this.planetCtx.fillRect(0, 0, this.planetCanvas.width, this.planetCanvas.height);
    
    // Add terrain texture variation
    this.addTerrainTexture();
    
    // Get current model data - get fresh data each time
    const whiteCoverage = this.model.getWhiteDaisyCoverage();
    const blackCoverage = this.model.getBlackDaisyCoverage();
    
    console.log('Updating planet texture with:', {
      white: whiteCoverage,
      black: blackCoverage,
      bare: 1 - whiteCoverage - blackCoverage
    });
    
    // Draw enhanced daisies with realistic distribution
    this.drawEnhancedDaisyDistribution(whiteCoverage, blackCoverage);
    
    // Always force texture update
    if (this.planetTexture) {
      this.planetTexture.needsUpdate = true;
    }
  }
  
  addTerrainTexture() {
    // Add subtle terrain variations
    const imageData = this.planetCtx.createImageData(this.planetCanvas.width, this.planetCanvas.height);
    const data = imageData.data;
    
    for (let i = 0; i < data.length; i += 4) {
      const x = (i / 4) % this.planetCanvas.width;
      const y = Math.floor((i / 4) / this.planetCanvas.width);
      
      // Base soil color
      let r = 74, g = 55, b = 40;
      
      // Add noise for terrain variation
      const noise = Math.sin(x * 0.05) * Math.cos(y * 0.05) * 
                   Math.sin(x * 0.02) * Math.cos(y * 0.02);
      const variation = noise * 20;
      
      r = Math.max(0, Math.min(255, r + variation));
      g = Math.max(0, Math.min(255, g + variation));
      b = Math.max(0, Math.min(255, b + variation));
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
      data[i + 3] = 255;
    }
    
    this.planetCtx.putImageData(imageData, 0, 0);
  }
  
  drawEnhancedDaisyDistribution(whiteCoverage, blackCoverage) {
    const width = this.planetCanvas.width;
    const height = this.planetCanvas.height;
    const ctx = this.planetCtx;
    
    // Optimized number of daisies for better performance
    const totalPoints = 2000; // Reduced from 5000 for much better performance
    const whitePoints = Math.floor(totalPoints * whiteCoverage);
    const blackPoints = Math.floor(totalPoints * blackCoverage);
    
    // Create clusters for more realistic growth patterns
    this.drawDaisyClusters(whitePoints, 'white');
    this.drawDaisyClusters(blackPoints, 'black');
  }
  
  drawDaisyClusters(count, type) {
    const clusterCount = Math.max(1, Math.floor(count / 100)); // Create clusters
    const daisiesPerCluster = Math.floor(count / clusterCount);
    
    for (let cluster = 0; cluster < clusterCount; cluster++) {
      // Random cluster center
      const centerX = Math.random() * this.planetCanvas.width;
      const centerY = Math.random() * this.planetCanvas.height;
      const clusterRadius = 30 + Math.random() * 50;
      
      // Draw daisies in cluster
      for (let i = 0; i < daisiesPerCluster; i++) {
        // Random point within cluster radius
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.random() * clusterRadius;
        
        const x = centerX + Math.cos(angle) * distance;
        const y = centerY + Math.sin(angle) * distance;
        
        // Only draw if within canvas bounds
        if (x >= 0 && x < this.planetCanvas.width && y >= 0 && y < this.planetCanvas.height) {
          const size = 3 + Math.random() * 4; // Variable daisy sizes
          this.drawRealisticDaisy(x, y, size, type);
        }
      }
    }
  }
  
  drawDaisyDistribution(whiteCoverage, blackCoverage) {
    const width = this.planetCanvas.width;
    const height = this.planetCanvas.height;
    const pointSize = 6; // Balanced size for performance
    const ctx = this.planetCtx;
    
    // Optimized number of daisies for performance
    const totalPoints = 4000; // Balanced density for performance
    const whitePoints = Math.floor(totalPoints * whiteCoverage);
    const blackPoints = Math.floor(totalPoints * blackCoverage);
    
    // Function to distribute points evenly across the texture
    const distributePoints = (count, drawFn) => {
      // Use golden ratio to get even distribution
      const phi = (1 + Math.sqrt(5)) / 2;
      
      for (let i = 0; i < count; i++) {
        // Use golden ratio for good distribution
        const y = i / count;
        const phi = Math.PI * (3 - Math.sqrt(5)); // golden angle
        const radius = Math.sqrt(y);
        const theta = phi * i;
        
        // Convert to x/y coordinates for spherical mapping
        const u = (0.5 + Math.cos(theta) * radius * 0.5) * width;
        const v = (0.5 + Math.sin(theta) * radius * 0.5) * height;
        
        drawFn(u, v, pointSize * (0.7 + Math.random() * 0.6));
      }
    };
    
    // Draw white daisies
    distributePoints(whitePoints, (x, y, size) => {
      this.drawDaisy(ctx, x, y, size, '#FFFFFF');
    });
    
    // Draw black daisies
    distributePoints(blackPoints, (x, y, size) => {
      this.drawDaisy(ctx, x, y, size, '#202020');
    });
  }
  
  drawRealisticDaisy(x, y, size, type) {
    const ctx = this.planetCtx;
    const petalCount = 8;
    
    // Determine colors based on type
    let petalColor, centerColor;
    if (type === 'white') {
      petalColor = '#f8f8f8';
      centerColor = '#ffeb3b';
    } else {
      petalColor = '#1a1a1a';
      centerColor = '#8b4513';
    }
    
    // Draw shadow/base first
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = '#333333';
    ctx.beginPath();
    ctx.arc(x + 1, y + 1, size * 0.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1.0;
    
    // Draw outer petals (larger, darker)
    ctx.fillStyle = type === 'white' ? '#e0e0e0' : '#0f0f0f';
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petalX = x + Math.cos(angle) * size * 0.8;
      const petalY = y + Math.sin(angle) * size * 0.8;
      
      ctx.beginPath();
      ctx.ellipse(
        petalX, petalY,
        size * 0.6, size * 0.4,
        angle,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw inner petals (main color)
    ctx.fillStyle = petalColor;
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petalX = x + Math.cos(angle) * size * 0.7;
      const petalY = y + Math.sin(angle) * size * 0.7;
      
      ctx.beginPath();
      ctx.ellipse(
        petalX, petalY,
        size * 0.5, size * 0.3,
        angle,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw center of daisy with gradient effect
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.4);
    gradient.addColorStop(0, centerColor);
    gradient.addColorStop(1, type === 'white' ? '#ff9800' : '#654321');
    
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Add tiny highlight
    ctx.fillStyle = type === 'white' ? '#ffffff' : '#666666';
    ctx.beginPath();
    ctx.arc(x - size * 0.1, y - size * 0.1, size * 0.1, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawDaisy(ctx, x, y, size, petalColor) {
    const petalCount = 8;
    
    // Draw petals
    ctx.fillStyle = petalColor;
    
    for (let i = 0; i < petalCount; i++) {
      const angle = (i / petalCount) * Math.PI * 2;
      const petalX = x + Math.cos(angle) * size * 0.7;
      const petalY = y + Math.sin(angle) * size * 0.7;
      
      ctx.beginPath();
      ctx.ellipse(
        petalX, petalY,
        size / 2, size / 3,
        angle,
        0, Math.PI * 2
      );
      ctx.fill();
    }
    
    // Draw center of daisy
    ctx.fillStyle = '#FFDD00';
    ctx.beginPath();
    ctx.arc(x, y, size / 3, 0, Math.PI * 2);
    ctx.fill();
  }
  
  updateSun(luminosity) {
    // Update sun color and intensity based on luminosity
    let sunColor;
    
    if (luminosity < 0.8) {
      // Cooler, redder sun
      const redFactor = Math.floor(255);
      const greenFactor = Math.floor(165 + 90 * luminosity);
      sunColor = new THREE.Color(`rgb(${redFactor}, ${greenFactor}, 0)`);
    } else if (luminosity > 1.2) {
      // Hotter, whiter sun
      const blueFactor = Math.floor(200 + 55 * (luminosity - 1.2));
      sunColor = new THREE.Color(`rgb(255, 255, ${blueFactor})`);
    } else {
      // Normal yellow sun
      sunColor = new THREE.Color(0xffdd00);
    }
    
    // Update sun materials
    this.sun.material.color = sunColor;
    this.sun.material.emissive = sunColor;
    this.sunGlow.material.uniforms.glowColor.value = sunColor;
    
    // Update light intensity
    this.sunLight.intensity = luminosity;
    
    // Scale sun size with luminosity
    const sunScale = 0.5 * (0.7 + luminosity * 0.3);
    this.sun.scale.set(sunScale, sunScale, sunScale);
    this.sunGlow.scale.set(sunScale + 0.3, sunScale + 0.3, sunScale + 0.3);
  }
  
  updateAtmosphere(temperature) {
    // Get temperature in Celsius
    const tempC = temperature - 273.15;
    
    // Change atmosphere color based on temperature
    let atmosphereColor;
    
    if (tempC > 30) {
      // Hot - redder atmosphere
      atmosphereColor = new THREE.Color(0xff7f50);
    } else if (tempC < 5) {
      // Cold - bluer atmosphere
      atmosphereColor = new THREE.Color(0x4169e1);
    } else {
      // Normal - blue-green atmosphere
      atmosphereColor = new THREE.Color(0x4ec0fe);
    }
    
    // Update atmosphere color
    this.atmosphere.material.uniforms.glowColor.value = atmosphereColor;
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Update uniforms for glow effects
    if (this.atmosphere) {
      this.atmosphere.material.uniforms.viewVector.value = 
        new THREE.Vector3().subVectors(this.camera.position, this.atmosphere.position);
    }
    
    if (this.sunGlow) {
      this.sunGlow.material.uniforms.viewVector.value = 
        new THREE.Vector3().subVectors(this.camera.position, this.sunGlow.position);
    }
    
    // Slowly rotate planet and clouds at different speeds for realism
    if (this.planet) {
      this.planet.rotation.y += 0.001;
    }
    
    if (this.clouds) {
      this.clouds.rotation.y += 0.0008; // Slightly slower cloud movement
    }
    
    // Update controls
    this.controls.update();
    
    // Render scene
    this.renderer.render(this.scene, this.camera);
  }
  
  resize() {
    // Handle container resize
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  update(modelData) {
    // Skip most update calls for better performance
    this.skipFrames++;
    if (this.skipFrames < this.maxSkipFrames) {
      return;
    }
    this.skipFrames = 0;
    
    const now = Date.now();
    
    // Throttle texture updates for performance
    if (now - this.lastTextureUpdate > this.textureUpdateInterval) {
      this.updatePlanetTexture();
      this.lastTextureUpdate = now;
      
      // Force the texture to update
      if (this.planetTexture) {
        this.planetTexture.needsUpdate = true;
      }
      
      // Update sun and atmosphere at the same interval to reduce redundant calculations
      this.updateSun(this.model.getSolarLuminosity());
      this.updateAtmosphere(this.model.getPlanetTemperature());
    }
  }
}
