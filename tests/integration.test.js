/**
 * Integration tests for Daisyworld simulation
 */

import { DaisyworldModel } from '../src/model.js';
import { DaisyworldUI, PlanetView, TimeSeriesGraph, ControlPanel } from '../src/ui.js';

describe('Daisyworld Integration Tests', () => {
  // Set up the DOM environment
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="daisyworld-container">
        <div id="planet-view"></div>
        <div id="control-panel">
          <button id="start-button">Start</button>
          <button id="reset-button">Reset</button>
          <input type="range" id="simulation-speed" value="1">
          <span id="speed-value">1x</span>
          <input type="range" id="solar-luminosity" value="1">
          <span id="luminosity-value">1.0</span>
        </div>
        <div id="timeseries-graph"></div>
        <div class="planet-stats">
          <span id="temperature-value">22°C</span>
          <span id="white-daisy-value">20%</span>
          <span id="black-daisy-value">20%</span>
          <span id="bare-soil-value">60%</span>
        </div>
      </div>
    `;
  });
  
  test('should initialize UI components and connect to model', () => {
    const model = new DaisyworldModel();
    const container = document.getElementById('daisyworld-container');
    const ui = new DaisyworldUI(container, model);
    
    // Check that UI components are initialized
    expect(ui.planetView).toBeDefined();
    expect(ui.timeSeriesGraph).toBeDefined();
    expect(ui.controlPanel).toBeDefined();
    
    // Check that canvas elements are created
    const planetCanvas = document.querySelector('#planet-view canvas');
    const timeSeriesCanvas = document.querySelector('#timeseries-graph canvas');
    expect(planetCanvas).not.toBeNull();
    expect(timeSeriesCanvas).not.toBeNull();
  });
  
  test('should update UI when model changes', () => {
    const model = new DaisyworldModel();
    const container = document.getElementById('daisyworld-container');
    const ui = new DaisyworldUI(container, model);
    
    // Initial temperature display
    const initialTemp = (model.getPlanetTemperature() - 273.15).toFixed(1);
    expect(document.getElementById('temperature-value').textContent).toBe(`${initialTemp}°C`);
    
    // Run a step
    model.step();
    
    // Stats should be updated
    ui.planetView.updateStats();
    const newTemp = (model.getPlanetTemperature() - 273.15).toFixed(1);
    expect(document.getElementById('temperature-value').textContent).toBe(`${newTemp}°C`);
  });
  
  test('should start and pause simulation on button click', () => {
    const model = new DaisyworldModel();
    const container = document.getElementById('daisyworld-container');
    const ui = new DaisyworldUI(container, model);
    
    // Initially not running
    expect(model.isRunning()).toBe(false);
    
    // Simulate button click
    const startButton = document.getElementById('start-button');
    startButton.click();
    
    // Should be running
    expect(model.isRunning()).toBe(true);
    
    // Click again to pause
    startButton.click();
    
    // Should be paused
    expect(model.isRunning()).toBe(false);
  });
  
  test('should reset simulation on reset button click', () => {
    const model = new DaisyworldModel();
    const container = document.getElementById('daisyworld-container');
    const ui = new DaisyworldUI(container, model);
    
    // Change some parameters
    model.setSolarLuminosity(1.2);
    model.setSimulationSpeed(2);
    
    // Run a few steps
    for (let i = 0; i < 10; i++) {
      model.step();
    }
    
    // Simulate reset button click
    const resetButton = document.getElementById('reset-button');
    resetButton.click();
    
    // Parameters should be reset
    expect(model.getSolarLuminosity()).toBe(1.0);
    expect(model.getSimulationSpeed()).toBe(1);
    expect(model.time).toBe(0);
  });
  
  test('should update model parameters from sliders', () => {
    const model = new DaisyworldModel();
    const container = document.getElementById('daisyworld-container');
    const ui = new DaisyworldUI(container, model);
    
    // Change simulation speed
    const speedSlider = document.getElementById('simulation-speed');
    speedSlider.value = '2.5';
    speedSlider.dispatchEvent(new Event('input'));
    
    expect(model.getSimulationSpeed()).toBe(2.5);
    
    // Change solar luminosity
    const luminositySlider = document.getElementById('solar-luminosity');
    luminositySlider.value = '1.3';
    luminositySlider.dispatchEvent(new Event('input'));
    
    expect(model.getSolarLuminosity()).toBe(1.3);
  });
});