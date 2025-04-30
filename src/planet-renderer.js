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
    
    // Setup scene, camera, renderer
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, container.clientWidth / container.clientHeight, 0.1, 1000);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setSize(container.clientWidth, container.clientHeight);
    this.renderer.setPixelRatio(window.devicePixelRatio);
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
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    this.scene.add(ambientLight);
    
    // Directional light (sun)
    this.sunLight = new THREE.DirectionalLight(0xffffff, 1);
    this.sunLight.position.set(10, 5, 10);
    this.scene.add(this.sunLight);
    
    // Create sun visual
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
    // Create geometry
    const planetGeometry = new THREE.SphereGeometry(2, 64, 64);
    
    // Create dynamic canvas for planet texture
    this.planetCanvas = document.createElement('canvas');
    this.planetCanvas.width = 1024;
    this.planetCanvas.height = 512;
    this.planetCtx = this.planetCanvas.getContext('2d');
    
    // Generate initial texture
    this.updatePlanetTexture();
    
    // Create material with this texture
    this.planetTexture = new THREE.CanvasTexture(this.planetCanvas);
    this.planetMaterial = new THREE.MeshStandardMaterial({
      map: this.planetTexture,
      roughness: 0.7,
      metalness: 0.1,
      bumpMap: this.planetTexture,
      bumpScale: 0.05
    });
    
    // Create mesh
    this.planet = new THREE.Mesh(planetGeometry, this.planetMaterial);
    this.scene.add(this.planet);
    
    // Add atmosphere
    this.createAtmosphere();
  }
  
  createAtmosphere() {
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.ShaderMaterial({
      uniforms: {
        "c": { value: 0.3 },
        "p": { value: 3.0 },
        glowColor: { value: new THREE.Color(0x4ec0fe) },
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
    // Clear canvas
    this.planetCtx.fillStyle = '#8B4513';  // Brown soil
    this.planetCtx.fillRect(0, 0, this.planetCanvas.width, this.planetCanvas.height);
    
    // Get current model data
    const whiteCoverage = this.model.getWhiteDaisyCoverage();
    const blackCoverage = this.model.getBlackDaisyCoverage();
    
    // Draw daisies with point distribution
    this.drawDaisyDistribution(whiteCoverage, blackCoverage);
    
    // Update texture needs
    if (this.planetTexture) {
      this.planetTexture.needsUpdate = true;
    }
  }
  
  drawDaisyDistribution(whiteCoverage, blackCoverage) {
    const width = this.planetCanvas.width;
    const height = this.planetCanvas.height;
    const pointSize = 5;
    const ctx = this.planetCtx;
    
    // Calculate the number of daisies based on coverage percentages
    const totalPoints = 3000; // Adjust based on desired density
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
    
    // Slowly rotate planet
    if (this.planet) {
      this.planet.rotation.y += 0.001;
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
    // Update planet texture based on latest model data
    this.updatePlanetTexture();
    
    // Update sun based on luminosity
    this.updateSun(this.model.getSolarLuminosity());
    
    // Update atmosphere based on temperature
    this.updateAtmosphere(this.model.getPlanetTemperature());
  }
}
