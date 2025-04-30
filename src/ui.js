/**
 * Daisyworld UI Controller
 * Implements interactive controls and visualization for the Daisyworld simulation
 */

// Import styles
import './styles.css';

// Import Chart.js
// Use global Chart object
const Chart = window.Chart;

// Import the model using ES modules
import { DaisyworldModel, Planet, Daisy } from './model.js';

// Create the model with stable initial parameters
let model = new DaisyworldModel({
  solarLuminosity: 1.0,
  bareSoilAlbedo: 0.5,
  initialTemp: 295, // ~22°C
  whiteDaisyInit: 0.2,
  blackDaisyInit: 0.2,
  whiteDaisyAlbedo: 0.75,
  blackDaisyAlbedo: 0.25,
  deathRate: 0.3,
  optimalTemp: 295,
  simulationSpeed: 0.5 // Slower speed for stability
});

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

// Container for 3D planet visualization
const planetContainer = document.getElementById('planet-container');

// Import 3D planet renderer
import { PlanetRenderer } from './planet-renderer.js';

// 3D Planet renderer instance
let planetRenderer = null;

// Initialize charts
let temperatureChart;
let populationChart;

// Control elements
let startButton, pauseButton, resetButton, stepButton;
let simulationSpeedSlider, simulationSpeedValue;
let solarLuminositySlider, solarLuminosityValue;
let whiteDaisyCoverageSlider, whiteDaisyCoverageValue;
let blackDaisyCoverageSlider, blackDaisyCoverageValue;
let deathRateSlider, deathRateValue;
let simulationStatus;

// Preset buttons
let presetStableButton, presetIncreasingButton, presetWhiteDominantButton, presetBlackDominantButton;

/**
 * Initialize the UI components
 */
function initializeUI() {
  // Initialize DOM element references
  startButton = document.getElementById('start-btn');
  pauseButton = document.getElementById('pause-btn');
  resetButton = document.getElementById('reset-btn');
  stepButton = document.getElementById('step-btn');
  simulationSpeedSlider = document.getElementById('simulation-speed');
  simulationSpeedValue = document.getElementById('simulation-speed-value');
  solarLuminositySlider = document.getElementById('solar-luminosity');
  solarLuminosityValue = document.getElementById('solar-luminosity-value');
  whiteDaisyCoverageSlider = document.getElementById('white-daisy-coverage');
  whiteDaisyCoverageValue = document.getElementById('white-daisy-coverage-value');
  blackDaisyCoverageSlider = document.getElementById('black-daisy-coverage');
  blackDaisyCoverageValue = document.getElementById('black-daisy-coverage-value');
  deathRateSlider = document.getElementById('death-rate');
  deathRateValue = document.getElementById('death-rate-value');
  simulationStatus = document.getElementById('simulation-status');
  
  // Preset buttons
  presetStableButton = document.getElementById('preset-stable');
  presetIncreasingButton = document.getElementById('preset-increasing');
  presetWhiteDominantButton = document.getElementById('preset-white-dominant');
  presetBlackDominantButton = document.getElementById('preset-black-dominant');
  
  // Set up initial slider values
  updateSliderDisplays();
  
  // Initialize model event listeners
  model.onTimeStep(handleTimeStep);
  
  // Create charts
  createCharts();
  
  // Set up button event listeners
  setupEventListeners();
  
  // Initialize 3D planet renderer if container exists
  if (planetContainer) {
    planetRenderer = new PlanetRenderer(planetContainer, model);
  }
  
  // Add initial data point to charts
  addTimeSeriesDataPoint({
    time: 0,
    temperature: model.getPlanetTemperature(),
    whiteDaisyCoverage: model.getWhiteDaisyCoverage(),
    blackDaisyCoverage: model.getBlackDaisyCoverage()
  });
  
  // Update charts with initial data
  updateCharts();
  
  // Update stats display with initial values
  updateStats(
    model.getPlanetTemperature(),
    model.getWhiteDaisyCoverage(),
    model.getBlackDaisyCoverage(),
    model.getBareSoilCoverage()
  );
  
  updateSimulationStatus('Simulation ready');
}

/**
 * Update all slider display values
 */
function updateSliderDisplays() {
  if (!simulationSpeedValue || !solarLuminosityValue || 
      !whiteDaisyCoverageValue || !blackDaisyCoverageValue || !deathRateValue) {
    return;
  }
  
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
  const temperatureCtx = document.getElementById('temperature-graph');
  const populationCtx = document.getElementById('population-graph');
  
  if (!temperatureCtx || !populationCtx) {
    return;
  }
  
  // Temperature chart
  temperatureChart = new Chart(temperatureCtx.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [{
        label: 'Planet Temperature (°C)',
        data: [],
        borderColor: 'rgb(255, 99, 132)',
        backgroundColor: 'rgba(255, 99, 132, 0.2)',
        borderWidth: 2,
        pointRadius: 0, // Hide points for smoother line
        pointHitRadius: 10, // But still allow interaction
        fill: true,
        tension: 0.4 // Smoother curve
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Global Temperature Over Time',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            // Convert Kelvin to Celsius in tooltips
            label: function(context) {
              const tempK = context.parsed.y;
              const tempC = (tempK - 273.15).toFixed(1);
              return `Temperature: ${tempC}°C (${tempK.toFixed(1)}K)`;
            }
          }
        },
        legend: {
          position: 'top'
        },
        // Add gradient fill
        filler: {
          propagate: true
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          title: {
            display: true,
            text: 'Temperature (K)'
          },
          beginAtZero: false,
          // Add reference lines for optimal temperature
          grid: {
            color: function(context) {
              // Add a colored line at the optimal temperature (295K)
              if (context.tick.value === 295) {
                return 'rgba(0, 255, 0, 0.5)';
              }
              return 'rgba(0, 0, 0, 0.1)';
            },
            lineWidth: function(context) {
              if (context.tick.value === 295) {
                return 2;
              }
              return 1;
            }
          }
        }
      },
      animation: {
        duration: 0 // Disable animation for performance
      },
      maintainAspectRatio: false
    }
  });
  
  // Population chart - improved visualization with stacked area chart
  populationChart = new Chart(populationCtx.getContext('2d'), {
    type: 'line',
    data: {
      labels: [],
      datasets: [
        {
          label: 'White Daisies',
          data: [],
          borderColor: 'rgb(220, 220, 220)',
          backgroundColor: 'rgba(220, 220, 220, 0.8)',
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          order: 3  // Drawing order (top layer)
        },
        {
          label: 'Black Daisies',
          data: [],
          borderColor: 'rgb(40, 40, 40)',
          backgroundColor: 'rgba(40, 40, 40, 0.8)',
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          order: 2  // Middle layer
        },
        {
          label: 'Bare Soil',
          data: [],
          borderColor: 'rgb(139, 69, 19)',
          backgroundColor: 'rgba(139, 69, 19, 0.8)',
          fill: 'origin',
          tension: 0.4,
          pointRadius: 0,
          order: 1  // Bottom layer
        }
      ]
    },
    options: {
      responsive: true,
      plugins: {
        title: {
          display: true,
          text: 'Surface Coverage Over Time',
          font: {
            size: 16,
            weight: 'bold'
          }
        },
        tooltip: {
          callbacks: {
            // Format percentages in tooltips
            label: function(context) {
              return `${context.dataset.label}: ${(context.parsed.y * 100).toFixed(1)}%`;
            }
          }
        },
        legend: {
          position: 'top'
        }
      },
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          title: {
            display: true,
            text: 'Time'
          }
        },
        y: {
          stacked: true,  // Enable stacking
          title: {
            display: true,
            text: 'Coverage (%)'
          },
          beginAtZero: true,
          max: 1,
          ticks: {
            // Convert decimal to percentage
            callback: function(value) {
              return (value * 100) + '%';
            }
          }
        }
      },
      animation: {
        duration: 0 // Disable animation for performance
      },
      maintainAspectRatio: false
    }
  });
  
  // Add a click event listener to the temperature chart for annotations
  temperatureCtx.onclick = function(event) {
    const points = temperatureChart.getElementsAtEventForMode(event, 'nearest', { intersect: true }, true);
    
    if (points.length) {
      const firstPoint = points[0];
      const time = temperatureChart.data.labels[firstPoint.index];
      const temp = temperatureChart.data.datasets[0].data[firstPoint.index];
      
      // Add annotation to chart
      addChartAnnotation(time, temp);
    }
  };
}

/**
 * Add an annotation to the temperature chart
 */
function addChartAnnotation(time, temperature) {
  // Implementation requires Chart.js annotation plugin
  // This is a placeholder for future enhancement
  console.log(`Annotation added at time ${time}, temperature ${temperature}`);
  
  // Update status to show clicked point data
  updateSimulationStatus(`Point selected - Time: ${time}, Temperature: ${temperature.toFixed(1)}K (${(temperature - 273.15).toFixed(1)}°C)`);
}

/**
 * Set up event listeners for UI controls
 */
function setupEventListeners() {
  if (!startButton || !pauseButton || !resetButton || !stepButton ||
      !simulationSpeedSlider || !solarLuminositySlider || 
      !whiteDaisyCoverageSlider || !blackDaisyCoverageSlider || !deathRateSlider ||
      !presetStableButton || !presetIncreasingButton || 
      !presetWhiteDominantButton || !presetBlackDominantButton) {
    console.error('UI elements not found');
    return;
  }
  
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
  
  // Update the stats display with initial values
  updateStats(
    model.getPlanetTemperature(),
    model.getWhiteDaisyCoverage(),
    model.getBlackDaisyCoverage(),
    model.getBareSoilCoverage()
  );
  
  updateSimulationStatus('Simulation reset');
}

/**
 * Perform a single simulation step
 */
function stepSimulation() {
  if (!model.isRunning()) {
    // Apply any pending parameter changes
    applyParameterChanges();
    
    // Run a step and capture result data
    const changes = model.step();
    console.log("Step changes:", changes);
    
    // Explicitly update all visuals
    drawPlanet();
    updateCharts();
    
    // Update stats display
    updateStats(
      model.getPlanetTemperature(),
      model.getWhiteDaisyCoverage(),
      model.getBlackDaisyCoverage(),
      model.getBareSoilCoverage()
    );
    
    updateSimulationStatus(`Simulation stepped - Temperature: ${model.getPlanetTemperature().toFixed(1)}K`);
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
  if (simulationStatus) {
    simulationStatus.textContent = message;
  }
}

/**
 * Handle time step event from the model
 */
function handleTimeStep(data) {
  // Add data to time series and log it for debugging
  console.log("Time step data received:", data);
  addTimeSeriesDataPoint(data);
  
  // Update visualizations
  if (planetRenderer) {
    planetRenderer.update(data);
  }
  updateCharts();
  
  // Force charts to update with latest data
  if (temperatureChart && populationChart) {
    temperatureChart.update('none');
    populationChart.update('none');
  }
  
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

// This function is no longer needed with 3D visualization
// Kept as a stub for compatibility with exported functions
function drawPlanet() {
  // With 3D renderer, we don't need this function anymore
  // Just update the stats display
  updateStats(
    model.getPlanetTemperature(),
    model.getWhiteDaisyCoverage(),
    model.getBlackDaisyCoverage(),
    model.getBareSoilCoverage()
  );
}

/**
 * Draw background sky with sun
 */
function drawSky(centerX, centerY, planetRadius, solarLuminosity) {
  // Find suitable position for the sun (top right of the canvas)
  const sunX = planetCanvas.width - planetCanvas.width / 5;
  const sunY = planetCanvas.height / 5;
  const sunRadius = planetRadius / 4 * solarLuminosity;
  
  // Draw glowing sun with varying intensity based on luminosity
  const sunGlow = planetCtx.createRadialGradient(
    sunX, sunY, 0,
    sunX, sunY, sunRadius * 2
  );
  
  // Base color varies with luminosity
  let sunColor;
  if (solarLuminosity < 0.8) {
    // Cooler, redder sun
    sunColor = `rgb(255, ${Math.floor(165 + 90 * solarLuminosity)}, 0)`;
  } else if (solarLuminosity > 1.2) {
    // Hotter, whiter sun
    sunColor = `rgb(255, 255, ${Math.floor(200 + 55 * (solarLuminosity - 1.2))})`;
  } else {
    // Normal yellow sun
    sunColor = 'rgb(255, 255, 0)';
  }
  
  sunGlow.addColorStop(0, sunColor);
  sunGlow.addColorStop(0.7, 'rgba(255, 255, 0, 0.3)');
  sunGlow.addColorStop(1, 'rgba(255, 255, 0, 0)');
  
  planetCtx.fillStyle = sunGlow;
  planetCtx.beginPath();
  planetCtx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
  planetCtx.fill();
  
  // Draw solid sun
  planetCtx.fillStyle = sunColor;
  planetCtx.beginPath();
  planetCtx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  planetCtx.fill();
  
  // Draw sun rays
  const rays = 12;
  const rayLength = sunRadius * 1.5;
  
  planetCtx.strokeStyle = sunColor;
  planetCtx.lineWidth = 2;
  
  for (let i = 0; i < rays; i++) {
    const angle = (i / rays) * Math.PI * 2;
    const startX = sunX + Math.cos(angle) * sunRadius;
    const startY = sunY + Math.sin(angle) * sunRadius;
    const endX = sunX + Math.cos(angle) * (sunRadius + rayLength);
    const endY = sunY + Math.sin(angle) * (sunRadius + rayLength);
    
    planetCtx.beginPath();
    planetCtx.moveTo(startX, startY);
    planetCtx.lineTo(endX, endY);
    planetCtx.stroke();
  }
}

/**
 * Draw a realistic pattern of daisies on the planet
 */
function drawDaisyPattern(centerX, centerY, radius, whiteCoverage, blackCoverage, bareSoilCoverage, patternSize) {
  // Create a grid of points within the planet circle
  const grid = [];
  const gridSize = radius * 2 / patternSize;
  
  // Calculate probabilities
  const total = whiteCoverage + blackCoverage + bareSoilCoverage;
  const whiteProb = whiteCoverage / total;
  const blackProb = blackCoverage / total;
  
  // Generate grid points
  for (let x = centerX - radius; x < centerX + radius; x += patternSize) {
    for (let y = centerY - radius; y < centerY + radius; y += patternSize) {
      // Check if point is within the circle
      const dx = x - centerX;
      const dy = y - centerY;
      if (Math.sqrt(dx * dx + dy * dy) <= radius) {
        // Add some randomization to grid positions for natural appearance
        const jitterX = (Math.random() - 0.5) * patternSize * 0.5;
        const jitterY = (Math.random() - 0.5) * patternSize * 0.5;
        
        grid.push({
          x: x + jitterX,
          y: y + jitterY,
          size: patternSize * (0.7 + Math.random() * 0.6)
        });
      }
    }
  }
  
  // Draw base soil
  planetCtx.fillStyle = '#8B4513';  // Brown soil
  planetCtx.beginPath();
  planetCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  planetCtx.fill();
  
  // Draw daisies on the grid
  grid.forEach(point => {
    const random = Math.random();
    
    if (random < whiteProb) {
      // Draw white daisy
      drawDaisy(point.x, point.y, point.size / 2, '#FFFFFF');
    } else if (random < whiteProb + blackProb) {
      // Draw black daisy
      drawDaisy(point.x, point.y, point.size / 2, '#202020');
    }
    // Otherwise, leave as bare soil
  });
  
  // Draw planet outline
  planetCtx.beginPath();
  planetCtx.arc(centerX, centerY, radius, 0, Math.PI * 2);
  planetCtx.strokeStyle = '#333';
  planetCtx.lineWidth = 2;
  planetCtx.stroke();
}

/**
 * Draw a daisy flower
 */
function drawDaisy(x, y, size, petalColor) {
  const petalCount = 8; // Number of petals
  
  // Draw petals
  planetCtx.fillStyle = petalColor;
  
  for (let i = 0; i < petalCount; i++) {
    const angle = (i / petalCount) * Math.PI * 2;
    const petalX = x + Math.cos(angle) * size * 0.7;
    const petalY = y + Math.sin(angle) * size * 0.7;
    
    planetCtx.beginPath();
    planetCtx.ellipse(
      petalX, petalY,
      size / 2, size / 3,
      angle,
      0, Math.PI * 2
    );
    planetCtx.fill();
  }
  
  // Draw center of daisy
  planetCtx.fillStyle = '#FFDD00';  // Yellow center
  planetCtx.beginPath();
  planetCtx.arc(x, y, size / 3, 0, Math.PI * 2);
  planetCtx.fill();
}

/**
 * Draw atmosphere effect
 */
function drawAtmosphere(centerX, centerY, radius) {
  // Create a soft glow for atmosphere
  const atmosphere = planetCtx.createRadialGradient(
    centerX, centerY, radius * 0.95,
    centerX, centerY, radius * 1.1
  );
  
  atmosphere.addColorStop(0, 'rgba(180, 220, 255, 0.3)');
  atmosphere.addColorStop(1, 'rgba(180, 220, 255, 0)');
  
  planetCtx.fillStyle = atmosphere;
  planetCtx.beginPath();
  planetCtx.arc(centerX, centerY, radius * 1.1, 0, Math.PI * 2);
  planetCtx.fill();
}

/**
 * Draw temperature scale
 */
function drawTemperatureScale(temperature, x, y) {
  const tempC = temperature - 273.15;
  const width = 200;
  const height = 20;
  
  // Draw gradient background
  const gradient = planetCtx.createLinearGradient(x - width/2, y, x + width/2, y);
  gradient.addColorStop(0, '#0000FF');   // Cold (blue)
  gradient.addColorStop(0.5, '#00FF00'); // Optimal (green)
  gradient.addColorStop(1, '#FF0000');   // Hot (red)
  
  planetCtx.fillStyle = gradient;
  planetCtx.fillRect(x - width/2, y, width, height);
  
  // Draw border
  planetCtx.strokeStyle = '#333';
  planetCtx.lineWidth = 1;
  planetCtx.strokeRect(x - width/2, y, width, height);
  
  // Draw temperature indicator
  const normalizedTemp = Math.max(0, Math.min(1, (tempC + 20) / 60)); // -20°C to 40°C
  const markerX = x - width/2 + width * normalizedTemp;
  
  planetCtx.fillStyle = '#FFF';
  planetCtx.beginPath();
  planetCtx.moveTo(markerX, y - 5);
  planetCtx.lineTo(markerX + 5, y);
  planetCtx.lineTo(markerX - 5, y);
  planetCtx.closePath();
  planetCtx.fill();
  
  // Draw temperature text
  planetCtx.fillStyle = '#000';
  planetCtx.font = '12px Arial';
  planetCtx.textAlign = 'center';
  planetCtx.fillText(`${tempC.toFixed(1)}°C (${temperature.toFixed(1)}K)`, x, y + height + 15);
}

/**
 * Update statistics display elements if they exist
 */
function updateStats(temperature, whiteCoverage, blackCoverage, bareSoilCoverage) {
  const temperatureElement = document.getElementById('temperature-value');
  const whiteDaisyElement = document.getElementById('white-daisy-value');
  const blackDaisyElement = document.getElementById('black-daisy-value');
  const bareSoilElement = document.getElementById('bare-soil-value');
  
  if (temperatureElement) {
    temperatureElement.textContent = `${(temperature - 273.15).toFixed(1)}°C`;
  }
  
  if (whiteDaisyElement) {
    whiteDaisyElement.textContent = `${(whiteCoverage * 100).toFixed(1)}%`;
  }
  
  if (blackDaisyElement) {
    blackDaisyElement.textContent = `${(blackCoverage * 100).toFixed(1)}%`;
  }
  
  if (bareSoilElement) {
    bareSoilElement.textContent = `${(bareSoilCoverage * 100).toFixed(1)}%`;
  }
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
  if (!temperatureChart || !populationChart) return;
  
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

// Export UI functions for testing
export {
  initializeUI,
  addTimeSeriesDataPoint, 
  clearTimeSeriesData,
  drawPlanet
};