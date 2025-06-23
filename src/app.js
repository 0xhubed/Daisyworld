/**
 * Daisyworld Simulation
 * Main application entry point
 */

import { DaisyworldUI } from './ui.js';
import { DaisyworldModel } from './model.js';

// Create model and UI when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('Initializing Daisyworld simulation...');
  
  try {
    // Create the simulation model with default parameters
    const model = new DaisyworldModel();
    
    // Get the main container
    const container = document.getElementById('daisyworld-container');
    
    // Create the UI with the model
    const ui = new DaisyworldUI(container, model);
    
    // Expose model and UI to window for debugging
    window.daisyworldModel = model;
    window.daisyworldUI = ui;
    
    console.log('Daisyworld simulation initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Daisyworld simulation:', error);
  }
});