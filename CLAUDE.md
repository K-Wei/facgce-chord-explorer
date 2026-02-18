# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A single-file React component (`facgce-chord-explorer.tsx`) that provides an interactive chord explorer for guitars in **FACGCE open tuning** (F-A-C-G-C-E). No build system, package.json, or project configuration exists — this is a standalone component meant to be embedded in a React project.

## Dependencies (via imports)

- `react` (useState)
- `lucide-react` (Music, RefreshCw, Lightbulb icons)
- Tailwind CSS (utility classes in JSX)

## Architecture

Everything lives in `facgce-chord-explorer.tsx` (~630 lines):

- **Constants** (top of file): `TUNING`, `NOTES` (chromatic scale), `CHORD_LIBRARY` (17 preset shapes with fret arrays), `PROGRESSIONS` (13 progressions using Nashville Number System in key of C)
- **`getNoteFromString(stringNum, fret)`**: Maps string index + fret to a note name using TUNING offsets into NOTES array
- **`identifyChord(selectedFrets)`**: Scoring algorithm that tries every note as a potential root, computes intervals, identifies chord type, and picks the best match. Scoring favors C-major-scale roots, common FACGCE roots (F/C/G/Am/Dm), simpler chord types, complete triads, and root-position voicings
- **`identifyChordType(intervals)`**: Pattern-matches interval sets to 30+ chord types (triads, 7ths, sus, dim, aug, extensions, power chords, quartal)
- **`ChordExplorer` (default export)**: Main React component with two state values (`selectedFrets`, `currentProgression`). Renders a two-column layout: chord input/analysis on the left, progression suggestions on the right

## Key Domain Details

- All fret arrays are 6 elements ordered low-to-high: `[F, A, C, G, C, E]`
- Fret value `-1` means muted/not played; `0` means open string
- Chord identification uses a candidate-scoring approach, not exact lookup
- Progressions reference chords by Nashville numbers (I, ii, iii, IV, V, vi, vii°) and include pre-baked fret shapes for each chord in the progression
