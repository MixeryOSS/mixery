# Mixery
Welcome to Mixery, the free and open source digital audio workspace for the web.

This is the monorepo for Mixery, using pnpm workspace. Other repositories that previously related to the development of Mixery will be archived in the future.

## Features
- Nodes editor (like Blender shaders, but for audio).
    + Basically Web Audio API but with user interface.
- Runs in your browser.
    + Assuming you are using Chromium browsers like MS Edge or Google Chrome or something like that
- MIDI editor (a.k.a "piano roll") and patterns editor.

## Quick start
_Not available yet, come back later ;)_

### Development "mode"
You can start a server by starting Vue dev server inside `modules/ui`:

```console
$ cd modules/ui
$ pnpm install
$ pnpm dev
```

## Shortcuts n' keys (in most scenarios)
- Hold Shift to swap between X axis and Y axis while scrolling (so if you are on desktop, hold Shift while scrolling to scroll horizontally).
- Hold Ctrl and scroll to zoom. Some editors allows you to zoom vertically and horizontally, like piano roll for example.

## Copyright and license
(c) The Mixery Contributors 2023. Licensed under GPL 3.0.

Surely you can't just slap ads on your private fork of Mixery and call it a day.