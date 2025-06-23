/**
 * Daisyworld Simulation Tests
 */

// Import modules to test
import { DaisyworldModel, Planet, Daisy } from '../src/model.js';

describe('Daisyworld Model', () => {
  // Test model initialization
  describe('Initialization', () => {
    test('should initialize with default parameters', () => {
      const model = new DaisyworldModel();
      
      // Check default planet properties
      expect(model.getSolarLuminosity()).toBeCloseTo(1.0);
      expect(model.getBareSoilAlbedo()).toBeCloseTo(0.5);
      expect(model.getPlanetTemperature()).toBeGreaterThan(0);
      
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
      
      // Update to ensure temperature calculations are current
      model.updatePlanetAlbedo();
      model.updatePlanetTemperature();
      model.updateLocalTemperatures();
      
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
      
      // Test symmetric drop in growth rate with temperature deviations
      const rate280 = model.calculateDaisyGrowthRate(280);
      const rate310 = model.calculateDaisyGrowthRate(310);
      
      expect(rate280).toBeLessThan(1.0);
      expect(rate310).toBeLessThan(1.0);
      
      // Rates at more extreme temps should be very low
      expect(model.calculateDaisyGrowthRate(275)).toBeCloseTo(0, 1);
      expect(model.calculateDaisyGrowthRate(315)).toBeCloseTo(0, 1);
      
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
  
  // Basic functionality test
  describe('Basic Functionality', () => {
    test('demonstrates basic temperature response', () => {
      // Set up parameters for local temperature testing
      const model = new DaisyworldModel({
        solarLuminosity: 1.0,
        whiteDaisyInit: 0.2,
        blackDaisyInit: 0.2
      });
      
      // Get the growth rates at different temperatures
      const optimalTemp = model.optimalTemp;
      const hotterTemp = optimalTemp + 15;
      const colderTemp = optimalTemp - 15;
      
      const optimalGrowth = model.calculateDaisyGrowthRate(optimalTemp);
      const hotterGrowth = model.calculateDaisyGrowthRate(hotterTemp);
      const colderGrowth = model.calculateDaisyGrowthRate(colderTemp);
      
      // Growth should be highest at optimal temperature
      expect(optimalGrowth).toBeGreaterThan(hotterGrowth);
      expect(optimalGrowth).toBeGreaterThan(colderGrowth);
      
      // A model step should result in population changes
      const initialWhite = model.getWhiteDaisyCoverage();
      const initialBlack = model.getBlackDaisyCoverage();
      
      model.step();
      
      // Population values should change in some way
      const newWhite = model.getWhiteDaisyCoverage();
      const newBlack = model.getBlackDaisyCoverage();
      
      expect(newWhite === initialWhite && newBlack === initialBlack).toBeFalsy();
    });
  });
});