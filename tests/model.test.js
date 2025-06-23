/**
 * Model-specific tests for Daisyworld
 */

// Import model classes
const { DaisyworldModel, Planet, Daisy } = require('../src/model');

describe('Daisy class', () => {
  test('should initialize with correct values', () => {
    const daisy = new Daisy('white', 0.75, 0.2);
    
    expect(daisy.getType()).toBe('white');
    expect(daisy.getAlbedo()).toBe(0.75);
    expect(daisy.getCoverage()).toBe(0.2);
  });
  
  test('should constrain coverage between 0 and 1', () => {
    const daisy = new Daisy('white', 0.75, 0.5);
    
    daisy.setCoverage(1.5);
    expect(daisy.getCoverage()).toBe(1.0);
    
    daisy.setCoverage(-0.5);
    expect(daisy.getCoverage()).toBe(0.0);
  });
});

describe('Planet class', () => {
  test('should initialize with default values', () => {
    const planet = new Planet();
    
    expect(planet.getBareSoilAlbedo()).toBe(0.5);
    expect(planet.getTemperature()).toBe(295);
    expect(planet.getSolarLuminosity()).toBe(1.0);
  });
  
  test('should initialize with custom values', () => {
    const planet = new Planet(0.4, 290);
    
    expect(planet.getBareSoilAlbedo()).toBe(0.4);
    expect(planet.getTemperature()).toBe(290);
  });
  
  test('should calculate temperature based on albedo and luminosity', () => {
    const planet = new Planet(0.5, 295);
    
    // Default albedo 0.5, luminosity 1.0
    const initialTemp = planet.calculateTemperature();
    
    // Increase luminosity
    planet.setSolarLuminosity(1.1);
    const higherLumTemp = planet.calculateTemperature();
    expect(higherLumTemp).toBeGreaterThan(initialTemp);
    
    // Decrease albedo
    planet.setAlbedo(0.4);
    const lowerAlbedoTemp = planet.calculateTemperature();
    expect(lowerAlbedoTemp).toBeGreaterThan(higherLumTemp);
    
    // Increase albedo
    planet.setAlbedo(0.6);
    const higherAlbedoTemp = planet.calculateTemperature();
    expect(higherAlbedoTemp).toBeLessThan(higherLumTemp);
  });
  
  test('should calculate local temperatures correctly', () => {
    const planet = new Planet(0.5, 295);
    
    // Test with different albedos
    const lowAlbedoTemp = planet.calculateLocalTemperature(0.3);
    const highAlbedoTemp = planet.calculateLocalTemperature(0.7);
    
    // Lower albedo surfaces should be warmer
    expect(lowAlbedoTemp).toBeGreaterThan(planet.getTemperature());
    expect(highAlbedoTemp).toBeLessThan(planet.getTemperature());
  });
});

describe('DaisyworldModel initialization', () => {
  test('should initialize with default parameters', () => {
    const model = new DaisyworldModel();
    
    // Check planet properties
    expect(model.getSolarLuminosity()).toBeCloseTo(1.0);
    expect(model.getBareSoilAlbedo()).toBeCloseTo(0.5);
    expect(model.getPlanetTemperature()).toBeGreaterThan(0);
    
    // Check daisy populations
    expect(model.getWhiteDaisyCoverage()).toBeCloseTo(0.3);
    expect(model.getBlackDaisyCoverage()).toBeCloseTo(0.3);
    expect(model.getBareSoilCoverage()).toBeCloseTo(0.4);
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
    // Temperature may not be exactly initialTemp due to calculations
    expect(model.getWhiteDaisyCoverage()).toBeCloseTo(0.3);
    expect(model.getBlackDaisyCoverage()).toBeCloseTo(0.1);
    expect(model.getBareSoilCoverage()).toBeCloseTo(0.6);
  });
});

describe('DaisyworldModel calculations', () => {
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
  
  test('should calculate growth rates correctly', () => {
    const model = new DaisyworldModel();
    
    // At optimal temperature (295K), growth rate should be maximum
    expect(model.calculateDaisyGrowthRate(295)).toBeCloseTo(1.0);
    
    // Test symmetric drop in growth rate with temperature deviations
    const rate280 = model.calculateDaisyGrowthRate(280);
    const rate310 = model.calculateDaisyGrowthRate(310);
    
    expect(rate280).toBeLessThan(1.0);
    expect(rate310).toBeLessThan(1.0);
    
    // Rates at edge of growth range should be lower but not zero
    expect(model.calculateDaisyGrowthRate(275)).toBeCloseTo(0.48, 1); // 2°C (edge of range)
    expect(model.calculateDaisyGrowthRate(324)).toBeCloseTo(0.06, 1); // 51°C (near edge of range)
    
    // At extreme temperatures, growth rate should be zero
    expect(model.calculateDaisyGrowthRate(245)).toBeCloseTo(0);
    expect(model.calculateDaisyGrowthRate(345)).toBeCloseTo(0);
  });
});

describe('DaisyworldModel simulation', () => {
  test('should update daisy populations correctly for one time step', () => {
    const model = new DaisyworldModel();
    
    const initialWhite = model.getWhiteDaisyCoverage();
    const initialBlack = model.getBlackDaisyCoverage();
    
    // Run a single time step
    model.step();
    
    // Population changes depend on the growth rates determined by temperature
    // At optimal temperature, populations should change
    expect(model.getWhiteDaisyCoverage()).not.toBe(initialWhite);
    expect(model.getBlackDaisyCoverage()).not.toBe(initialBlack);
    
    // Sum of coverage should always equal 1.0
    expect(
      model.getWhiteDaisyCoverage() + 
      model.getBlackDaisyCoverage() + 
      model.getBareSoilCoverage()
    ).toBeCloseTo(1.0);
  });
  
  test('should conserve total surface area', () => {
    const model = new DaisyworldModel();
    
    // Run multiple steps
    for (let i = 0; i < 100; i++) {
      model.step();
      
      // Total surface area should always be conserved
      expect(
        model.getWhiteDaisyCoverage() + 
        model.getBlackDaisyCoverage() + 
        model.getBareSoilCoverage()
      ).toBeCloseTo(1.0);
    }
  });
  
  test('should notify listeners of time steps', () => {
    const model = new DaisyworldModel();
    const mockCallback = jest.fn();
    
    model.onTimeStep(mockCallback);
    model.step();
    
    expect(mockCallback).toHaveBeenCalledTimes(1);
    expect(mockCallback).toHaveBeenCalledWith(expect.objectContaining({
      time: expect.any(Number),
      temperature: expect.any(Number),
      whiteDaisyCoverage: expect.any(Number),
      blackDaisyCoverage: expect.any(Number)
    }));
  });
  
  test('demonstrates basic temperature response', () => {
    // Instead of comparing models, we'll test a single model's response to temperature
    
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