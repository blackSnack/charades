# Deck visual acceptance

References inspected: MengTo liquid-metal-border (SKILL.md blob a8b6c95092172b3fcfdad0cf68107ddb08bfd097), MiniMax shader-dev (SKILL.md blob 5b579b2eaa15e2748edb40f86c0329ef2904a43a), MetalFx 1.0.4 source. Only MetalFx is used for the new rim. No host environment installation.

- Main content is the actual Chinese question, not rarity badges or an emblem. Use the same QuestionWord sizing in the default game and candidate renderer. Four-character words target at least 80% of available width; longer phrases wrap to fit.
- Effects derive geometry from the card, not stage/window. Keep the center transparent; no fire canvas, smoke, ambient background, reflected glow or confetti. Static border is always usable.
- One active ring, reduced-motion/off/background removes GPU work; after reveal freeze the ring. No permission prompts. Existing game rules and saved games unchanged.
- Test real canvas edge alpha and zero center alpha, text size, four viewports, offline reopen, and retired theme migration. Screenshot evidence is not a human visual approval. iPhone acceptance remains manual.
