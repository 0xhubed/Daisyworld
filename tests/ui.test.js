/**
 * Daisyworld UI Component Tests
 */

// Import modules to test
import { DaisyworldModel } from '../src/model.js';
import { DaisyworldUI, PlanetView, TimeSeriesGraph, ControlPanel } from '../src/ui.js';

// Mock model for testing UI
class MockModel {
  constructor() {
    this.whiteDaisyCoverage = 0.2;
    this.blackDaisyCoverage = 0.2;
    this.temperature = 295;
    this.solarLuminosity = 1.0;
    this.simulationSpeed = 1;
    this.running = false;
    this.callbacks = [];
  }
  
  getWhiteDaisyCoverage() { return this.whiteDaisyCoverage; }
  getBlackDaisyCoverage() { return this.blackDaisyCoverage; }
  getBareSoilCoverage() { return 1 - this.whiteDaisyCoverage - this.blackDaisyCoverage; }
  getPlanetTemperature() { return this.temperature; }
  getSolarLuminosity() { return this.solarLuminosity; }
  getSimulationSpeed() { return this.simulationSpeed; }
  isRunning() { return this.running; }
  
  setSolarLuminosity(val) { this.solarLuminosity = val; }
  setSimulationSpeed(val) { this.simulationSpeed = val; }
  
  start() { this.running = true; }
  pause() { this.running = false; }
  
  onTimeStep(callback) {
    this.callbacks.push(callback);
    return () => {
      const index = this.callbacks.indexOf(callback);
      if (index !== -1) {
        this.callbacks.splice(index, 1);
      }
    };
  }
}

describe('Daisyworld UI Components', () => {
  // Setup DOM environment for tests
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="daisyworld-container">
        <div id="planet-view"></div>
        <div id="timeseries-graph"></div>
        <div id="control-panel">
          <button id="start-button">Start</button>
          <button id="reset-button">Reset</button>
          <input type="range" id="simulation-speed" value="1">
          <span id="speed-value">1x</span>
          <input type="range" id="solar-luminosity" value="1">
          <span id="luminosity-value">1.0</span>
        </div>
        <div class="planet-stats">
          <span id="temperature-value">22°C</span>
          <span id="white-daisy-value">20%</span>
          <span id="black-daisy-value">20%</span>
          <span id="bare-soil-value">60%</span>
        </div>
      </div>
    `;
  });
  
  describe('PlanetView', () => {
    test('should render initial state correctly', () => {
      const mockModel = new MockModel();
      
      const planetView = new PlanetView(document.getElementById('planet-view'), mockModel);
      planetView.render();
      
      // Check that canvas was created
      const canvas = document.querySelector('#planet-view canvas');
      expect(canvas).not.toBeNull();
      
      // Check stats were updated
      expect(document.getElementById('white-daisy-value').textContent).toBe('20.0%');
      expect(document.getElementById('black-daisy-value').textContent).toBe('20.0%');
      expect(document.getElementById('bare-soil-value').textContent).toBe('60.0%');
    });
  });
  
  describe('TimeSeriesGraph', () => {
    test('should initialize with empty data series', () => {
      const graph = new TimeSeriesGraph(document.getElementById('timeseries-graph'));
      
      expect(graph.getTemperatureData().length).toBe(0);
      expect(graph.getWhiteDaisyData().length).toBe(0);
      expect(graph.getBlackDaisyData().length).toBe(0);
    });
    
    test('should add data points correctly', () => {
      const graph = new TimeSeriesGraph(document.getElementById('timeseries-graph'));
      
      graph.addDataPoint({
        time: 1,
        temperature: 295,
        whiteDaisyCoverage: 0.2,
        blackDaisyCoverage: 0.2
      });
      
      expect(graph.getTemperatureData().length).toBe(1);
      expect(graph.getWhiteDaisyData().length).toBe(1);
      expect(graph.getBlackDaisyData().length).toBe(1);
      
      expect(graph.getTemperatureData()[0]).toBe(295);
      expect(graph.getWhiteDaisyData()[0]).toBe(0.2);
      expect(graph.getBlackDaisyData()[0]).toBe(0.2);
    });
  });
  
  describe('ControlPanel', () => {
    test('should initialize with default values', () => {
      const mockModel = new MockModel();
      
      const controlPanel = new ControlPanel(document.getElementById('control-panel'), mockModel);
      controlPanel.render();
      
      // Start button should say "Start" initially
      const startButton = document.getElementById('start-button');
      expect(startButton.textContent).toBe('Start');
      
      // Set model to running state
      mockModel.running = true;
      controlPanel.render();
      
      // Start button should now say "Pause"
      expect(startButton.textContent).toBe('Pause');
    });
    
    test('should update model on button clicks', () => {
      const mockModel = new MockModel();
      
      const controlPanel = new ControlPanel(document.getElementById('control-panel'), mockModel);
      controlPanel.render();
      
      // Initially not running
      expect(mockModel.isRunning()).toBe(false);
      
      // Click start
      document.getElementById('start-button').click();
      expect(mockModel.isRunning()).toBe(true);
      
      // Click again to pause
      document.getElementById('start-button').click();
      expect(mockModel.isRunning()).toBe(false);
    });
  });
  
  describe('DaisyworldUI integration', () => {
    test('should initialize all components', () => {
      const mockModel = new MockModel();
      const container = document.getElementById('daisyworld-container');
      
      const ui = new DaisyworldUI(container, mockModel);
      
      // Check components were initialized
      expect(ui.planetView).not.toBeNull();
      expect(ui.timeSeriesGraph).not.toBeNull();
      expect(ui.controlPanel).not.toBeNull();
    });
  });
});