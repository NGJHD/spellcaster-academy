# Spellcaster Academy: The Broken Ward

![Uploading project-spellcaster-academy.webp…]()


A first-person 3D typing adventure for children aged about 8–10. You play a new apprentice at Asterfall Academy, and you cast spells by typing words. The game moves the camera and aims for you, so typing is the only skill you need.

The campaign has three levels and takes about 30–45 minutes:

1. **First Day, First Spell**: a sunny first day at the academy, until the ward cracks.
2. **The Siege of Asterfall**: a night-time fight to save the burning academy.
3. **Into the Unwritten**: a journey across a land of ash to the Unwriter's Cinder Citadel.

There is no violence or gore, and no ads or purchases. Mistakes are met with encouragement.

## Usage

### Playing

1. Download the latest `SpellcasterAcademy-vX.Y.Z.zip` from [Releases](https://github.com/NGJHD/spellcaster-academy/releases).
2. Unzip it and double-click `Play.cmd`.
3. The game opens at http://localhost:8737/ in your browser. Close the black window to stop it.

Use Microsoft Edge or Google Chrome on a computer with a decent graphics card. The launcher is needed because the browser can't load the game's 3D models straight from the files.

### Controls

| Key | Action |
| --- | --- |
| Letter keys | Type the word on a target |
| Backspace | Fix a mistake |
| Tab | Switch to another target |
| Enter / Space | Skip the current line of dialogue |
| Escape | Pause |

The mouse is only used in menus.

### Difficulty and settings

Choose **Gentle**, **Standard** or **Challenge** when you start. Gentle has shorter words and no damage. Settings include travel speed, font size, spoken dialogue, a live words-per-minute display, graphics quality and separate volume controls.

Progress saves automatically. **RESUME** carries on where you left off, and **Chapters** lets you replay finished levels.

## For Developers

### Requirements

- Node.js 24 and npm
- Microsoft Edge (for the browser tests)

### Commands

```bash
npm install
npm run dev          # http://localhost:5173
npm run test         # unit tests and headless playthroughs
npm run test:e2e     # Playwright browser tests in Edge
npm run typecheck
npm run lint
npm run build
```

### Built with

TypeScript, React, Vite, Three.js, React Three Fiber, drei, Zustand, Howler, Vitest and Playwright.

### Project docs

- [`CLAUDE.md`](CLAUDE.md): game-wide design rules
- [`LEVEL1_DESIGN.md`](LEVEL1_DESIGN.md), [`LEVEL2_DESIGN.md`](LEVEL2_DESIGN.md), [`LEVEL3_DESIGN.md`](LEVEL3_DESIGN.md): the levels
- [`BUILD_NOTES.md`](BUILD_NOTES.md): environment, architecture and asset pipeline
- [`RELEASE_GUIDE.md`](RELEASE_GUIDE.md): how to publish a new version

### Credits

Music and some textures and models are CC0, listed in [`public/audio/music/CREDITS.md`](public/audio/music/CREDITS.md) and [`assets-src/cc0/sources.json`](assets-src/cc0/sources.json). The other 3D models were generated with Blender and a local AI pipeline (Flux 2 and TRELLIS.2).

### License

[MIT](LICENSE)
