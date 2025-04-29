/**
 * Daisyworld UI Components
 * Implementation of the visualization and UI components for Daisyworld
 */

/**
 * PlanetView - Renders a visual representation of the Daisyworld planet
 */
class PlanetView {
  /**
   * Create a new PlanetView
   * @param {HTMLElement} container - The container element for the planet view
   * @param {DaisyworldModel} model - The simulation model
   */
  constructor(container, model) {
    this.container = container;
    this.model = model;
    this.canvas = null;
    this.ctx = null;
    this.width = 300;
    this.height = 300;
    this.initialized = false;
    
    this.initialize();
  }
  
  /**
   * Initialize the planet view
   */
  initialize() {
    // Create canvas if it doesn't exist
    if (!this.initialized) {
      this.canvas = document.createElement('canvas');
      this.canvas.width = this.width;
      this.canvas.height = this.height;
      this.container.appendChild(this.canvas);
      this.ctx = this.canvas.getContext('2d');
      this.initialized = true;
    }
  }
  
  /**
   * Render the planet view based on current model state
   */
  render() {
    if (!this.initialized) {
      this.initialize();
    }
    
    const ctx = this.ctx;
    const centerX = this.width / 2;
    const centerY = this.height / 2;
    const radius = Math.min(centerX, centerY) - 10;
    
    // Clear canvas
    ctx.clearRect(0, 0, this.width, this.height);
    
    // Get current model data
    const whiteCoverage = this.model.getWhiteDaisyCoverage();
    const blackCoverage = this.model.getBlackDaisyCoverage();
    const bareSoilCoverage = this.model.getBareSoilCoverage();
    
    // Calculate angles for pie segments
    const whiteAngle = whiteCoverage * Math.PI * 2;
    const blackAngle = blackCoverage * Math.PI * 2;
    const bareSoilAngle = bareSoilCoverage * Math.PI * 2;
    
    // Draw white daisy segment
    let startAngle = 0;
    let endAngle = whiteAngle;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    
    // Draw black daisy segment
    startAngle = endAngle;
    endAngle += blackAngle;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = '#333333';
    ctx.fill();
    
    // Draw bare soil segment
    startAngle = endAngle;
    endAngle += bareSoilAngle;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = '#A97655'; // Soil color
    ctx.fill();
    
    // Draw planet outline
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Update stats displays
    this.updateStats();
  }
  
  /**
   * Update the statistics displays
   */
  updateStats() {
    // Get elements
    const temperatureElement = document.getElementById('temperature-value');
    const whiteDaisyElement = document.getElementById('white-daisy-value');
    const blackDaisyElement = document.getElementById('black-daisy-value');
    const bareSoilElement = document.getElementById('bare-soil-value');
    
    // Get values from model
    const temperature = this.model.getPlanetTemperature();
    const whiteCoverage = this.model.getWhiteDaisyCoverage() * 100;
    const blackCoverage = this.model.getBlackDaisyCoverage() * 100;
    const bareSoilCoverage = this.model.getBareSoilCoverage() * 100;
    
    // Update text content
    temperatureElement.textContent = \`\${(temperature - 273.15).toFixed(1)}°C\`;
    whiteDaisyElement.textContent = \`\${whiteCoverage.toFixed(1)}%\`;
    blackDaisyElement.textContent = \`\${blackCoverage.toFixed(1)}%\`;
    bareSoilElement.textContent = \`\${bareSoilCoverage.toFixed(1)}%\`;
  }
}

/**
 * TimeSeriesGraph - Simple visual representation of data changes over time
 */
class TimeSeriesGraph {
  /**
   * Create a new TimeSeriesGraph
   * @param {HTMLElement} container - The container element for the graph
   */
  constructor(container) {
    this.container = container;
    this.temperatureData = [];
    this.whiteDaisyData = [];
    this.blackDaisyData = [];
    this.timeData = [];
    this.maxDataPoints = 100; // Maximum number of data points to store
    
    // Basic graph representation for Phase 2
    this.canvas = document.createElement('canvas');
    this.container.appendChild(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    
    // Set canvas size to match container
    this.resizeCanvas();
    
    // Handle window resize
    window.addEventListener('resize', () => this.resizeCanvas());
  }
  
  /**
   * Resize canvas to match container size
   */
  resizeCanvas() {
    this.canvas.width = this.container.clientWidth;
    this.canvas.height = this.container.clientHeight;
    this.render();
  }
  
  /**
   * Add a new data point to the graph
   * @param {Object} data - Data point with time, temperature and coverage values
   */
  addDataPoint(data) {
    this.timeData.push(data.time);
    this.temperatureData.push(data.temperature);
    this.whiteDaisyData.push(data.whiteDaisyCoverage);
    this.blackDaisyData.push(data.blackDaisyCoverage);
    
    // Limit the number of data points
    if (this.timeData.length > this.maxDataPoints) {
      this.timeData.shift();
      this.temperatureData.shift();
      this.whiteDaisyData.shift();
      this.blackDaisyData.shift();
    }
    
    // Render the updated graph
    this.render();
  }
  
  /**
   * Render the graph with current data
   */
  render() {
    if (this.timeData.length === 0) return;
    
    const ctx = this.ctx;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 30;
    
    // Clear canvas
    ctx.clearRect(0, 0, width, height);
    
    // Draw background
    ctx.fillStyle = '#f9f9f9';
    ctx.fillRect(padding, padding, width - padding * 2, height - padding * 2);
    
    // Draw title
    ctx.font = '16px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'center';
    ctx.fillText('Daisyworld Simulation Data', width / 2, 20);
    
    // Draw axes
    ctx.beginPath();
    ctx.moveTo(padding, padding);
    ctx.lineTo(padding, height - padding);
    ctx.lineTo(width - padding, height - padding);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.stroke();
    
    // Draw data using simple lines (basic representation for Phase 2)
    this.drawDataLine(this.whiteDaisyData, '#3498db', 0, 1, padding, width, height);
    this.drawDataLine(this.blackDaisyData, '#2c3e50', 0, 1, padding, width, height);
    
    // Add legend
    this.drawLegend(width, height, padding);
  }
  
  /**
   * Draw a data line on the graph
   * @param {Array} data - Array of data points
   * @param {string} color - Color for the line
   * @param {number} min - Minimum expected value
   * @param {number} max - Maximum expected value
   * @param {number} padding - Graph padding
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   */
  drawDataLine(data, color, min, max, padding, width, height) {
    if (data.length === 0) return;
    
    const ctx = this.ctx;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;
    
    // Calculate scales
    const xScale = graphWidth / (data.length - 1 || 1);
    const yScale = graphHeight / (max - min);
    
    // Begin path
    ctx.beginPath();
    
    // Draw each point
    data.forEach((value, index) => {
      const x = padding + index * xScale;
      const y = height - padding - (value - min) * yScale;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    // Style and stroke the path
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  /**
   * Draw a legend for the graph
   * @param {number} width - Canvas width
   * @param {number} height - Canvas height
   * @param {number} padding - Graph padding
   */
  drawLegend(width, height, padding) {
    const ctx = this.ctx;
    const legendY = height - padding / 2;
    
    // White daisies
    ctx.beginPath();
    ctx.moveTo(padding + 10, legendY);
    ctx.lineTo(padding + 30, legendY);
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.font = '12px Arial';
    ctx.fillStyle = '#333';
    ctx.textAlign = 'left';
    ctx.fillText('White Daisies', padding + 35, legendY + 4);
    
    // Black daisies
    ctx.beginPath();
    ctx.moveTo(padding + 130, legendY);
    ctx.lineTo(padding + 150, legendY);
    ctx.strokeStyle = '#2c3e50';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    ctx.fillText('Black Daisies', padding + 155, legendY + 4);
  }
  
  /**
   * Reset the graph data
   */
  reset() {
    this.timeData = [];
    this.temperatureData = [];
    this.whiteDaisyData = [];
    this.blackDaisyData = [];
    this.render();
  }
  
  /**
   * Get temperature data (for testing)
   */
  getTemperatureData() {
    return this.temperatureData;
  }
  
  /**
   * Get white daisy data (for testing)
   */
  getWhiteDaisyData() {
    return this.whiteDaisyData;
  }
  
  /**
   * Get black daisy data (for testing)
   */
  getBlackDaisyData() {
    return this.blackDaisyData;
  }
}

/**
 * ControlPanel - UI for controlling simulation parameters
 */
class ControlPanel {
  /**
   * Create a new ControlPanel
   * @param {HTMLElement} container - The container element for the control panel
   * @param {DaisyworldModel} model - The simulation model
   */
  constructor(container, model) {
    this.container = container;
    this.model = model;
    this.initialized = false;
    
    // Reference to DOM elements
    this.startButton = null;
    this.resetButton = null;
    this.speedSlider = null;
    this.luminositySlider = null;
    this.speedValue = null;
    this.luminosityValue = null;
    
    this.initialize();
  }
  
  /**
   * Initialize the control panel
   */
  initialize() {
    if (this.initialized) return;
    
    // Get elements
    this.startButton = document.getElementById('start-button');
    this.resetButton = document.getElementById('reset-button');
    this.speedSlider = document.getElementById('simulation-speed');
    this.luminositySlider = document.getElementById('solar-luminosity');
    this.speedValue = document.getElementById('speed-value');
    this.luminosityValue = document.getElementById('luminosity-value');
    
    this.initialized = true;
    this.setupEventListeners();
    this.updateDisplay();
  }
  
  /**
   * Set up event listeners for controls
   */
  setupEventListeners() {
    // Start/pause button
    this.startButton.addEventListener('click', () => {
      if (this.model.isRunning()) {
        this.model.pause();
      } else {
        this.model.start();
      }
      this.updateDisplay();
    });
    
    // Reset button
    this.resetButton.addEventListener('click', () => {
      this.model.reset();
      this.updateDisplay();
    });
    
    // Speed slider
    this.speedSlider.addEventListener('input', () => {
      const speed = parseFloat(this.speedSlider.value);
      this.model.setSimulationSpeed(speed);
      this.speedValue.textContent = \`\${speed.toFixed(1)}x\`;
    });
    
    // Luminosity slider
    this.luminositySlider.addEventListener('input', () => {
      const luminosity = parseFloat(this.luminositySlider.value);
      this.model.setSolarLuminosity(luminosity);
      this.luminosityValue.textContent = luminosity.toFixed(2);
    });
  }
  
  /**
   * Update the display based on model state
   */
  updateDisplay() {
    this.startButton.textContent = this.model.isRunning() ? 'Pause' : 'Start';
    
    // Update sliders to match model
    this.speedSlider.value = this.model.getSimulationSpeed();
    this.luminositySlider.value = this.model.getSolarLuminosity();
    
    // Update value displays
    this.speedValue.textContent = \`\${this.model.getSimulationSpeed().toFixed(1)}x\`;
    this.luminosityValue.textContent = this.model.getSolarLuminosity().toFixed(2);
  }
  
  /**
   * Render the control panel (for testing compatibility)
   */
  render() {
    this.updateDisplay();
  }
}

/**
 * DaisyworldUI - Main UI class that integrates all components
 */
class DaisyworldUI {
  /**
   * Create a new DaisyworldUI
   * @param {HTMLElement} container - The container for the entire UI
   * @param {DaisyworldModel} model - The simulation model
   */
  constructor(container, model) {
    this.container = container;
    this.model = model;
    this.planetView = null;
    this.timeSeriesGraph = null;
    this.controlPanel = null;
    
    this.initialize();
  }
  
  /**
   * Initialize all UI components
   */
  initialize() {
    // Create planet view
    const planetViewContainer = document.getElementById('planet-view');
    this.planetView = new PlanetView(planetViewContainer, this.model);
    
    // Create time series graph
    const timeSeriesContainer = document.getElementById('timeseries-graph');
    this.timeSeriesGraph = new TimeSeriesGraph(timeSeriesContainer);
    
    // Create control panel
    const controlPanelContainer = document.getElementById('control-panel');
    this.controlPanel = new ControlPanel(controlPanelContainer, this.model);
    
    // Set up model listener for updates
    this.model.onTimeStep((data) => {
      this.timeSeriesGraph.addDataPoint(data);
      this.planetView.render();
    });
    
    // Initial render
    this.render();
  }
  
  /**
   * Render all UI components
   */
  render() {
    this.planetView.render();
    this.controlPanel.render();
  }
}

// Export UI classes
export {
  DaisyworldUI,
  PlanetView,
  TimeSeriesGraph,
  ControlPanel
};