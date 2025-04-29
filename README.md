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

## Implementation

This project is built using:
- JavaScript for the simulation engine
- HTML Canvas for visualization
- Chart.js for time series graphs

## Development Status

This project is currently under development. See the [specification document](daisyworld-spec.md) for implementation details and roadmap.

## License

MIT