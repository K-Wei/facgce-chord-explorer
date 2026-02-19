# FACGCE Chord Explorer

An interactive chord explorer and progression generator for guitars in **FACGCE open tuning** (F-A-C-G-C-E) — a tuning popularized by bands like American Football in the midwest emo genre.

## Features

- **Chord Input & Analysis** — Enter fret numbers for each string and get real-time chord identification using a candidate-scoring algorithm that evaluates every possible root against 30+ chord types
- **40+ Preset Voicings** — Curated chord library organized by family (C, F, G, Am, Dm, Em, Bb, sus, moveable shapes, high-neck clusters, muted-string voicings)
- **24 Progression Templates** — Common and genre-specific progressions using Nashville Number System, including midwest emo staples with modal interchange and chromatic motion
- **Voice-Leading-Aware Suggestions** — Progressions are ranked by how smoothly they connect to your current chord (common tones, small finger movements, open-string drone bonuses)
- **Extension Suggestions** — "Try adding..." panel shows reachable chord extensions (add9, sus2, maj7, etc.) that are 1-2 finger movements away
- **Karplus-Strong Tuner** — Built-in string tuner using physical modeling synthesis with guitar body resonance simulation via Web Audio API
- **Dark/Light Mode** — Toggle between neutral/amber dark theme and light theme

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## How to Use

1. **Enter a chord shape** — Type fret numbers in the input boxes (one per string, low to high). Use `0` for open strings, `x` or leave blank to mute.
2. **Read the analysis** — The app identifies the chord name and displays the individual notes.
3. **Generate progressions** — Click "Generate" to get progression ideas. If you've entered a chord, the progression starts from your shape and is ranked by voice-leading smoothness.
4. **Explore extensions** — The "Try adding..." section suggests small finger changes that add musical color.
5. **Load presets** — Click "Load" on any progression chord to load its shape into the input.

## Tech Stack

- **React 19** + **TypeScript**
- **Tailwind CSS v4** (via Vite plugin)
- **Vite 7** (dev server + build)
- **Lucide React** (icons)
- **Web Audio API** (Karplus-Strong string synthesis for the tuner)

## Project Structure

```
facgce-chord-explorer.tsx   # Main component (~1270 lines, everything in one file)
src/main.tsx                # React entry point, imports the chord explorer
src/index.css               # Tailwind import
index.html                  # Vite HTML entry
```

### Key Functions

| Function | Purpose |
|---|---|
| `getNoteFromString(string, fret)` | Maps string index + fret to a note name |
| `identifyChord(selectedFrets)` | Scores every possible root to find the best chord match |
| `identifyChordType(intervals)` | Pattern-matches interval sets to 30+ chord types |
| `voiceLeadingScore(from, to)` | Scores transition smoothness between two chord shapes |
| `getExtensionSuggestions(frets, chord)` | Finds useful extensions reachable with small finger changes |
| `playNote(frequency)` | Karplus-Strong synthesis with body resonance filters |

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite dev server |
| `npm run build` | Type-check + production build |
| `npm run lint` | Run ESLint |
| `npm run preview` | Preview production build |

## Tuning Reference

| String | Note | Frequency |
|---|---|---|
| 6 (lowest) | F | 87.31 Hz |
| 5 | A | 110.00 Hz |
| 4 | C | 130.81 Hz |
| 3 | G | 196.00 Hz |
| 2 | C | 261.63 Hz |
| 1 (highest) | E | 329.63 Hz |

## License

Private project.
