# OpenAI Build Week — Video Script Hand-off

## Context
- Hackathon: OpenAI Build Week (openai.devpost.com), submission deadline
  **July 21, 2026, 5:00 pm PDT** (= 2:00 AM July 22 CEST).
- I'm submitting 3 separate projects; this Project covers one of them.
- Recording setup: OBS Studio on Windows host (dev machine is WSL2),
  scene-switching between a reveal.js slide deck and live app/game.
  Recorded near-live in one take, ~2.5 min, minimal/no editing.
  Sped-up screen recordings pre-rendered with ffmpeg (setpts=PTS/4, -an)
  and embedded as autoplaying <video> slides in reveal.js.

## Video rules (hard requirements)
- Under 3 minutes — judges won't watch past 3:00. Target ~2:30.
- Must be a clear demo WITH audio narration covering BOTH:
  (a) what was built, (b) how Codex and GPT-5.6 were used
  → include a dedicated "How Codex/GPT-5.6 was used" slide.
- Upload to YouTube, set PUBLIC before the deadline; link goes in the form.
- No third-party trademarks, no copyrighted music/material → no background music.
- English. Project must actually function as depicted (no staged shots).
- Judges may judge from the video + text alone — the video IS the pitch.

## Aligned non-video requirements (keep consistent with the script)
- README must describe the Codex collaboration (where it accelerated work,
  key product/engineering decisions) — this is scored.
- Provide the /feedback Codex Session ID for the main build thread.
- Repo public (licensed) or shared with testing@devpost.com and
  build-week-event@openai.com.
- If the project pre-existed: document prior vs. new work with timestamps;
  only Submission-Period work is judged.
- Each of my 3 submissions must be unique and substantially different.
- Tracks: Apps for Your Life / Work & Productivity / Developer Tools /
  Education — one category per submission.

## Task for this Project
Help me write a tight ~400-word narration script mapped to reveal.js slides
(slide-by-slide: what's on screen, what I say, where scene-switches and
sped-up clips land), then iterate.
