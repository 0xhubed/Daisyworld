/**
 * Daisyworld UI Controller
 * Implements interactive controls and visualization for the Daisyworld simulation
 */

// Import styles
import './styles.css';

// Import Chart.js
import Chart from 'chart.js/auto';

// Import the model
const { DaisyworldModel, Planet, Daisy } = require('./model.js');

// Create the model with default parameters
let model = new DaisyworldModel();

// Track simulation data for graphs
const timeSeriesData = {
  times: [],
  temperatures: [],
  whiteDaisyCoverage: [],
  blackDaisyCoverage: [],
  bareSoilCoverage: []
};

// Maximum number of data points to keep in time series
const MAX_DATA_POINTS = 100;

// Canvas and context for planet visualization
const planetCanvas = document.getElementById('planet-canvas');
const planetCtx = planetCanvas.getContext('2d');

// Initialize charts
let temperatureChart;
let populationChart;

// Control elements
const startButton = document.getElementById('start-btn');
const pauseButton = document.getElementById('pause-btn');
const resetButton = document.getElementById('reset-btn');
const stepButton = document.getElementById('step-btn');
const simulationSpeedSlider = document.getElementById('simulation-speed');
const simulationSpeedValue = document.getElementById('simulation-speed-value');
const solarLuminositySlider = document.getElementById('solar-luminosity');
const solarLuminosityValue = document.getElementById('solar-luminosity-value');
const whiteDaisyCoverageSlider = document.getElementById('white-daisy-coverage');
const whiteDaisyCoverageValue = document.getElementById('white-daisy-coverage-value');
const blackDaisyCoverageSlider = document.getElementById('black-daisy-coverage');
const blackDaisyCoverageValue = document.getElementById('black-daisy-coverage-value');
const deathRateSlider = document.getElementById('death-rate');
const deathRateValue = document.getElementById('death-rate-value');
const simulationStatus = document.getElementById('simulation-status');

// Preset buttons
const presetStableButton = document.getElementById('preset-stable');
const presetIncreasingButton = document.getElementById('preset-increasing');
const presetWhiteDominantButton = document.getElementById('preset-white-dominant');
const presetBlackDominantButton = document.getElementById('preset-black-dominant');

/**
 * Initialize the UI components
 */
function initializeUI() {
  // Set up initial slider values
  updateSliderDisplays();
  
  // Initialize model event listeners
  model.onTimeStep(handleTimeStep);
  
  // Create charts
  createCharts();
  
  // Set up button event listeners
  setupEventListeners();
  
  // Draw initial planet state
  drawPlanet();
  
  updateSimulationStatus('Simulation ready');
}

/**
 * Update all slider display values
 */
function updateSliderDisplays() {
  simulationSpeedValue.textContent = parseFloat(simulationSpeedSlider.value).toFixed(1);
  solarLuminosityValue.textContent = parseFloat(solarLuminositySlider.value).toFixed(2);
  whiteDaisyCoverageValue.textContent = parseFloat(whiteDaisyCoverageSlider.value).toFixed(2);
  blackDaisyCoverageValue.textContent = parseFloat(blackDaisyCoverageSlider.value).toFixed(2);
  deathRateValue.textContent = parseFloat(deathRateSlider.value).toFixed(2);
}

/**
 * Create time series charts
 */
function createCharts() {
  // Temperature chart
  const temperatureCtx = document.getElementById('temperature-graph').getContext('2d');
  temperatureChart = new Chart(temperatureCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Planet Temperature (K)',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        tension: 0.1
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: false
        }
      },
      animation: {
        duration: 0 // Disable animation for performance
      },
      maintainAspectRatio: false
    }
  });
  
  // Population chart
  const populationCtx = document.getElementById('population-graph').getContext('2d');
  populationChart = new Chart(populationCtx, {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'White Daisies',
          data: [],
          borderColor: 'rgb(200, 200, 200)',
          backgroundColor: 'rgba(200, 200, 200, 0.5)',
          fill: true,
          tension: 0.1
        },
        {
          label: 'Black Daisies',
          data: [],
          borderColor: 'rgb(0, 0, 0)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          fill: true,
          tension: 0.1
        },
        {
          label: 'Bare Soil',
          data: [],
          borderColor: 'rgb(139, 69, 19)',
          backgroundColor: 'rgba(139, 69, 19, 0.5)',
          fill: true,
          tension: 0.1
        }
      ]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          max: 1
        }
      },
      animation: {
        duration: 0 // Disable animation for performance
      },
      maintainAspectRatio: false
    }
  });
}

/**
 * Set up event listeners for UI controls
 */
function setupEventListeners() {
  // Simulation control buttons
  startButton.addEventListener('click', startSimulation);
  pauseButton.addEventListener('click', pauseSimulation);
  resetButton.addEventListener('click', resetSimulation);
  stepButton.addEventListener('click', stepSimulation);
  
  // Slider input events
  simulationSpeedSlider.addEventListener('input', function() {
    simulationSpeedValue.textContent = parseFloat(this.value).toFixed(1);
    model.setSimulationSpeed(parseFloat(this.value));
  });
  
  solarLuminositySlider.addEventListener('input', function() {
    solarLuminosityValue.textContent = parseFloat(this.value).toFixed(2);
    model.setSolarLuminosity(parseFloat(this.value));
  });
  
  whiteDaisyCoverageSlider.addEventListener('input', function() {
    whiteDaisyCoverageValue.textContent = parseFloat(this.value).toFixed(2);
    // Only update when simulation is not running
    if (!model.isRunning()) {
      model.setWhiteDaisyCoverage(parseFloat(this.value));
      drawPlanet();
    }
  });
  
  blackDaisyCoverageSlider.addEventListener('input', function() {
    blackDaisyCoverageValue.textContent = parseFloat(this.value).toFixed(2);
    // Only update when simulation is not running
    if (!model.isRunning()) {
      model.setBlackDaisyCoverage(parseFloat(this.value));
      drawPlanet();
    }
  });
  
  deathRateSlider.addEventListener('input', function() {
    deathRateValue.textContent = parseFloat(this.value).toFixed(2);
  });
  
  // Preset buttons
  presetStableButton.addEventListener('click', loadStablePreset);
  presetIncreasingButton.addEventListener('click', loadIncreasingLuminosityPreset);
  presetWhiteDominantButton.addEventListener('click', loadWhiteDominantPreset);
  presetBlackDominantButton.addEventListener('click', loadBlackDominantPreset);
}

/**
 * Start the simulation
 */
function startSimulation() {
  // Make sure we're not already running
  if (!model.isRunning()) {
    // Apply any pending parameter changes
    applyParameterChanges();
    
    model.start();
    startButton.disabled = true;
    pauseButton.disabled = false;
    disableInitialConditionControls(true);
    
    updateSimulationStatus('Simulation running');
  }
}

/**
 * Pause the simulation
 */
function pauseSimulation() {
  if (model.isRunning()) {
    model.pause();
    startButton.disabled = false;
    pauseButton.disabled = true;
    
    updateSimulationStatus('Simulation paused');
  }
}

/**
 * Reset the simulation
 */
function resetSimulation() {
  // Pause if running
  if (model.isRunning()) {
    pauseSimulation();
  }
  
  // Reset the model with current UI parameters
  const params = {
    solarLuminosity: parseFloat(solarLuminositySlider.value),
    whiteDaisyInit: parseFloat(whiteDaisyCoverageSlider.value),
    blackDaisyInit: parseFloat(blackDaisyCoverageSlider.value),
    deathRate: parseFloat(deathRateSlider.value),
    simulationSpeed: parseFloat(simulationSpeedSlider.value)
  };
  
  model.reset(params);
  
  // Reset time series data
  clearTimeSeriesData();
  
  // Update UI
  drawPlanet();
  updateCharts();
  disableInitialConditionControls(false);
  
  updateSimulationStatus('Simulation reset');
}

/**
 * Perform a single simulation step
 */
function stepSimulation() {
  if (!model.isRunning()) {
    // Apply any pending parameter changes
    applyParameterChanges();
    
    model.step();
    drawPlanet();
    
    updateSimulationStatus('Simulation stepped');
  }
}

/**
 * Apply current UI parameter values to the model
 */
function applyParameterChanges() {
  model.setSolarLuminosity(parseFloat(solarLuminositySlider.value));
  model.setSimulationSpeed(parseFloat(simulationSpeedSlider.value));
  
  // These should only be applied when not running
  if (!model.isRunning()) {
    model.setWhiteDaisyCoverage(parseFloat(whiteDaisyCoverageSlider.value));
    model.setBlackDaisyCoverage(parseFloat(blackDaisyCoverageSlider.value));
    
    // Need to reset to apply death rate changes
    const params = {
      solarLuminosity: parseFloat(solarLuminositySlider.value),
      whiteDaisyInit: model.getWhiteDaisyCoverage(),
      blackDaisyInit: model.getBlackDaisyCoverage(),
      deathRate: parseFloat(deathRateSlider.value),
      simulationSpeed: parseFloat(simulationSpeedSlider.value)
    };
    
    model.reset(params);
  }
}

/**
 * Enable/disable initial condition controls when simulation is running
 */
function disableInitialConditionControls(disabled) {
  whiteDaisyCoverageSlider.disabled = disabled;
  blackDaisyCoverageSlider.disabled = disabled;
  deathRateSlider.disabled = disabled;
  presetStableButton.disabled = disabled;
  presetIncreasingButton.disabled = disabled;
  presetWhiteDominantButton.disabled = disabled;
  presetBlackDominantButton.disabled = disabled;
}

/**
 * Update the simulation status display
 */
function updateSimulationStatus(message) {
  simulationStatus.textContent = message;
}

/**
 * Handle time step event from the model
 */
function handleTimeStep(data) {
  // Add data to time series
  addTimeSeriesDataPoint(data);
  
  // Update visualizations
  drawPlanet();
  updateCharts();
  
  // Update status with current temperature
  updateSimulationStatus(`Time: ${data.time}, Temperature: ${data.temperature.toFixed(1)}K`);
}

/**
 * Add a data point to the time series
 */
function addTimeSeriesDataPoint(data) {
  timeSeriesData.times.push(data.time);
  timeSeriesData.temperatures.push(data.temperature);
  timeSeriesData.whiteDaisyCoverage.push(data.whiteDaisyCoverage);
  timeSeriesData.blackDaisyCoverage.push(data.blackDaisyCoverage);
  timeSeriesData.bareSoilCoverage.push(1 - data.whiteDaisyCoverage - data.blackDaisyCoverage);
  
  // Limit the number of data points
  if (timeSeriesData.times.length > MAX_DATA_POINTS) {
    timeSeriesData.times.shift();
    timeSeriesData.temperatures.shift();
    timeSeriesData.whiteDaisyCoverage.shift();
    timeSeriesData.blackDaisyCoverage.shift();
    timeSeriesData.bareSoilCoverage.shift();
  }
}

/**
 * Clear time series data
 */
function clearTimeSeriesData() {
  timeSeriesData.times = [];
  timeSeriesData.temperatures = [];
  timeSeriesData.whiteDaisyCoverage = [];
  timeSeriesData.blackDaisyCoverage = [];
  timeSeriesData.bareSoilCoverage = [];
}

/**
 * Draw the planet visualization
 */
function drawPlanet() {
  // Get current state
  const whiteCoverage = model.getWhiteDaisyCoverage();
  const blackCoverage = model.getBlackDaisyCoverage();
  const bareSoilCoverage = model.getBareSoilCoverage();
  
  // Clear canvas
  planetCtx.clearRect(0, 0, planetCanvas.width, planetCanvas.height);
  
  // Draw planet as a circle
  const centerX = planetCanvas.width / 2;
  const centerY = planetCanvas.height / 2;
  const radius = Math.min(planetCanvas.width, planetCanvas.height) / 2.5;
  
  // Draw segments for each surface type
  drawPlanetSegments(centerX, centerY, radius, [
    { portion: bareSoilCoverage, color: '#8B4513' }, // Brown for bare soil
    { portion: whiteCoverage, color: '#E0E0E0' },    // Light gray for white daisies
    { portion: blackCoverage, color: '#202020' }     // Dark gray for black daisies
  ]);
  
  // Add temperature indicator
  const temp = model.getPlanetTemperature();
  planetCtx.fillStyle = '#000';
  planetCtx.font = '14px Arial';
  planetCtx.textAlign = 'center';
  planetCtx.fillText(`Temperature: ${temp.toFixed(1)}K`, centerX, centerY + radius + 30);
  
  // Add luminosity indicator
  const luminosity = model.getSolarLuminosity();
  planetCtx.fillText(`Solar Luminosity: ${luminosity.toFixed(2)}`, centerX, centerY + radius + 50);
}

/**
 * Draw planet segments based on surface coverage
 */
function drawPlanetSegments(centerX, centerY, radius, segments) {
  let startAngle = 0;
  
  segments.forEach(segment => {
    if (segment.portion > 0) {
      const endAngle = startAngle + (segment.portion * Math.PI * 2);
      
      planetCtx.beginPath();
      planetCtx.moveTo(centerX, centerY);
      planetCtx.arc(centerX, centerY, radius, startAngle, endAngle);
      planetCtx.closePath();
      
      planetCtx.fillStyle = segment.color;
      planetCtx.fill();
      
      startAngle = endAngle;
    }
  });
  
  // Draw outline
  planetCtx.beginPath();
  planetCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  planetCtx.strokeStyle = '#000';
  planetCtx.lineWidth = 2;
  planetCtx.stroke();
}

/**
 * Update time series charts
 */
function updateCharts() {
  // Update temperature chart
  temperatureChart.data.labels = timeSeriesData.times;
  temperatureChart.data.datasets[0].data = timeSeriesData.temperatures;
  temperatureChart.update();
  
  // Update population chart
  populationChart.data.labels = timeSeriesData.times;
  populationChart.data.datasets[0].data = timeSeriesData.whiteDaisyCoverage;
  populationChart.data.datasets[1].data = timeSeriesData.blackDaisyCoverage;
  populationChart.data.datasets[2].data = timeSeriesData.bareSoilCoverage;
  populationChart.update();
}

/**
 * Load stable state preset
 */
function loadStablePreset() {
  // Pause if running
  if (model.isRunning()) {
    pauseSimulation();
  }
  
  // Set parameters for stable system
  solarLuminositySlider.value = 1.0;
  whiteDaisyCoverageSlider.value = 0.2;
  blackDaisyCoverageSlider.value = 0.2;
  deathRateSlider.value = 0.3;
  
  // Update displays
  updateSliderDisplays();
  
  // Reset simulation with these parameters
  resetSimulation();
  
  updateSimulationStatus('Loaded stable state preset');
}

/**
 * Load increasing luminosity preset
 */
function loadIncreasingLuminosityPreset() {
  // Pause if running
  if (model.isRunning()) {
    pauseSimulation();
  }
  
  // Set parameters for increasing luminosity
  solarLuminositySlider.value = 0.7;
  whiteDaisyCoverageSlider.value = 0.1;
  blackDaisyCoverageSlider.value = 0.4;
  deathRateSlider.value = 0.3;
  
  // Update displays
  updateSliderDisplays();
  
  // Reset simulation with these parameters
  resetSimulation();
  
  updateSimulationStatus('Loaded increasing luminosity preset');
  
  // Start simulation with auto-increasing luminosity
  if (confirm('This preset will automatically increase solar luminosity over time. Start simulation?')) {
    startSimulation();
    
    // Set up automatic luminosity increase
    const luminosityInterval = setInterval(() => {
      if (model.isRunning()) {
        const currentLuminosity = parseFloat(solarLuminositySlider.value);
        const newLuminosity = Math.min(1.6, currentLuminosity + 0.01);
        
        solarLuminositySlider.value = newLuminosity;
        solarLuminosityValue.textContent = newLuminosity.toFixed(2);
        model.setSolarLuminosity(newLuminosity);
        
        if (newLuminosity >= 1.6) {
          clearInterval(luminosityInterval);
        }
      } else {
        clearInterval(luminosityInterval);
      }
    }, 1000);
  }
}

/**
 * Load white daisy dominant preset
 */
function loadWhiteDominantPreset() {
  // Pause if running
  if (model.isRunning()) {
    pauseSimulation();
  }
  
  // Set parameters for white daisy dominance
  solarLuminositySlider.value = 1.3;
  whiteDaisyCoverageSlider.value = 0.4;
  blackDaisyCoverageSlider.value = 0.05;
  deathRateSlider.value = 0.25;
  
  // Update displays
  updateSliderDisplays();
  
  // Reset simulation with these parameters
  resetSimulation();
  
  updateSimulationStatus('Loaded white daisy dominant preset');
}

/**
 * Load black daisy dominant preset
 */
function loadBlackDominantPreset() {
  // Pause if running
  if (model.isRunning()) {
    pauseSimulation();
  }
  
  // Set parameters for black daisy dominance
  solarLuminositySlider.value = 0.8;
  whiteDaisyCoverageSlider.value = 0.05;
  blackDaisyCoverageSlider.value = 0.4;
  deathRateSlider.value = 0.25;
  
  // Update displays
  updateSliderDisplays();
  
  // Reset simulation with these parameters
  resetSimulation();
  
  updateSimulationStatus('Loaded black daisy dominant preset');
}

// Initialize UI when DOM is fully loaded
document.addEventListener('DOMContentLoaded', initializeUI);