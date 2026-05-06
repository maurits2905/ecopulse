# EcoPulse

EcoPulse is a browser-based ecosystem simulator built with React, Vite and HTML Canvas.

Grass grows, prey feed, predators hunt, inherited traits mutate, seasons shift, migration changes pressure, environmental disturbances reshape the balance, and optional human civilization can alter the world through hunting, resource gathering, huts, roads and bridges.

The project runs fully in the browser and is hosted on GitHub Pages. No backend, database or server is required.

## Live demo

<https://maurits2905.github.io/ecopulse/>

## Project status

EcoPulse is currently considered a finished v1.0 portfolio project.

The goal is not to create a perfect biological model. The goal is to create a fun, visual and interactive simulation where simple rules create emergent behavior.

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
- Run summary reports
- Human civilization mode
- Roads, bridges and settlement pressure

## Core systems

### Ecosystem loop

Each simulation tick updates:

1. Environmental events
2. Grass growth
3. Prey behavior
4. Predator behavior
5. Migration
6. Civilization behavior
7. Roads and infrastructure
8. Disease, wildfire and other disturbance effects
9. Statistics, scenarios and timeline events

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

### Population pressure

The simulation includes carrying pressure, grass scarcity pressure and overpopulation die-off. This helps prevent prey or predators from growing endlessly when resources become limited.

### Terrain

Terrain affects movement and survival.

- Grassland is normal land
- Fertile land regrows grass faster
- Barren land grows grass slowly
- Forest gives prey shelter
- Water blocks movement unless a bridge exists

Terrain is generated through biome-style noise, water logic, rivers, lakes and region smoothing.

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

### Civilization

Civilization mode adds humans as an optional pressure layer.

Humans can:

- Gather food
- Gather wood
- Hunt prey
- Build huts
- Expand settlement capacity
- Create roads through repeated movement
- Build limited bridges over narrow water crossings
- Create pressure on nearby land and forests

Animals can also use bridges, which means human infrastructure can change movement patterns for the entire ecosystem.

### Roads and bridges

Roads appear naturally where humans repeatedly move. They slightly improve movement and fade if unused.

Bridges are built only when humans have enough resources and a useful crossing exists. Bridge placement is limited by cooldown, spacing rules and crossing width, so bridges do not appear everywhere.

### Scenarios

Some presets have scenario objectives, such as:

- Keep both species alive until a target tick
- Reach a certain average generation
- Recover grass cover
- Avoid overpopulation or extinction
- Survive environmental pressure

### Experiments

EcoPulse supports:

- Saving setups locally
- Exporting setup JSON
- Importing setup JSON
- Copying shareable setup URLs
- Copying run summaries

## Presets

EcoPulse includes several presets, including:

- Balanced Meadow
- Plain World
- Stable Ecosystem
- Continental Wilds
- Migration Corridor
- Volatile World
- Behavior Lab
- Civilization Frontier
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
- Human behavior
- Road and bridge behavior
- Population pressure

The interface uses a tabbed dashboard so the app stays manageable even with many systems enabled. Settings are grouped in a collapsible control center.

## How to use

1. Choose a preset.
2. Press Reset World.
3. Start the simulation.
4. Watch the population graph and timeline.
5. Use the inspector to inspect terrain, grass and individual animals.
6. Tune settings in the Control Center.
7. Save or export setups you want to keep.
8. Use the run report to summarize what happened.

Good starting presets:

- Stable Ecosystem for long-running coexistence
- Plain World for a clean baseline
- Continental Wilds for richer terrain
- Volatile World for disturbances
- Civilization Frontier for humans, roads and bridges

## Tech stack

- React
- Vite
- HTML Canvas
- LocalStorage
- GitHub Pages

## Project structure

```text
src/
  components/       UI panels, charts, controls and dashboard
  rendering/        Canvas rendering logic
  simulation/       Ecosystem, terrain, species, civilization and infrastructure logic
  utils/            Settings, persistence and helper utilities
```

## Running locally

Install dependencies:

```bash
npm install
```

Start development server:

```bash
npm run dev
```

Build production version:

```bash
npm run build
```

Deploy to GitHub Pages:

```bash
npm run deploy
```

## Project goal

EcoPulse is designed as a portfolio-friendly simulation project that combines:

- Frontend development
- Canvas rendering
- State simulation
- Emergent behavior
- Parameter tuning
- Data visualization
- Interactive UX
- Local persistence
- Shareable experiments

## Future ideas

EcoPulse is finished as a v1.0 project, but possible future improvements could include:

- Better terrain visuals and biome blending
- More advanced scenario scoring
- Replay/export of full simulation runs
- More advanced human settlements
- More detailed roads, trade routes and resource logistics
- Better mobile-specific controls
- Screenshots or GIFs in the README
