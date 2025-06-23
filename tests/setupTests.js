// Jest setup file

// Mock the Canvas API since it's not available in jsdom
class MockCanvasRenderingContext2D {
  constructor() {
    this.actions = [];
    
    // Create mock methods for all commonly used Canvas API methods
    const methods = [
      'arc', 'arcTo', 'beginPath', 'bezierCurveTo', 'clearRect', 'clip',
      'closePath', 'createImageData', 'createLinearGradient', 'createPattern',
      'createRadialGradient', 'drawImage', 'ellipse', 'fill', 'fillRect',
      'fillText', 'getImageData', 'getLineDash', 'getTransform', 'isPointInPath',
      'isPointInStroke', 'lineTo', 'measureText', 'moveTo', 'putImageData',
      'quadraticCurveTo', 'rect', 'resetTransform', 'restore', 'rotate',
      'save', 'scale', 'setLineDash', 'setTransform', 'stroke', 'strokeRect',
      'strokeText', 'transform', 'translate'
    ];
    
    methods.forEach(method => {
      this[method] = (...args) => {
        this.actions.push({ method, args });
        return this;
      };
    });
    
    // Properties
    this.fillStyle = '#000000';
    this.strokeStyle = '#000000';
    this.lineWidth = 1;
    this.font = '10px sans-serif';
    this.textAlign = 'start';
    this.textBaseline = 'alphabetic';
    this.globalAlpha = 1.0;
    this.globalCompositeOperation = 'source-over';
  }
}

// Mock HTMLCanvasElement
HTMLCanvasElement.prototype.getContext = function(contextType) {
  if (contextType === '2d') {
    return new MockCanvasRenderingContext2D();
  }
  return null;
};

// Add mock for requestAnimationFrame and cancelAnimationFrame
global.requestAnimationFrame = function(callback) {
  return setTimeout(callback, 0);
};

global.cancelAnimationFrame = function(id) {
  clearTimeout(id);
};

// Mock for ES module imports
jest.mock('chart.js', () => ({
  Chart: class MockChart {
    constructor(canvas, config) {
      this.canvas = canvas;
      this.config = config;
      this.data = config.data || { datasets: [] };
    }
    
    update() {
      // Mock implementation
    }
    
    destroy() {
      // Mock implementation
    }
  }
}), { virtual: true });