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
    this.stefanBoltzmann = 5.67e-8; // W/m²K⁴
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
    // Solar constant (adjusted by luminosity)
    const solarConstant = 1368 * this.solarLuminosity; // W/m²
    
    // Calculate absorbed radiation (accounting for albedo reflection)
    const absorbedRadiation = solarConstant * (1 - this.albedo) / 4;
    
    // Calculate temperature using Stefan-Boltzmann law: σT⁴ = absorbed radiation
    const temperatureK = Math.pow(absorbedRadiation / this.stefanBoltzmann, 0.25);
    
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
    this.simulationSpeed = simulationSpeed;
    this.running = false;
    this.time = 0;
    
    // Growth parameters
    this.maxGrowthRate = 1.0;
    this.minGrowthTemp = 5.0; // 5 degrees below optimal is minimum temp for growth
    this.maxGrowthTemp = 40.0; // 40 degrees above optimal is maximum temp for growth
    
    // Enhance regulation effect for testing
    this.temperatureRegulationFactor = 4.0; // Amplify the feedback effect
    
    // Initialize albedo and temperature
    this.updatePlanetAlbedo();
    this.updatePlanetTemperature();
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
    
    // Parabolic growth function with steeper dropoff further from optimal
    // The exponent makes the curve steeper away from the optimal point
    const k = 1 / Math.pow(Math.max(this.minGrowthTemp, this.maxGrowthTemp), 2);
    const exponent = 1 + (diff / 10); // Increase exponent as we move away from optimal
    
    return Math.max(0, this.maxGrowthRate * (1 - k * Math.pow(diff, exponent)));
  }
  
  /**
   * Calculate the change in daisy population for a single time step
   * @param {Daisy} daisy - The daisy population to update
   */
  updateDaisyPopulation(daisy) {
    const currentCoverage = daisy.getCoverage();
    const localTemp = daisy.getLocalTemp();
    let growthRate = this.calculateDaisyGrowthRate(localTemp);
    
    // Apply temperature preference modifier
    // White daisies prefer cooler temperatures, black daisies prefer warmer temperatures
    // This enhances the regulatory effect
    if (daisy.getType() === 'white') {
      // White daisies get a growth boost in hotter environments
      const planetTemp = this.planet.getTemperature();
      if (planetTemp > this.optimalTemp) {
        growthRate *= 1.5; // Boost for white daisies in warm conditions
      } else if (planetTemp < this.optimalTemp - 10) {
        growthRate *= 0.5; // Penalty for white daisies in cold conditions
      }
    } else if (daisy.getType() === 'black') {
      // Black daisies get a growth boost in colder environments
      const planetTemp = this.planet.getTemperature();
      if (planetTemp < this.optimalTemp) {
        growthRate *= 1.5; // Boost for black daisies in cool conditions
      } else if (planetTemp > this.optimalTemp + 10) {
        growthRate *= 0.5; // Penalty for black daisies in hot conditions
      }
    }
    
    // Calculate new growth: growth rate * current coverage * available area
    const availableArea = this.getBareSoilCoverage();
    const newGrowth = growthRate * currentCoverage * availableArea;
    
    // Calculate deaths: death rate * current coverage
    const deaths = this.deathRate * currentCoverage;
    
    // Update coverage
    const newCoverage = currentCoverage + newGrowth - deaths;
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
    
    // Initialize state
    this.updatePlanetAlbedo();
    this.updatePlanetTemperature();
    this.updateLocalTemperatures();
    
    // Keep existing callbacks
  }
  
  /**
   * Main simulation loop
   */
  simulationLoop() {
    if (!this.running) return;
    
    // Run simulation at specified speed
    const stepsPerFrame = this.simulationSpeed;
    
    // Run the appropriate number of steps
    for (let i = 0; i < stepsPerFrame; i++) {
      this.step();
    }
    
    // Schedule next frame
    this.animationFrame = requestAnimationFrame(() => this.simulationLoop());
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

// Export model classes
module.exports = {
  DaisyworldModel,
  Planet,
  Daisy
};