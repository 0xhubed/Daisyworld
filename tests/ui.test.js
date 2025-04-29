/**
 * Daisyworld UI Component Tests
 */

// Import modules to test (update paths when implementation is ready)
// const { DaisyworldUI, PlanetView, TimeSeriesGraph, ControlPanel } = require('../src/ui');

describe('Daisyworld UI Components', () => {
  
  // Setup DOM environment for tests
  beforeEach(() => {
    document.body.innerHTML = `
      <div id="daisyworld-container">
        <div id="planet-view"></div>
        <div id="timeseries-graph"></div>
        <div id="control-panel"></div>
      </div>
    `;
  });
  
  describe('PlanetView', () => {
    test('should render initial state correctly', () => {
      const mockModel = {
        getWhiteDaisyCoverage: jest.fn().mockReturnValue(0.2),
        getBlackDaisyCoverage: jest.fn().mockReturnValue(0.2),
        getBareSoilCoverage: jest.fn().mockReturnValue(0.6),
        getPlanetTemperature: jest.fn().mockReturnValue(295)
      };
      
      const planetView = new PlanetView(document.getElementById('planet-view'), mockModel);
      planetView.render();
      
      // Check that canvas was created
      const canvas = document.querySelector('#planet-view canvas');
      expect(canvas).not.toBeNull();
      
      // Mock the canvas context methods to track calls
      const ctx = canvas.getContext('2d');
      ctx.arc = jest.fn();
      ctx.fill = jest.fn();
      
      // Re-render to use our mocked methods
      planetView.render();
      
      // We expect the fill method to be called for each section (white, black, bare)
      expect(ctx.fill).toHaveBeenCalledTimes(3);
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
      const mockModel = {
        getSolarLuminosity: jest.fn().mockReturnValue(1.0),
        getSimulationSpeed: jest.fn().mockReturnValue(1),
        isRunning: jest.fn().mockReturnValue(false)
      };
      
      const controlPanel = new ControlPanel(document.getElementById('control-panel'), mockModel);
      controlPanel.render();
      
      // Check that slider for solar luminosity was created
      const lumSlider = document.querySelector('#solar-luminosity-slider');
      expect(lumSlider).not.toBeNull();
      expect(lumSlider.value).toBe('1');
      
      // Check that speed control was created
      const speedControl = document.querySelector('#simulation-speed-control');
      expect(speedControl).not.toBeNull();
      expect(speedControl.value).toBe('1');
      
      // Check that start button was created
      const startButton = document.querySelector('#start-button');
      expect(startButton).not.toBeNull();
      expect(startButton.textContent).toBe('Start');
    });
    
    test('should trigger model update on slider change', () => {
      const mockModel = {
        getSolarLuminosity: jest.fn().mockReturnValue(1.0),
        getSimulationSpeed: jest.fn().mockReturnValue(1),
        isRunning: jest.fn().mockReturnValue(false),
        setSolarLuminosity: jest.fn()
      };
      
      const controlPanel = new ControlPanel(document.getElementById('control-panel'), mockModel);
      controlPanel.render();
      
      // Simulate slider change event
      const lumSlider = document.querySelector('#solar-luminosity-slider');
      lumSlider.value = '1.5';
      lumSlider.dispatchEvent(new Event('change'));
      
      expect(mockModel.setSolarLuminosity).toHaveBeenCalledWith(1.5);
    });
    
    test('should toggle simulation on button click', () => {
      const mockModel = {
        getSolarLuminosity: jest.fn().mockReturnValue(1.0),
        getSimulationSpeed: jest.fn().mockReturnValue(1),
        isRunning: jest.fn().mockReturnValue(false),
        start: jest.fn(),
        pause: jest.fn()
      };
      
      const controlPanel = new ControlPanel(document.getElementById('control-panel'), mockModel);
      controlPanel.render();
      
      // Simulate button click event
      const startButton = document.querySelector('#start-button');
      startButton.click();
      
      expect(mockModel.start).toHaveBeenCalled();
      
      // Update mock to return running status
      mockModel.isRunning.mockReturnValue(true);
      controlPanel.render();
      
      // Button should now say "Pause"
      expect(startButton.textContent).toBe('Pause');
      
      // Simulate another click to pause
      startButton.click();
      expect(mockModel.pause).toHaveBeenCalled();
    });
  });
  
  describe('DaisyworldUI', () => {
    test('should integrate all UI components', () => {
      const mockModel = {
        getWhiteDaisyCoverage: jest.fn().mockReturnValue(0.2),
        getBlackDaisyCoverage: jest.fn().mockReturnValue(0.2),
        getBareSoilCoverage: jest.fn().mockReturnValue(0.6),
        getPlanetTemperature: jest.fn().mockReturnValue(295),
        getSolarLuminosity: jest.fn().mockReturnValue(1.0),
        getSimulationSpeed: jest.fn().mockReturnValue(1),
        isRunning: jest.fn().mockReturnValue(false),
        onTimeStep: jest.fn()
      };
      
      const container = document.getElementById('daisyworld-container');
      const ui = new DaisyworldUI(container, mockModel);
      ui.initialize();
      
      // Check that all components were initialized
      expect(ui.planetView).not.toBeNull();
      expect(ui.timeSeriesGraph).not.toBeNull();
      expect(ui.controlPanel).not.toBeNull();
      
      // Check that model listener was attached
      expect(mockModel.onTimeStep).toHaveBeenCalled();
      
      // Simulate a time step event
      const timeStepCallback = mockModel.onTimeStep.mock.calls[0][0];
      timeStepCallback({
        time: 1,
        temperature: 295,
        whiteDaisyCoverage: 0.2,
        blackDaisyCoverage: 0.2
      });
      
      // Function should update time series graph
      expect(ui.timeSeriesGraph.getTemperatureData().length).toBe(1);
    });
  });
});