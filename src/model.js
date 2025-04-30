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
    // Solar constant for Earth-like temperatures
    const solarConstant = 1368 * this.solarLuminosity; // W/m² (standard solar constant)
    
    // Calculate absorbed radiation (accounting for albedo reflection)
    const absorbedRadiation = solarConstant * (1 - this.albedo) / 4;
    
    // Calculate temperature using Stefan-Boltzmann law: σT⁴ = absorbed radiation
    const temperatureK = Math.pow(absorbedRadiation / this.stefanBoltzmann, 0.25);
    
    // Log the calculation for debugging
    console.log(`Temperature calculation: Solar constant=${solarConstant}, Albedo=${this.albedo}, Absorbed radiation=${absorbedRadiation}, Temperature=${temperatureK}K (${temperatureK - 273.15}°C)`);
    
    // Add a sanity check to prevent extreme temperatures
    if (temperatureK < 100 || temperatureK > 400) {
      console.warn(`Temperature out of expected range: ${temperatureK}K`);
      // Return a default temperature in the valid range
      return 295; // ~22°C
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
      whiteDaisyInit = 0.2,
      blackDaisyInit = 0.2,
      whiteDaisyAlbedo = 0.75,
      blackDaisyAlbedo = 0.25,
      deathRate = 0.3,
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
    
    // Growth parameters - adjust for better stability
    this.maxGrowthRate = 0.8; // Reduced from 1.0 for stability
    this.minGrowthTemp = 5.0; // 5 degrees below optimal is minimum temp for growth
    this.maxGrowthTemp = 40.0; // 40 degrees above optimal is maximum temp for growth
    
    // Regulate temperature effect for better stability
    this.temperatureRegulationFactor = 2.0; // Reduced from 4.0 to avoid extreme swings
    
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
    
    // Apply regulation factor to amplify differences (for testing)
    const planetTemp = this.planet.getTemperature();
    whiteLocalTemp = planetTemp - (this.temperatureRegulationFactor * (planetTemp - whiteLocalTemp));
    blackLocalTemp = planetTemp + (this.temperatureRegulationFactor * (blackLocalTemp - planetTemp));
    
    this.whiteDaisy.setLocalTemp(whiteLocalTemp);
    this.blackDaisy.setLocalTemp(blackLocalTemp);
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
    
    // Ensure small populations can still grow - add a minimum growth factor
    // This ensures daisies don't completely die out
    if (currentCoverage < 0.05 && growthRate > 0) {
      // Add a small boost for very low populations to prevent extinction
      growthRate *= (1 + (0.05 - currentCoverage) * 10);
    }
    
    // Calculate new growth: growth rate * current coverage * available area
    const availableArea = this.getBareSoilCoverage();
    const newGrowth = growthRate * currentCoverage * availableArea;
    
    // Calculate deaths with a minimum guaranteed survival rate
    // This prevents complete extinction
    const survivalFactor = Math.max(0.7, 1 - this.deathRate); // At least 70% survival
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
    
    // Ensure a minimum population if there was any to begin with
    if (currentCoverage > 0 && newCoverage < 0.01) {
      newCoverage = 0.01; // Minimum 1% coverage if population existed
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
    
    // Schedule next frame with a slight delay for very fast speeds to allow UI updates
    setTimeout(() => {
      this.animationFrame = requestAnimationFrame(() => this.simulationLoop());
    }, this.simulationSpeed > 3 ? 16 : 0); // Add a small delay for high speeds
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
    this.timeStepCallbacks.forEach(callback => callback(data));
  }
}

// Export model classes for ES modules
export {
  DaisyworldModel,
  Planet,
  Daisy
};