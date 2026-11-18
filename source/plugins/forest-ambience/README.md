# Forest ambience

Optional authored wind and bird-like tones, not a recovered recording or canon
soundtrack. No sound, timers, requests or DOM mutations occur at definition time.
`pinpinCreateAmbience()` creates a controller; audio starts only after the user's
Sound button gesture. The noise buffer is bounded to three seconds, bird voices
stop after 0.15 seconds, and hidden pages suspend the audio context. The renderer
calls `dispose()` on page teardown. Disable this pre-phase plugin independently
in the manifest; the Sound control then becomes unavailable.
