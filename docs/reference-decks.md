# Four reference-deck experiment — design handoff

The four supplied concept boards are the visual source: Balatro paper/foil/holographic/negative ember, GWENT parchment/steel/silver-gold/masterwork, Monster Train old brass/smoke iron/crimson brass/molten iron, Inscryption paper/bone/wood/ritual. These are original interpretations, not game artwork or extracted game shaders. The supplied boards have mixed portrait/landscape templates; gameplay retains its existing landscape-adaptive dimensions and oversized Chinese word. No word-specific illustration, logo, or hint; decoration is redrawn in SVG rather than using a flattened concept-board image.

Implementation: geometry measured from the card; 16 explicit material rows; corner motifs mirror without stretching, straight rails adapt. Independent live word above art and GPU. GLSL signed-distance rim mask, foil specular, spectral shift, warm metal, noise-driven heat seams and candle flicker; bounded procedural perimeter particles. Low/off, hidden/reduced motion and WebGL loss fallback. Static gallery uses no GPU instances. No additional dependencies. Existing game rules, default theme and previous preferences preserved.

## Visual review gate

Target requested: 90–95% visual fidelity. This is a target, **not an automatic score**. Compare screenshots side by side to original concept boards after adapting the aspect ratio. Score per family/level: silhouette/ornament 25, material texture and depth 30, palette/contrast 20, motion/edge anchoring 15, word legibility 10. Art approval requires reviewer signoff; screenshot comparison alone does not establish fidelity. The automated test checks material identity, card geometry, visible word, screenshot all levels, real edge alpha and temporal variation, zero central GPU alpha. The first approved captures can become future pixel-diff baselines, not a substitute for review against the concept board. Real iPhone GPU performance is separate.

No approved fidelity score yet. Keep as an experimental candidate until reference review.
