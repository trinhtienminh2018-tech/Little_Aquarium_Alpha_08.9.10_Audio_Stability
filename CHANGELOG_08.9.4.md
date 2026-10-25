# Alpha 08.9.4 — Rendering CPU/GPU optimization

Based on Alpha 08.9.3.4, without modifying weather/lightning or daypart transition logic.

- Auto rendering: performance-aware 60/30 FPS controller with hysteresis (18 expensive frames to lower, 180 healthy frames to restore). User-selected 60/30/20 FPS presets remain untouched.
- Stop requesting animation frames while the page is hidden and reset frame delta on return.
- Skip redundant storm CSS variable writes for unchanged values.
- Skip expensive full-canvas clearing when wet-glass overlay remains fully dry.

## Verification
- JavaScript syntax and Node test run; browser GPU performance and visuals still need testing on the target PC.
- Run `npm start`, then compare Auto and manually selected rendering modes while switching dayparts, rain and window status.
