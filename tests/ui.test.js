/**
 * Daisyworld UI Component Tests
 */

// Mock the Chart.js import
jest.mock('chart.js/auto', () => {
  return jest.fn().mockImplementation(() => ({
    update: jest.fn(),
    data: {
      labels: [],
      datasets: [{data: []}, {data: []}, {data: []}]
    }
  }));
});

// Mock the DOM APIs that aren't available in JSDOM
global.requestAnimationFrame = jest.fn(callback => setTimeout(callback, 0));
global.cancelAnimationFrame = jest.fn();

// Import model module to test
const { DaisyworldModel } = require('../src/model');

describe('Daisyworld UI Components', () => {
  // Setup DOM environment for tests
  beforeEach(() => {
    document.body.innerHTML = `
      <div class="container">
        <div class="visualization">
          <div id="planet-view">
            <canvas id="planet-canvas" width="500" height="300"></canvas>
          </div>
          <div id="graphs">
            <canvas id="temperature-graph" width="500" height="200"></canvas>
            <canvas id="population-graph" width="500" height="200"></canvas>
          </div>
        </div>
        
        <div class="controls">
          <button id="start-btn">Start</button>
          <button id="pause-btn">Pause</button>
          <button id="reset-btn">Reset</button>
          <button id="step-btn">Step</button>
          
          <div class="slider-container">
            <input type="range" id="simulation-speed" min="0.1" max="10" step="0.1" value="1">
            <span id="simulation-speed-value">1.0</span>
          </div>
          
          <div class="slider-container">
            <input type="range" id="solar-luminosity" min="0.6" max="1.6" step="0.01" value="1.0">
            <span id="solar-luminosity-value">1.0</span>
          </div>
          
          <div class="slider-container">
            <input type="range" id="white-daisy-coverage" min="0" max="0.5" step="0.01" value="0.2">
            <span id="white-daisy-coverage-value">0.20</span>
          </div>
          
          <div class="slider-container">
            <input type="range" id="black-daisy-coverage" min="0" max="0.5" step="0.01" value="0.2">
            <span id="black-daisy-coverage-value">0.20</span>
          </div>
          
          <div class="slider-container">
            <input type="range" id="death-rate" min="0.1" max="0.5" step="0.01" value="0.3">
            <span id="death-rate-value">0.30</span>
          </div>
          
          <button id="preset-stable">Stable State</button>
          <button id="preset-increasing">Increasing Luminosity</button>
          <button id="preset-white-dominant">White Dominant</button>
          <button id="preset-black-dominant">Black Dominant</button>
          
          <div id="simulation-status">Simulation ready</div>
        </div>
      </div>
    `;
    
    // Mock canvas context
    const mockContext = {
      clearRect: jest.fn(),
      beginPath: jest.fn(),
      moveTo: jest.fn(),
      arc: jest.fn(),
      closePath: jest.fn(),
      fill: jest.fn(),
      stroke: jest.fn(),
      fillText: jest.fn(),
      textAlign: 'center',
      font: '14px Arial',
      fillStyle: '#000',
      strokeStyle: '#000',
      lineWidth: 2
    };
    
    HTMLCanvasElement.prototype.getContext = jest.fn(() => mockContext);
  });
  
  describe('UI Controls', () => {
    let model;
    
    beforeEach(() => {
      // Create a real model instance
      model = new DaisyworldModel();
      
      // Mock required model methods
      model.start = jest.fn();
      model.pause = jest.fn();
      model.step = jest.fn();
      model.reset = jest.fn();
      model.setSolarLuminosity = jest.fn();
      model.setSimulationSpeed = jest.fn();
      model.setWhiteDaisyCoverage = jest.fn();
      model.setBlackDaisyCoverage = jest.fn();
      model.onTimeStep = jest.fn().mockReturnValue(() => {});
    });
    
    test('start button should call model.start', () => {
      // Import the UI script to initialize event listeners
      require('../src/ui');
      
      // Manually trigger DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Trigger start button click
      const startBtn = document.getElementById('start-btn');
      startBtn.click();
      
      // Expect model.start to have been called
      expect(model.start).toHaveBeenCalled();
    });
    
    test('solar luminosity slider should update value display', () => {
      // Import the UI script
      require('../src/ui');
      
      // Manually trigger DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Simulate slider input
      const slider = document.getElementById('solar-luminosity');
      const valueDisplay = document.getElementById('solar-luminosity-value');
      
      slider.value = '1.25';
      // Dispatch input event
      slider.dispatchEvent(new Event('input'));
      
      // Expect the value display to be updated
      expect(valueDisplay.textContent).toBe('1.25');
    });
    
    test('preset buttons should modify multiple parameters', () => {
      // Import the UI script
      require('../src/ui');
      
      // Manually trigger DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Get the preset button
      const stablePresetBtn = document.getElementById('preset-stable');
      
      // Click the preset button
      stablePresetBtn.click();
      
      // Check that model.reset was called
      expect(model.reset).toHaveBeenCalled();
      
      // Check that slider values are updated
      expect(document.getElementById('solar-luminosity').value).toBe('1.0');
      expect(document.getElementById('white-daisy-coverage').value).toBe('0.2');
      expect(document.getElementById('black-daisy-coverage').value).toBe('0.2');
      expect(document.getElementById('death-rate').value).toBe('0.3');
    });
  });
  
  describe('Chart Integration', () => {
    test('Chart.js should be imported and initialized', () => {
      // Import Chart to check it was mocked correctly
      const Chart = require('chart.js/auto');
      
      // Import the UI script
      require('../src/ui');
      
      // Manually trigger DOMContentLoaded
      const event = new Event('DOMContentLoaded');
      document.dispatchEvent(event);
      
      // Expect Chart to have been called twice (once for temperature, once for population)
      expect(Chart).toHaveBeenCalledTimes(2);
    });
  });
});