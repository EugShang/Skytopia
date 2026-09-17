# SKYTOPIA Website

Vue 3 + Vite project page for **SKYTOPIA: Monocular Drone Navigation with Action-Conditioned Latent World Models**.

## Run locally

Use Node.js 20 and npm:

```bash
npm ci
npm run dev
```

Open the local URL printed by Vite. To check the production build, run `npm run build`. The generated `dist/` directory is ignored by Git.

## Page structure

- `src/main.js` mounts `src/App.vue`.
- `src/components/Main.vue` orders the live page: navigation, hero, project film, and research story.
- `src/components/sections/Title.vue` owns the title, authors, affiliations, logos, and resource buttons.
- `src/components/sections/HeroField.vue`, `forest-scene.js`, `forest-cloud.js`, and `forest-cloud-renderer.js` draw the procedural point-cloud forest on the homepage.
- `src/components/sections/YouTubeVideo.vue` embeds the project film configured in `src/project-media.js`.
- `src/components/sections/ResearchStory.vue` contains the abstract, insight, framework, platform, learning, deployment, results, and resources.
- `src/components/sections/GaussianSplats3D.vue` displays three selectable `.ksplat` scenes.

## Assets

- `src/assets/branding/` contains the logos imported by the hero and header.
- `src/assets/paper/` contains the figures imported by the research story.
- `public/favicon.png` has a fixed URL.
- `public/3dgs/` contains only the three scenes used by the interactive viewer.
- `public/videos/` contains the browser-ready simulation clips selected in the Evaluation section.
- `source-assets/` retains original videos and unpublished point-cloud candidates locally. It is ignored by Git and excluded from Vite builds.

The complete LaTeX paper is retained in `Skytopia__Monocular_Drone_Navigation_with_Action_Conditioned_Latent_World_Models/`. It is separate from the website build.

## GitHub Pages

The public project page is published at `https://eugshang.github.io/Skytopia/`.
The workflow in `.github/workflows/ci.yml` builds and deploys the site whenever
`main` is pushed. In the repository's **Settings → Pages**, select
**GitHub Actions** as the build and deployment source.

The full-resolution point clouds under `source-assets/` and the LaTeX paper
directory are not part of the website deployment.
