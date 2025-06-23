/**
 * Daisyworld Simulation Model
 * Core implementation of the mathematical model for Daisyworld
 */

/**
 * Represents a single daisy type in the simulation
 */
class Daisy {
  constructor(type, albedo, coverage = 0.0) {
    this.type = type;
    this.albedo = albedo;
    this.coverage = coverage;
    this.localTemp = 0;
  }
  
  getType() {
    return this.type;
  }
  
  getAlbedo() {
    return this.albedo;
  }
  
  getCoverage() {
    return this.coverage;
  }
  
  setCoverage(coverage) {
    this.coverage = Math.max(0, Math.min(1, coverage));
  }
  
  getLocalTemp() {
    return this.localTemp;
  }
  
  setLocalTemp(temp) {
    this.localTemp = temp;
  }
}

/**
 * Represents the planet in the simulation
 */
class Planet {
  constructor(bareSoilAlbedo = 0.5, initialTemp = 295) {
    this.bareSoilAlbedo = bareSoilAlbedo;
    this.temperature = initialTemp;
    this.solarLuminosity = 1.0;
    // Stefan-Boltzmann constant - using original value
    this.stefanBoltzmann = 5.67e-8; 
    this.albedo = bareSoilAlbedo;
  }
  
  getBareSoilAlbedo() {
    return this.bareSoilAlbedo;
  }
  
  getTemperature() {
    return this.temperature;
  }
  
  setTemperature(temp) {
    this.temperature = temp;
  }
  
  getSolarLuminosity() {
    return this.solarLuminosity;
  }
  
  setSolarLuminosity(luminosity) {
    this.solarLuminosity = Math.max(0, luminosity);
  }
  
  getAlbedo() {
    return this.albedo;
  }
  
  setAlbedo(albedo) {
    this.albedo = Math.max(0, Math.min(1, albedo));
  }
  
  /**
   * Calculate temperature based on Stefan-Boltzmann law and current albedo
   */
  calculateTemperature() {
    // Use higher effective solar constant for Daisyworld model to get Earth-like temperatures
    // This represents the simplified model's solar luminosity scaling
    const effectiveSolarConstant = 3000 * this.solarLuminosity; // W/m² (adjusted for model)
    
    // Calculate absorbed radiation (accounting for albedo reflection)
    const absorbedRadiation = effectiveSolarConstant * (1 - this.albedo) / 4;
    
    // Calculate temperature using Stefan-Boltzmann law: σT⁴ = absorbed radiation
    const temperatureK = Math.pow(absorbedRadiation / this.stefanBoltzmann, 0.25);
    
    // Log the calculation for debugging
    console.log(`Temperature calculation: Solar constant=${effectiveSolarConstant}, Albedo=${this.albedo}, Absorbed radiation=${absorbedRadiation}, Temperature=${temperatureK}K (${temperatureK - 273.15}°C)`);
    
    // Ensure temperature stays within reasonable bounds for the model
    if (temperatureK < 250 || temperatureK > 350) {
      console.warn(`Temperature out of expected range: ${temperatureK}K`);
      return Math.max(250, Math.min(350, temperatureK));
    }
    
    // Add gentle damping to prevent rapid temperature changes
    if (this.temperature && Math.abs(temperatureK - this.temperature) > 20) {
      // If change is large, dampen it slightly
      const direction = temperatureK > this.temperature ? 1 : -1;
      return this.temperature + (direction * 15); // Allow up to 15K change per step
    }
    
    return temperatureK;
  }
  
  /**
   * Calculate local temperature for a specific surface type based on its albedo
   * @param {number} surfaceAlbedo - The albedo of the surface type
   */
  calculateLocalTemperature(surfaceAlbedo) {
    // Calculate temperature difference based on albedo difference
    // Simplified linear relationship: q(α - α_p) where q is a constant and α_p is planet albedo
    const q = 20; // Parameter controlling local heating
    const albedoDifference = this.albedo - surfaceAlbedo;
    const tempDifference = q * albedoDifference;
    
    return this.temperature + tempDifference;
  }
}

/**
 * Main Daisyworld model class
 */
class DaisyworldModel {
  constructor(params = {}) {
    // Initialize default parameters
    const {
      solarLuminosity = 1.0,
      bareSoilAlbedo = 0.5,
      initialTemp = 295,
      whiteDaisyInit = 0.3,  // Increased initial coverage
      blackDaisyInit = 0.3,  // Increased initial coverage
      whiteDaisyAlbedo = 0.75,
      blackDaisyAlbedo = 0.25,
      deathRate = 0.2,  // Reduced for better stability
      optimalTemp = 295,
      simulationSpeed = 1
    } = params;
    
    // Create planet
    this.planet = new Planet(bareSoilAlbedo, initialTemp);
    this.planet.setSolarLuminosity(solarLuminosity);
    
    // Create daisy populations
    this.whiteDaisy = new Daisy('white', whiteDaisyAlbedo, whiteDaisyInit);
    this.blackDaisy = new Daisy('black', blackDaisyAlbedo, blackDaisyInit);
    
    // Growth model parameters
    this.deathRate = deathRate;
    this.optimalTemp = optimalTemp;
    this.simulationSpeed = Math.min(0.5, simulationSpeed); // Limit initial speed for stability
    this.running = false;
    this.time = 0;
    
    // Growth parameters - significantly improved for better stability
    this.maxGrowthRate = 1.0; // Increased to ensure healthy growth
    this.minGrowthTemp = 20.0; // Wider growth range (20 degrees below optimal)
    this.maxGrowthTemp = 30.0; // Wider growth range (30 degrees above optimal)
    
    // Regulate temperature effect for better stability
    this.temperatureRegulationFactor = 1.0; // Reduced to avoid extreme temperature swings
    
    // Initialize model state
    this.updatePlanetAlbedo();
    console.log(`Initial planet albedo: ${this.planet.getAlbedo()}`);
    
    // Force initial temperature to be the specified value
    this.planet.setTemperature(initialTemp);
    console.log(`Initial temperature forced to: ${initialTemp}K (${initialTemp - 273.15}°C)`);
    
    // Calculate local temperatures based on this initial temperature
    this.updateLocalTemperatures();
    
    // Setup event handling
    this.timeStepCallbacks = [];
  }
  
  // Getters and setters for model properties
  getSolarLuminosity() {
    return this.planet.getSolarLuminosity();
  }
  
  setSolarLuminosity(luminosity) {
    this.planet.setSolarLuminosity(luminosity);
  }
  
  getBareSoilAlbedo() {
    return this.planet.getBareSoilAlbedo();
  }
  
  getPlanetTemperature() {
    return this.planet.getTemperature();
  }
  
  getWhiteDaisyCoverage() {
    return this.whiteDaisy.getCoverage();
  }
  
  setWhiteDaisyCoverage(coverage) {
    this.whiteDaisy.setCoverage(coverage);
    this.updatePlanetAlbedo();
  }
  
  getBlackDaisyCoverage() {
    return this.blackDaisy.getCoverage();
  }
  
  setBlackDaisyCoverage(coverage) {
    this.blackDaisy.setCoverage(coverage);
    this.updatePlanetAlbedo();
  }
  
  getBareSoilCoverage() {
    return 1.0 - this.whiteDaisy.getCoverage() - this.blackDaisy.getCoverage();
  }
  
  getWhiteDaisyTemperature() {
    return this.whiteDaisy.getLocalTemp();
  }
  
  getBlackDaisyTemperature() {
    return this.blackDaisy.getLocalTemp();
  }
  
  getSimulationSpeed() {
    return this.simulationSpeed;
  }
  
  setSimulationSpeed(speed) {
    this.simulationSpeed = Math.max(0.1, Math.min(10, speed));
  }
  
  isRunning() {
    return this.running;
  }
  
  /**
   * Calculate the weighted average albedo of the planet
   */
  calculatePlanetAlbedo() {
    // Calculate weighted average of albedos based on surface coverage
    const whiteAlbedo = this.whiteDaisy.getAlbedo() * this.whiteDaisy.getCoverage();
    const blackAlbedo = this.blackDaisy.getAlbedo() * this.blackDaisy.getCoverage();
    const soilAlbedo = this.planet.getBareSoilAlbedo() * this.getBareSoilCoverage();
    
    return whiteAlbedo + blackAlbedo + soilAlbedo;
  }
  
  /**
   * Update the planet's albedo based on current daisy populations
   */
  updatePlanetAlbedo() {
    this.planet.setAlbedo(this.calculatePlanetAlbedo());
  }
  
  /**
   * Update the planet's temperature based on current albedo and luminosity
   */
  updatePlanetTemperature() {
    const newTemp = this.planet.calculateTemperature();
    this.planet.setTemperature(newTemp);
    console.log(`Planet temperature updated to ${newTemp}K (${newTemp - 273.15}°C)`);
    return newTemp;
  }
  
  /**
   * Update local temperatures for each daisy type
   */
  updateLocalTemperatures() {
    // Calculate raw local temperatures
    let whiteLocalTemp = this.planet.calculateLocalTemperature(this.whiteDaisy.getAlbedo());
    let blackLocalTemp = this.planet.calculateLocalTemperature(this.blackDaisy.getAlbedo());
    
    // Apply regulation factor to create moderate differences
    // Reduced the effect to prevent extreme local temperatures
    const planetTemp = this.planet.getTemperature();
    
    // Limit the temperature difference to be more realistic
    const maxDiff = 15; // Maximum temperature difference in Kelvin
    
    // Calculate modified local temperatures with limits
    const whiteTempDiff = Math.min(maxDiff, this.temperatureRegulationFactor * (planetTemp - whiteLocalTemp));
    const blackTempDiff = Math.min(maxDiff, this.temperatureRegulationFactor * (blackLocalTemp - planetTemp));
    
    whiteLocalTemp = planetTemp - whiteTempDiff;
    blackLocalTemp = planetTemp + blackTempDiff;
    
    // Ensure local temperatures don't go outside reasonable bounds
    whiteLocalTemp = Math.max(250, Math.min(350, whiteLocalTemp));
    blackLocalTemp = Math.max(250, Math.min(350, blackLocalTemp));
    
    this.whiteDaisy.setLocalTemp(whiteLocalTemp);
    this.blackDaisy.setLocalTemp(blackLocalTemp);
    
    console.log(`Local temperatures - White: ${whiteLocalTemp.toFixed(1)}K (${(whiteLocalTemp-273.15).toFixed(1)}°C), Black: ${blackLocalTemp.toFixed(1)}K (${(blackLocalTemp-273.15).toFixed(1)}°C)`);
  }
  
  /**
   * Calculate daisy growth rate based on temperature
   * Returns a parabolic function with maximum at optimal temperature
   * @param {number} temperature - Temperature in Kelvin
   */
  calculateDaisyGrowthRate(temperature) {
    // Convert to Celsius for easier math
    const tempC = temperature - 273.15;
    const optimalTempC = this.optimalTemp - 273.15;
    
    // Calculate temperature difference from optimal
    const diff = Math.abs(tempC - optimalTempC);
    
    // If outside viable range, no growth
    if (tempC < (optimalTempC - this.minGrowthTemp) || 
        tempC > (optimalTempC + this.maxGrowthTemp)) {
      return 0;
    }
    
    // Use a simpler, more stable parabolic function for growth
    // 1 - (diff/range)² gives a more gradual falloff
    const range = Math.max(this.minGrowthTemp, this.maxGrowthTemp);
    const normalizedDiff = diff / range;
    
    // This gives maximum growth (1.0) at optimal temperature,
    // and gradually decreases to 0 at the edges of the viable range
    return Math.max(0, this.maxGrowthRate * (1 - Math.pow(normalizedDiff, 1.8)));
  }
  
  /**
   * Calculate the change in daisy population for a single time step
   * @param {Daisy} daisy - The daisy population to update
   */
  updateDaisyPopulation(daisy) {
    const currentCoverage = daisy.getCoverage();
    const localTemp = daisy.getLocalTemp();
    let growthRate = this.calculateDaisyGrowthRate(localTemp);
    
    // Apply temperature preference modifier with more gradual effect
    // White daisies prefer cooler temperatures, black daisies prefer warmer temperatures
    if (daisy.getType() === 'white') {
      // White daisies get a growth boost in hotter environments
      const planetTemp = this.planet.getTemperature();
      if (planetTemp > this.optimalTemp) {
        // More gradual boost with temperature difference
        const tempDiff = Math.min(20, planetTemp - this.optimalTemp);
        growthRate *= (1 + (tempDiff / 20)); // Max 2x boost gradually applied
      } else if (planetTemp < this.optimalTemp - 10) {
        // More gradual penalty
        const tempDiff = Math.min(20, this.optimalTemp - 10 - planetTemp);
        growthRate *= (1 - (tempDiff / 40)); // Min 0.5x penalty gradually applied
      }
    } else if (daisy.getType() === 'black') {
      // Black daisies get a growth boost in colder environments
      const planetTemp = this.planet.getTemperature();
      if (planetTemp < this.optimalTemp) {
        // More gradual boost with temperature difference
        const tempDiff = Math.min(20, this.optimalTemp - planetTemp);
        growthRate *= (1 + (tempDiff / 20)); // Max 2x boost gradually applied
      } else if (planetTemp > this.optimalTemp + 10) {
        // More gradual penalty
        const tempDiff = Math.min(20, planetTemp - (this.optimalTemp + 10));
        growthRate *= (1 - (tempDiff / 40)); // Min 0.5x penalty gradually applied
      }
    }
    
    // Strong protection for small populations - add a significant growth factor
    // This ensures daisies don't die out and actively recover when population is low
    if (currentCoverage < 0.2) {  // Protect populations below 20%
      // Add a stronger boost for low populations to prevent extinction
      const boostFactor = 1 + (0.2 - currentCoverage) * 20; // Up to 5x boost at very low populations
      growthRate *= boostFactor;
      console.log(`${daisy.getType()} daisy boost: ${boostFactor.toFixed(2)}x (low population protection)`);
    }
    
    // Calculate new growth: growth rate * current coverage * available area
    const availableArea = this.getBareSoilCoverage();
    const newGrowth = growthRate * currentCoverage * availableArea;
    
    // Calculate deaths with a stronger guaranteed survival rate
    // This significantly reduces extinction risk
    const survivalFactor = Math.max(0.9, 1 - this.deathRate); // At least 90% survival
    const deaths = (1 - survivalFactor) * currentCoverage;
    
    // Update coverage with limits to prevent extreme changes in a single step
    let newCoverage = currentCoverage + newGrowth - deaths;
    
    // Limit maximum change per step for stability
    const maxChangePerStep = 0.05;
    if (newCoverage > currentCoverage + maxChangePerStep) {
      newCoverage = currentCoverage + maxChangePerStep;
    } else if (newCoverage < currentCoverage - maxChangePerStep) {
      newCoverage = currentCoverage - maxChangePerStep;
    }
    
    // Enforce a higher minimum population for stability
    if (currentCoverage > 0 && newCoverage < 0.1) {
      newCoverage = 0.1; // Minimum 10% coverage if population existed
      console.log(`${daisy.getType()} daisy population saved from extinction (forced to 10%)`);
    }
    
    daisy.setCoverage(newCoverage);
  }
  
  /**
   * Execute a single time step in the simulation
   */
  step() {
    // Save current state for change calculation
    const prevWhiteCoverage = this.whiteDaisy.getCoverage();
    const prevBlackCoverage = this.blackDaisy.getCoverage();
    const prevTemp = this.planet.getTemperature();
    
    // Update daisy populations
    this.updateDaisyPopulation(this.whiteDaisy);
    this.updateDaisyPopulation(this.blackDaisy);
    
    // Update planet properties based on new populations
    this.updatePlanetAlbedo();
    this.updatePlanetTemperature();
    this.updateLocalTemperatures();
    
    // Update time
    this.time += 1;
    
    // Notify listeners
    this.notifyTimeStep({
      time: this.time,
      temperature: this.planet.getTemperature(),
      whiteDaisyCoverage: this.whiteDaisy.getCoverage(),
      blackDaisyCoverage: this.blackDaisy.getCoverage(),
      planetAlbedo: this.planet.getAlbedo(),
      solarLuminosity: this.planet.getSolarLuminosity(),
      whiteDaisyTemp: this.whiteDaisy.getLocalTemp(),
      blackDaisyTemp: this.blackDaisy.getLocalTemp()
    });
    
    // Return changes for analysis
    return {
      whiteCoverageChange: this.whiteDaisy.getCoverage() - prevWhiteCoverage,
      blackCoverageChange: this.blackDaisy.getCoverage() - prevBlackCoverage,
      temperatureChange: this.planet.getTemperature() - prevTemp
    };
  }
  
  /**
   * Start running the simulation
   */
  start() {
    if (!this.running) {
      this.running = true;
      this.simulationLoop();
    }
  }
  
  /**
   * Pause the simulation
   */
  pause() {
    this.running = false;
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
  }
  
  /**
   * Reset the simulation to initial values
   */
  reset(params = {}) {
    this.pause();
    
    // Copy all properties from a new model instance with the given parameters
    const newModel = new DaisyworldModel(params);
    
    // Copy all properties
    this.planet = newModel.planet;
    this.whiteDaisy = newModel.whiteDaisy;
    this.blackDaisy = newModel.blackDaisy;
    this.deathRate = newModel.deathRate;
    this.optimalTemp = newModel.optimalTemp;
    this.simulationSpeed = newModel.simulationSpeed;
    this.running = false;
    this.time = 0;
    this.maxGrowthRate = newModel.maxGrowthRate;
    this.minGrowthTemp = newModel.minGrowthTemp;
    this.maxGrowthTemp = newModel.maxGrowthTemp;
    this.temperatureRegulationFactor = newModel.temperatureRegulationFactor;
    
    // Initialize state with the same pattern as constructor
    this.updatePlanetAlbedo();
    console.log(`Reset: planet albedo: ${this.planet.getAlbedo()}`);
    
    // Force initial temperature to the optimal value
    const initialTemp = params.initialTemp || this.optimalTemp;
    this.planet.setTemperature(initialTemp);
    console.log(`Reset: temperature forced to: ${initialTemp}K (${initialTemp - 273.15}°C)`);
    
    // Calculate local temperatures
    this.updateLocalTemperatures();
    
    // Keep existing callbacks
  }
  
  /**
   * Main simulation loop
   */
  simulationLoop() {
    if (!this.running) return;
    
    // Run simulation at specified speed, but limit it to avoid instability
    // For fractional speeds below 1.0, we'll use a probability approach
    const stepsPerFrame = Math.floor(this.simulationSpeed);
    const fractionalPart = this.simulationSpeed - stepsPerFrame;
    
    // Always do the whole steps
    for (let i = 0; i < stepsPerFrame; i++) {
      this.step();
    }
    
    // Do one more step with probability equal to the fractional part
    if (Math.random() < fractionalPart) {
      this.step();
    }
    
    // Schedule next frame with optimized timing to prevent jerkiness
    const delay = this.simulationSpeed > 5 ? 32 : this.simulationSpeed > 2 ? 16 : 0;
    setTimeout(() => {
      this.animationFrame = requestAnimationFrame(() => this.simulationLoop());
    }, delay);
  }
  
  /**
   * Register a callback for time step events
   * @param {Function} callback - Function to call on each time step
   */
  onTimeStep(callback) {
    this.timeStepCallbacks.push(callback);
    return () => {
      // Return function to remove callback
      const index = this.timeStepCallbacks.indexOf(callback);
      if (index !== -1) {
        this.timeStepCallbacks.splice(index, 1);
      }
    };
  }
  
  /**
   * Notify all registered callbacks with time step data
   * @param {Object} data - Time step data
   */
  notifyTimeStep(data) {
    console.log(`Notifying ${this.timeStepCallbacks.length} time step callbacks with data:`, data);
    this.timeStepCallbacks.forEach(callback => callback(data));
  }
}

// Export model classes for ES modules
export {
  DaisyworldModel,
  Planet,
  Daisy
};