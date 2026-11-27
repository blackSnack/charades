# Party Deck Audio Lab — Cozy Party v0.1

Art direction: warm, relaxed, instrumental lounge outside play; cheerful, light, speech-friendly music during play. Every existing deck skin gets its own instrumentation, not a different game rule. Shared major/seventh-chord vocabulary and a recurring phrase shape; multiple grooves and keys.

The twelve EPs contain lounge/play arrangements (16 bars, loopable) and a twelve-event sound palette including four difficulty flips. The browser renders procedural instrument samples and score to an OfflineAudioContext on explicit audition; no external model, samples, or paid API are needed. All scores and synthesis definitions are editable in score.ts. This is a composition and sound palette prototype, not a sampled studio recording or final master. It uses no third-party recordings. No audio is played in the production game until listening approval. Only one preview plays; stop, return, selection change and document hiding cancel playback; rendering completion is guarded by a generation token.

Selections are per deck theme and audition scene; review notes persist locally and can be exported as JSON. They do not change game preferences. Human review: compare lounge/play pair, warmth, rhythm, instrumentation, fatigue over multiple loops, speech audibility, event recognition, and mobile speaker sound. Check real iOS/PWA playback before promotion.

References for future production (not runtime dependencies): owoevan-dev/music-skill (composition, arrangement and sampled instruments); GhazaGG/Game-Sound-Effect-for-Claude (layered events); JimCline/game-audio-kit (audition and review). Adopt sampled instruments and dedicated foley after direction approval, subject to licensing and human-managed build environment.
