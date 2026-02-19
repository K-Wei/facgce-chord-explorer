# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

An interactive chord explorer and progression generator for guitars in **FACGCE open tuning** (F-A-C-G-C-E). Built with React 19 + TypeScript + Tailwind CSS v4 + Vite 7. The core logic lives in a single file (`facgce-chord-explorer.tsx`, ~1270 lines) which is imported by `src/main.tsx` as the app root.

## Commands

- `npm run dev` — Start Vite dev server (localhost:5173)
- `npm run build` — Type-check (`tsc -b`) + production build
- `npm run lint` — ESLint
- `npm run preview` — Preview production build

## Dependencies

- `react` / `react-dom` (v19)
- `lucide-react` (Music, RefreshCw, Lightbulb, Sun, Moon, HelpCircle, X icons)
- `tailwindcss` v4 (via `@tailwindcss/vite` plugin, imported in `src/index.css`)
- Vite 7, TypeScript ~5.9

## Architecture

### File Layout

```
facgce-chord-explorer.tsx   # All component logic, constants, and helpers
src/main.tsx                # React entry point — imports ChordExplorer as App
src/index.css               # @import "tailwindcss"
index.html                  # Vite HTML entry
```

### facgce-chord-explorer.tsx Structure

**Constants (top of file):**
- `TUNING` — `['F', 'A', 'C', 'G', 'C', 'E']`
- `NOTES` — chromatic scale starting from C
- `STRING_FREQUENCIES` — Hz values for each open string (F2 through E4)
- `CHORD_LIBRARY` — ~40 preset chord shapes grouped by family (F, C, Am, Dm, G, Em, Bb, Moveable, High, Sus, muted-string voicings)
- `PROGRESSIONS` — 24 progressions using Nashville Number System in key of C, with mood/vibe tags

**Helper Functions:**
- `TuningForkIcon` — Custom SVG icon component
- `playNote(frequency)` — Karplus-Strong physical modeling synthesis with guitar body resonance (Web Audio API). Includes pick-position filtering, frequency-dependent damping, two-stage low-pass filtering, and body resonance EQ
- `getNoteFromString(stringNum, fret)` — Maps string index + fret to a note name via TUNING offsets into NOTES
- `identifyChord(selectedFrets)` — Candidate-scoring algorithm: tries every unique note as a potential root, computes intervals, identifies chord type, scores by C-major-scale membership, common FACGCE roots, chord simplicity, triad completeness, and root-position preference
- `identifyChordType(intervals)` — Pattern-matches interval sets to 30+ chord types (triads, 7ths, sus, dim, aug, extensions, power chords, quartal, partial voicings)
- `voiceLeadingScore(fromFrets, toFrets)` — Scores transition smoothness between two shapes (common tones +10, open drone bonus +5, small movements +4/+2, penalizes big jumps)
- `getVoiceLeadingHints(fromFrets, toFrets)` — Returns human-readable transition hints ("X strings stay, Y strings move")
- `getExtensionSuggestions(selectedFrets, chordName)` — Finds musically useful extensions (add9, sus2, sus4, maj7, min7, 6, add11) reachable with 1-2 finger changes on any string

**Main Component — `ChordExplorer` (default export):**
- State: `selectedFrets`, `currentProgression`, `darkMode`, `showHelp`, `showTuner`
- Two-column layout: chord input/analysis (left), progression suggestions (right)
- Progression generation: filters by Nashville number match, ranks by voice-leading score, rotates to start from user's chord, replaces matched chord with user's exact fingering

## Key Domain Details

- All fret arrays are 6 elements ordered low-to-high: `[F, A, C, G, C, E]`
- Fret value `-1` means muted/not played; `0` means open string; `1-24` means fretted
- Chord identification uses candidate-scoring, not exact lookup
- Progressions reference chords by Nashville numbers (I, ii, iii, IV, V, vi, vii°, bVII, iv) and include pre-baked fret shapes
- Voice-leading scoring prioritizes: common tones > open-string drones > small fret movements

## Git Workflow

- Commit after each logical feature or fix, not after every file change
- Each commit should be a coherent, reviewable unit
- Use descriptive commit messages that explain the "why" behind changes
- Commit automatically after completing each logical feature — don't wait for the user to ask
