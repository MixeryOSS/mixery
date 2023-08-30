# Mixery Engine
Welcome to Mixery Engine! This module is designed to be, well, modular so that you can integrate it with your project, without having to use the exact front-end framework that Mixery uses.

Mixery Engine handles workspaces system, projects, resources, audio nodes network, playback and more.

## Using Mixery Engine
Since Mixery Engine is quite complicated, we can't provide all usages in here. If you have a code editor/IDE with TypeScript support, you can use code suggestion feature to explore all stuffs that Mixery Engine offers. We suggest starting with `Project` object first:

```typescript
import * as mixery from "@mixery/engine";

const workspace = mixery.Workspace(new AudioContext());
const project = new mixery.Project(workspace);

// With `project`, you can add your own playlist track, add notes clip (a.k.a MIDI clip),
// manage project resources (with project.projectResources) and play with nodes network.
```

## Copyright and license
(c) The Mixery Contributors 2023. Licensed under GPL 3.0.