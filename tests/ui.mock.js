/**
 * Mock file for UI tests
 */

// Mock UI classes
export class PlanetView {
  constructor(container, model) {
    this.container = container;
    this.model = model;
    this.render = jest.fn();
    this.updateStats = jest.fn();
  }
  
  initialize() {}
}

export class TimeSeriesGraph {
  constructor(container) {
    this.container = container;
    this.temperatureData = [];
    this.whiteDaisyData = [];
    this.blackDaisyData = [];
    
    // Add canvas
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
  }
  
  addDataPoint(data) {
    this.temperatureData.push(data.temperature);
    this.whiteDaisyData.push(data.whiteDaisyCoverage);
    this.blackDaisyData.push(data.blackDaisyCoverage);
  }
  
  getTemperatureData() {
    return this.temperatureData;
  }
  
  getWhiteDaisyData() {
    return this.whiteDaisyData;
  }
  
  getBlackDaisyData() {
    return this.blackDaisyData;
  }
  
  reset() {
    this.temperatureData = [];
    this.whiteDaisyData = [];
    this.blackDaisyData = [];
  }
}

export class ControlPanel {
  constructor(container, model) {
    this.container = container;
    this.model = model;
    this.render = jest.fn();
  }
}

export class DaisyworldUI {
  constructor(container, model) {
    this.container = container;
    this.model = model;
    this.planetView = new PlanetView(document.getElementById('planet-view'), model);
    this.timeSeriesGraph = new TimeSeriesGraph(document.getElementById('timeseries-graph'));
    this.controlPanel = new ControlPanel(document.getElementById('control-panel'), model);
    
    // Add listener to model
    this.model.onTimeStep = jest.fn();
    this.initialize = jest.fn();
  }
}