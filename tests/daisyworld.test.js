/**
 * Daisyworld Simulation Tests
 */

// Import modules to test (update paths when implementation is ready)
// const { DaisyworldModel, Planet, Daisy } = require('../src/model');

describe('Daisyworld Model', () => {
  // Test model initialization
  describe('Initialization', () => {
    test('should initialize with default parameters', () => {
      const model = new DaisyworldModel();
      
      // Check default planet properties
      expect(model.getSolarLuminosity()).toBeCloseTo(1.0);
      expect(model.getBareSoilAlbedo()).toBeCloseTo(0.5);
      expect(model.getPlanetTemperature()).toBeCloseTo(295);
      
      // Check default daisy population
      expect(model.getWhiteDaisyCoverage()).toBeCloseTo(0.2);
      expect(model.getBlackDaisyCoverage()).toBeCloseTo(0.2);
      expect(model.getBareSoilCoverage()).toBeCloseTo(0.6);
    });
    
    test('should initialize with custom parameters', () => {
      const params = {
        solarLuminosity: 1.2,
        bareSoilAlbedo: 0.4,
        initialTemp: 290,
        whiteDaisyInit: 0.3,
        blackDaisyInit: 0.1
      };
      
      const model = new DaisyworldModel(params);
      
      expect(model.getSolarLuminosity()).toBeCloseTo(1.2);
      expect(model.getBareSoilAlbedo()).toBeCloseTo(0.4);
      expect(model.getPlanetTemperature()).toBeCloseTo(290);
      expect(model.getWhiteDaisyCoverage()).toBeCloseTo(0.3);
      expect(model.getBlackDaisyCoverage()).toBeCloseTo(0.1);
      expect(model.getBareSoilCoverage()).toBeCloseTo(0.6);
    });
  });
  
  // Test temperature calculations
  describe('Temperature Calculations', () => {
    test('should calculate correct planet albedo', () => {
      const model = new DaisyworldModel();
      
      // With default values: 20% white (0.75), 20% black (0.25), 60% bare (0.5)
      // Expected albedo = 0.2*0.75 + 0.2*0.25 + 0.6*0.5 = 0.15 + 0.05 + 0.3 = 0.5
      expect(model.calculatePlanetAlbedo()).toBeCloseTo(0.5);
      
      // Change populations and test again
      model.setWhiteDaisyCoverage(0.4);
      model.setBlackDaisyCoverage(0.4);
      // Expected albedo = 0.4*0.75 + 0.4*0.25 + 0.2*0.5 = 0.3 + 0.1 + 0.1 = 0.5
      expect(model.calculatePlanetAlbedo()).toBeCloseTo(0.5);
      
      // One more test with different ratios
      model.setWhiteDaisyCoverage(0.6);
      model.setBlackDaisyCoverage(0.2);
      // Expected albedo = 0.6*0.75 + 0.2*0.25 + 0.2*0.5 = 0.45 + 0.05 + 0.1 = 0.6
      expect(model.calculatePlanetAlbedo()).toBeCloseTo(0.6);
    });
    
    test('should calculate correct local temperatures for daisies', () => {
      const model = new DaisyworldModel();
      
      // For a default model, check that white daisies are cooler and black daisies are warmer
      const planetTemp = model.getPlanetTemperature();
      expect(model.getWhiteDaisyTemperature()).toBeLessThan(planetTemp);
      expect(model.getBlackDaisyTemperature()).toBeGreaterThan(planetTemp);
    });
    
    test('should update planet temperature based on solar luminosity', () => {
      const model = new DaisyworldModel();
      const initialTemp = model.getPlanetTemperature();
      
      // Increase solar luminosity
      model.setSolarLuminosity(1.2);
      model.updatePlanetTemperature();
      
      expect(model.getPlanetTemperature()).toBeGreaterThan(initialTemp);
    });
  });
  
  // Test daisy growth dynamics
  describe('Daisy Growth Dynamics', () => {
    test('should calculate correct growth rates based on temperature', () => {
      const model = new DaisyworldModel();
      
      // At optimal temperature (295K), growth rate should be maximum
      expect(model.calculateDaisyGrowthRate(295)).toBeCloseTo(1.0);
      
      // At temperatures away from optimal, growth rate should decrease
      expect(model.calculateDaisyGrowthRate(275)).toBeLessThan(1.0);
      expect(model.calculateDaisyGrowthRate(315)).toBeLessThan(1.0);
      
      // At extreme temperatures, growth rate should be zero
      expect(model.calculateDaisyGrowthRate(245)).toBeCloseTo(0);
      expect(model.calculateDaisyGrowthRate(345)).toBeCloseTo(0);
    });
    
    test('should update daisy populations correctly for one time step', () => {
      const model = new DaisyworldModel();
      
      const initialWhite = model.getWhiteDaisyCoverage();
      const initialBlack = model.getBlackDaisyCoverage();
      
      // Run a single time step
      model.step();
      
      // Population changes depend on the growth rates determined by temperature
      // At optimal temperature, populations should grow if space available
      // We can't easily predict exact numbers, but we can check that something happened
      expect(model.getWhiteDaisyCoverage()).not.toEqual(initialWhite);
      expect(model.getBlackDaisyCoverage()).not.toEqual(initialBlack);
      
      // Sum of coverage should always equal 1.0
      expect(
        model.getWhiteDaisyCoverage() + 
        model.getBlackDaisyCoverage() + 
        model.getBareSoilCoverage()
      ).toBeCloseTo(1.0);
    });
  });
  
  // Test system stability and regulation
  describe('System Regulation', () => {
    test('should demonstrate temperature regulation with increasing luminosity', () => {
      const model = new DaisyworldModel();
      
      // Record initial temperature
      const initialTemp = model.getPlanetTemperature();
      
      // Set up a scenario with gradually increasing solar luminosity
      const luminosities = [1.0, 1.2, 1.4, 1.6, 1.8];
      const temperatures = [];
      
      // Run model with different luminosities
      for (const lum of luminosities) {
        model.setSolarLuminosity(lum);
        
        // Let the system reach equilibrium
        for (let i = 0; i < 100; i++) {
          model.step();
        }
        
        temperatures.push(model.getPlanetTemperature());
      }
      
      // In a regulated system, temperature shouldn't increase linearly with luminosity
      // Let's calculate what the temperature would be without any daisies
      const noRegulationTemps = luminosities.map(lum => {
        // Temperature scales with fourth root of luminosity (Stefan-Boltzmann law)
        // without regulation
        return initialTemp * Math.pow(lum, 0.25);
      });
      
      // Compare the temperature increase of regulated vs. unregulated system
      // The regulated system should show less temperature increase
      const regulatedIncrease = temperatures[temperatures.length-1] - temperatures[0];
      const unregulatedIncrease = noRegulationTemps[noRegulationTemps.length-1] - noRegulationTemps[0];
      
      expect(regulatedIncrease).toBeLessThan(unregulatedIncrease);
    });
  });
});