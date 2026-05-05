# EcoPulse

EcoPulse is a browser-based ecosystem simulator built with React, Vite and Canvas.

Grass grows, prey feed, predators hunt, inherited traits mutate, seasons shift, migration changes pressure, and environmental disturbances can reshape the ecosystem over time.

The project runs fully in the browser and is hosted on GitHub Pages. No backend, database or server is required.

## Live demo

<https://maurits2905.github.io/ecopulse/>

## What it simulates

EcoPulse models a small artificial ecosystem with:

- Grass growth and resource depletion
- Prey movement, feeding, herding, reproduction and death
- Predator hunting, pack pressure, reproduction and starvation
- Inherited traits and mutation
- Seasonal pressure
- Terrain and biomes
- Migration from map edges
- Environmental disturbances
- Scenario objectives
- Timeline markers and population graphs

The goal is not to create a perfect biological model. The goal is to create a fun, visual and interactive simulation where simple rules create emergent behavior.

## Core systems

### Ecosystem loop

Each simulation tick updates:

1. Environmental events
2. Grass growth
3. Prey behavior
4. Predator behavior
5. Migration
6. Disease, wildfire and other disturbance effects
7. Statistics and timeline events

### Evolution

Prey and predators have inherited traits.

Prey traits include:

- Speed
- Vision
- Caution
- Metabolism
- Reproduction energy

Predator traits include:

- Speed
- Vision
- Aggression
- Metabolism
- Reproduction energy

Offspring inherit traits from their parent with small mutations. Survival pressure determines which traits become more common over time.

### Terrain

Terrain affects movement and survival.

- Grassland is normal land
- Fertile land regrows grass faster
- Barren land grows grass slowly
- Forest gives prey shelter
- Water blocks movement

Terrain is generated through biome-style noise and river/coast logic.

### Seasons

The world cycles through:

- Spring
- Summer
- Autumn
- Winter

Seasons modify grass growth and hunger pressure.

### Migration

Prey and predators can migrate into the world from the map edges. Migration can rescue collapsed populations or destabilize a balanced ecosystem.

### Environmental disturbances

Optional disturbances include:

- Drought
- Resource bloom
- Cold snap
- Prey disease
- Predator disease
- Wildfire

### Scenarios

Some presets have scenario objectives, such as:

- Keep both species alive until a target tick
- Reach a certain average generation
- Recover grass cover
- Avoid overpopulation or extinction

## Presets

EcoPulse includes several presets, including:

- Balanced Meadow
- Plain World
- Stable Ecosystem
- Migration Corridor
- Volatile World
- Behavior Lab
- Forest Refuge
- Broken Lands
- Wetlands
- Recovery Lab

## Controls

You can adjust:

- Simulation speed
- Map size
- Render detail
- Initial populations
- Population caps
- Grass growth
- Terrain generation
- Migration chance
- Disturbance chance
- Hunger and reproduction values
- Herding and pack behavior
- Mutation rate

You can also save, export, import and share exact experiment setups.

## Tech stack

- React
- Vite
- HTML Canvas
- LocalStorage
- GitHub Pages

## Running locally

Install dependencies:

    npm install

Start development server:

    npm run dev

Build production version:

    npm run build

Deploy to GitHub Pages:

    npm run deploy

## Project goal

EcoPulse is designed as a portfolio-friendly simulation project that combines:

- Frontend development
- Canvas rendering
- State simulation
- Emergent behavior
- Parameter tuning
- Data visualization
- Interactive UX

## Future roadmap

Planned improvements:

- Mobile and responsive layout polish
- Better terrain generation and smoother biome visuals
- More advanced charting and run summaries
- Replay/export of simulation outcomes
- Civilization mode with humans, resources, huts and roads
