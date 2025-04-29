# Daisyworld Simulation

An interactive JavaScript simulation of James Lovelock's Daisyworld model, demonstrating the principles of planetary self-regulation.

## About Daisyworld

Daisyworld is a theoretical model developed by James Lovelock to illustrate the Gaia hypothesis of planetary self-regulation. The model demonstrates how life (represented by white and black daisies) can regulate planetary conditions (temperature) through feedback mechanisms, even as external conditions (solar luminosity) change.

## Features

- Interactive simulation of daisy population dynamics
- Real-time visualization of planet surface
- Time series graphs of temperature and population changes
- Adjustable parameters including solar luminosity, death rates, and initial conditions
- Presets for exploring different scenarios

## How It Works

The simulation models:

- Black daisies (absorb heat, warming their local environment)
- White daisies (reflect heat, cooling their local environment)
- Temperature-dependent growth rates for both daisy types
- Planetary temperature based on solar luminosity and surface albedo
- Competition for available space on the planet surface

The visualization shows how these elements interact in a self-regulating system that can maintain hospitable conditions across a range of solar luminosities.

## Phase 3: Interactive Controls

This phase implements the interactive user interface for the Daisyworld simulation, allowing users to control and observe the simulation's behavior in real-time.

### Control Panel Features

#### Simulation Controls
- **Start/Pause**: Begin or temporarily stop the simulation
- **Reset**: Reset the simulation to the current parameter values
- **Step**: Run a single time step of the simulation

#### Parameter Adjustments
- **Simulation Speed**: Control how quickly the simulation runs (0.1-10)
- **Solar Luminosity**: Adjust the sun's energy output (0.6-1.6)
- **White Daisy Coverage**: Set the initial percentage of white daisies (0-50%)
- **Black Daisy Coverage**: Set the initial percentage of black daisies (0-50%)
- **Death Rate**: Control the daisy death rate (10-50%)

#### Scenario Presets
- **Stable State**: A balanced ecosystem with stable temperatures
- **Increasing Luminosity**: Start with low luminosity that automatically increases over time
- **White Dominant**: An environment that favors white daisies
- **Black Dominant**: An environment that favors black daisies

### Visualization Components
- **Planet View**: Visual representation of the planet's surface composition
- **Temperature Graph**: Time series of global temperature
- **Population Graph**: Time series showing the percentage of each surface type

## Installation and Usage

1. Clone the repository
2. Navigate to the project directory
3. Install dependencies:
```
npm install
```
4. Run the development server:
```
npm start
```
5. Build for production:
```
npm run build
```

## Implementation

This project is built using:
- JavaScript for the simulation engine
- HTML Canvas for visualization
- Chart.js for time series graphs
- Webpack for bundling

## Development Status

This project is currently under development. See the [specification document](daisyworld-spec.md) for implementation details and roadmap.

## License

MIT