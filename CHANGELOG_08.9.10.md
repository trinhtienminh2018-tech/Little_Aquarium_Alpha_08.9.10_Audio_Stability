# Alpha 08.9.10 — Audio Stability & Regression Checks

Base: Alpha 08.9.9 Coral Halo Fix.

- Prevent duplicate `HTMLAudioElement.play()` calls for already playing/pending ambient tracks.
- Treat `AbortError` from intentional play/pause races as expected and avoid technical toast notifications.
- Prevent repetitive autoplay denial notifications; retry after audio is explicitly toggled by user.
- Add two automated regression tests for duplicate play requests and expected interruption.
- Preserve scene transitions, aquarium plants, coral repair patches, weather, LED, and animal behaviors without modification.

Verification: `npm test` (7/7 passed), `npm run build` passed. Visual/audio browser verification is still required.
