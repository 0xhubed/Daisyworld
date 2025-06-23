# Daisyworld Simulation Specification

## Overview
Daisyworld is a theoretical model developed by James Lovelock to illustrate the Gaia hypothesis of planetary self-regulation. The simulation will model a simplified world populated by black and white daisies whose growth is affected by temperature, while their presence in turn affects the planet's albedo and temperature.

## Core Requirements

### Simulation Model
- **Planet Properties**:
  - Surface temperature (influenced by solar luminosity and surface albedo)
  - Average albedo (reflectivity) calculated from daisy populations and bare soil
  - Solar luminosity (input parameter that can change over time)
  
- **Daisy Properties**:
  - Two types: black (low albedo) and white (high albedo)
  - Population dynamics based on temperature-dependent growth rates
  - Death rate (constant)
  - Each daisy type's coverage area as percentage of planet surface
  
- **Growth Model**:
  - Daisies grow optimally at their ideal temperature
  - Growth rate decreases as temperature deviates from optimal
  - Growth limited by available bare soil
  - Temperature feedback loop: black daisies absorb heat (warming), white daisies reflect heat (cooling)

### Mathematical Model
- **Local Temperature Calculation**:
  - Calculate local temperature for each daisy type based on global temperature and albedo differences
  
- **Growth Rate Calculation**:
  - Parabolic function with maximum at optimal growth temperature
  - Zero growth below certain temperature and above certain temperature
  
- **Population Dynamics**:
  - Differential equations for population changes over time
  - Balance between new growth and death

- **Planetary Temperature**:
  - Stefan-Boltzmann law for radiative equilibrium
  - Weighted average albedo based on surface coverage

## User Interface Requirements

### Visualization Components
- **Main Display**:
  - Visual representation of planet surface showing relative coverage of white daisies, black daisies, and bare soil
  - Real-time updates as simulation progresses
  
- **Time Series Graphs**:
  - Temperature over time
  - Population percentages over time (white daisies, black daisies, bare soil)
  
- **Control Panel**:
  - Slider for solar luminosity adjustment
  - Simulation speed control
  - Start/pause/reset buttons
  - Parameter adjustment controls (initial populations, death rates, albedo values)

### Interactive Features
- **Parameter Adjustment**:
  - Allow users to modify key parameters and observe effects
  - Presets for different scenarios (e.g., increasing luminosity, stable state, population collapse)
  
- **Timeline Control**:
  - Ability to pause, resume, and step through simulation
  - Option to accelerate or slow down simulation speed

## Technical Implementation

### JavaScript Architecture
- **Simulation Core**:
  - Independent simulation engine with fixed time step
  - Model-View separation for clean architecture
  
- **Visualization Layer**:
  - Canvas-based rendering for the planet visualization
  - Chart.js (or similar) for time series graphs
  
- **User Interface**:
  - HTML/CSS for control layout
  - Event listeners for user interactions

### Default Parameters
- **Planet**:
  - Default bare soil albedo: 0.5
  - Stefan-Boltzmann constant: 5.67 × 10^-8 W/m²K⁴
  - Initial temperature: 295K (22°C)
  
- **Daisies**:
  - White daisy albedo: 0.75
  - Black daisy albedo: 0.25
  - Optimal growth temperature: 295K (22°C)
  - Death rate: 0.3 (30% die per time unit)
  - Initial populations: 20% white, 20% black, 60% bare soil

## Advanced Features (Optional)
- **Scenario Builder**:
  - Define custom scenarios with changing parameters over time
  
- **Export/Import**:
  - Save and load simulation states
  - Export data as CSV for external analysis
  
- **Multiple Planet Comparison**:
  - Run multiple simulations with different parameters side-by-side
  
- **Additional Variables**:
  - Add more daisy types with different properties
  - Include other factors like rainfall, nutrients, or seasonal variations

## Implementation Phases
1. **Core Simulation Engine** - Implement the mathematical model and basic time stepping
2. **Basic Visualization** - Create simple representation of population changes
3. **Interactive Controls** - Add user controls for parameters and simulation flow
4. **Enhanced Visualization** - Improve visual representation and add time series graphs
5. **Advanced Features** - Implement optional features as time permits