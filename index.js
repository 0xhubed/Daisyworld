/**
 * Daisyworld Simulation
 * Main entry point for the Daisyworld model
 */

// Import model classes
const { DaisyworldModel, Planet, Daisy } = require('./src/model');

// Export model classes
if (typeof window !== 'undefined') {
  // In browser environment, attach to window object
  window.DaisyworldModel = DaisyworldModel;
  window.Planet = Planet;
  window.Daisy = Daisy;
} else {
  // In Node.js environment, use module.exports
  module.exports = {
    DaisyworldModel,
    Planet,
    Daisy
  };
}