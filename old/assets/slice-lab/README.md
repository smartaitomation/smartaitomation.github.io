# Slice Lab 3D studio

Entry point: `/cut-simulator.html`. Static HTML and local ES modules; no build step, CDN requests, accounts or backend.

The supplied reference photos guide the portrait framing, charcoal backdrop, low front camera, small beveled wooden board, large floating fruit, thin seams, pale rind, red flesh and droplets. This is an interactive real-time reconstruction, not the source video or a claim of identical photographic quality.

- Three.js 0.186.1: renderer and ConvexHull, copied from the existing workspace installation; MIT license in THREE-LICENSE.txt.
- cannon-es 0.20.0: rigid-body contacts, vendored from the npm distribution; MIT license in CANNON-LICENSE.txt.
- Original procedural textures and shaders in simulator.js and materials.js. No reference-photo pixels are embedded.
- Each cut splits the largest remaining solid. 1–40 cuts produce 2–41 pieces. Simplified convex collision hulls use 26 support directions; visible geometry retains its detailed cut faces.

Verification on 2026-10-15: JavaScript syntax passed. All five objects passed 40 sequential cuts with volume conservation, collision-hull creation and two seconds of gravity/contact simulation. In-app browser checked the portrait studio, single-cut halves, three-cut chunks and 40-cut pile. No warning/error logs in the final 40-cut browser check. This is browser evidence, not proof of performance on every mobile device.

Recording controls added 2026-10-15: Record starts a fresh replay, Stop finalizes, Download saves a local 720×1280 portrait clip with the game audio bus. The browser selects a supported MP4 or WebM codec; no camera, microphone, screen-sharing or upload is used. Mobile controls verified at 375×667. A real downloaded MP4 was decoded with ffmpeg: H.264 720×1280 video and AAC audio, with non-silent audio (peak −13.2 dB). A frame extracted at 0.2 seconds was visually inspected for the scene, background and cut-count overlay. Target capture is 30 fps; achieved frame rate depends on the device and scene. No physical-iPhone recording/export test was performed.
