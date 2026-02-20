import { useState, useEffect, useRef } from 'react';
import { Music, RefreshCw, Lightbulb, Sun, Moon, HelpCircle, X, MessageCircle } from 'lucide-react';
function TuningForkIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {/* Fork prongs */}
      <path d="M10 3v7a2 2 0 0 0 2 2v0a2 2 0 0 0 2-2V3" />
      {/* Handle */}
      <line x1="12" y1="12" x2="12" y2="21" />
      {/* Ball at bottom */}
      <circle cx="12" cy="21" r="1" fill="currentColor" />
      {/* Vibration waves left */}
      <path d="M6 4.5a4 4 0 0 0 0 5" />
      <path d="M3.5 3a7 7 0 0 0 0 8" />
      {/* Vibration waves right */}
      <path d="M18 4.5a4 4 0 0 1 0 5" />
      <path d="M20.5 3a7 7 0 0 1 0 8" />
    </svg>
  );
}

const TUNING = ['F', 'A', 'C', 'G', 'C', 'E'];
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Frequencies for each open string (low to high)
// F2, A2, C3, G3, C4, E4
const STRING_FREQUENCIES = [87.31, 110.00, 130.81, 196.00, 261.63, 329.63];

let audioCtx: AudioContext | null = null;
function getAudioContext(): AudioContext {
  if (!audioCtx) audioCtx = new AudioContext();
  return audioCtx;
}

function playNote(frequency: number) {
  const sampleRate = 44100;
  const duration = 3;
  const totalSamples = sampleRate * duration;
  const delayLength = Math.round(sampleRate / frequency);

  // Frequency-dependent damping: lower strings ring longer
  const damping = 0.994 + 0.004 * Math.min(1, frequency / 330);

  // Karplus-Strong: initialize delay line with shaped noise
  const delayLine = new Float32Array(delayLength);
  for (let i = 0; i < delayLength; i++) {
    delayLine[i] = Math.random() * 2 - 1;
  }

  // Pick position filter: simulate plucking at ~1/5 of string length
  // This removes every 5th harmonic, giving a rounder tone
  const pickPos = Math.round(delayLength / 5);
  for (let i = 0; i < delayLength; i++) {
    const blendIdx = (i + pickPos) % delayLength;
    delayLine[i] = 0.5 * (delayLine[i] + delayLine[blendIdx]);
  }

  // Pre-render the plucked string into a buffer
  const output = new Float32Array(totalSamples);
  let pos = 0;
  let prevFiltered = 0;
  for (let i = 0; i < totalSamples; i++) {
    const curr = delayLine[pos];
    const next = delayLine[(pos + 1) % delayLength];
    // Two-stage filter: averaging + one-pole low-pass for warmer decay
    const avg = 0.5 * (curr + next);
    const blendCoeff = 0.7; // controls brightness (lower = warmer)
    const filtered = damping * (blendCoeff * avg + (1 - blendCoeff) * prevFiltered);
    prevFiltered = filtered;
    delayLine[pos] = filtered;
    output[i] = curr;
    pos = (pos + 1) % delayLength;
  }

  // Play the rendered buffer through Web Audio with body resonance
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') ctx.resume();
  const buffer = ctx.createBuffer(1, totalSamples, sampleRate);
  buffer.getChannelData(0).set(output);

  const source = ctx.createBufferSource();
  source.buffer = buffer;

  // High-frequency roll-off to tame remaining tinny overtones
  const toneFilter = ctx.createBiquadFilter();
  toneFilter.type = 'lowpass';
  toneFilter.frequency.value = 2500;
  toneFilter.Q.value = 0.7;

  // Guitar body resonance — two peaks like a real acoustic body
  const body1 = ctx.createBiquadFilter();
  body1.type = 'peaking';
  body1.frequency.value = 180;
  body1.Q.value = 2;
  body1.gain.value = 6;

  const body2 = ctx.createBiquadFilter();
  body2.type = 'peaking';
  body2.frequency.value = 350;
  body2.Q.value = 1.5;
  body2.gain.value = 4;

  // Low-shelf boost for fullness
  const lowShelf = ctx.createBiquadFilter();
  lowShelf.type = 'lowshelf';
  lowShelf.frequency.value = 250;
  lowShelf.gain.value = 3;

  const master = ctx.createGain();
  master.gain.value = 0.4;

  source.connect(toneFilter);
  toneFilter.connect(body1);
  body1.connect(body2);
  body2.connect(lowShelf);
  lowShelf.connect(master);
  master.connect(ctx.destination);

  source.start();
}

// Actual chord shapes that work well in FACGCE tuning
// Grouped by family for discoverability
export const CHORD_LIBRARY = {
  // === F family (open string home base) ===
  'Fmaj9': { frets: [0, 0, 0, 0, 0, 0], family: 'F', description: 'Open strings — the natural voicing' },
  'Fmaj7': { frets: [0, 0, 0, 0, 0, 0], family: 'F', description: 'Same as Fmaj9, emphasize different notes' },
  'F6/9': { frets: [0, 0, 0, 2, 0, 0], family: 'F', description: 'F6/9 — open strings + fret 2 on G string' },

  // === C family ===
  'C': { frets: [5, 7, 0, 0, 0, 7], family: 'C', description: 'C major with open strings' },
  'Cmaj7': { frets: [5, 7, 0, 0, 0, 0], family: 'C', description: 'C major 7 using open E' },
  'Cadd9': { frets: [5, 7, 0, 2, 0, 7], family: 'C', description: 'C add 9 — lush with open strings' },
  'Cmaj9': { frets: [5, 7, 0, 2, 0, 0], family: 'C', description: 'C major 9 — dreamy midwest emo staple' },
  'Csus2': { frets: [5, 7, 0, 2, 0, 5], family: 'C', description: 'C sus2 with drone' },

  // === Am family ===
  'Am': { frets: [0, 0, 0, 2, 0, 0], family: 'Am', description: 'A minor with resonant open strings' },
  'Am7': { frets: [0, 0, 0, 2, 0, 7], family: 'Am', description: 'A minor 7' },
  'Am9': { frets: [0, 0, 0, 2, 3, 0], family: 'Am', description: 'Am9 — American Football style' },
  'Am(add9)': { frets: [0, 0, 2, 2, 0, 0], family: 'Am', description: 'Am add9 with open drones' },

  // === Dm family ===
  'Dm': { frets: [3, 5, 2, 0, 0, 0], family: 'Dm', description: 'D minor' },
  'Dm7': { frets: [3, 5, 2, 0, 0, 5], family: 'Dm', description: 'D minor 7' },
  'Dm9': { frets: [3, 5, 2, 0, 3, 0], family: 'Dm', description: 'Dm9 — rich minor color' },
  'Dsus2': { frets: [3, 5, 0, 0, 0, 0], family: 'Dm', description: 'D suspended 2 with open drones' },
  'Dsus4': { frets: [3, 5, 0, 0, 5, 0], family: 'Dm', description: 'D sus4 — resolves to D minor' },

  // === G family ===
  'G': { frets: [2, 4, 0, 0, 0, 0], family: 'G', description: 'G major with open strings' },
  'Gmaj7': { frets: [2, 4, 0, 0, 0, 7], family: 'G', description: 'G major 7' },
  'Gadd9': { frets: [2, 4, 0, 2, 0, 0], family: 'G', description: 'G add9 — sparkling upper extension' },
  'Gsus4': { frets: [2, 4, 0, 0, 5, 0], family: 'G', description: 'G suspended 4' },
  'G6': { frets: [2, 4, 0, 0, 0, 0], family: 'G', description: 'G6 — open string E gives the 6th' },

  // === Em family ===
  'Em': { frets: [0, 2, 0, 0, 0, 0], family: 'Em', description: 'E minor' },
  'Em7': { frets: [0, 2, 0, 5, 0, 0], family: 'Em', description: 'E minor 7' },
  'Em9': { frets: [0, 2, 0, 0, 0, 2], family: 'Em', description: 'Em9 — gentle, open' },
  'Em(add11)': { frets: [0, 2, 0, 0, 5, 0], family: 'Em', description: 'Em add11 with droning open C' },

  // === Bb family ===
  'Bb': { frets: [0, 3, 0, 3, 3, 0], family: 'Bb', description: 'Bb major' },
  'Bbmaj7': { frets: [0, 3, 0, 3, 3, 5], family: 'Bb', description: 'Bb major 7' },
  'Bbadd9': { frets: [0, 3, 0, 3, 0, 0], family: 'Bb', description: 'Bb add9 with open C drone' },

  // === Moveable shapes (drone-based) ===
  'Eb/F': { frets: [0, 0, 3, 0, 0, 0], family: 'Moveable', description: 'Eb over F bass — chromatic color' },
  'Db/F': { frets: [0, 0, 1, 0, 0, 0], family: 'Moveable', description: 'Db over F bass — tense, beautiful' },
  'Ab/C': { frets: [0, 0, 0, 0, 4, 4], family: 'Moveable', description: 'Ab major over C — borrowed chord' },
  'Fsus2': { frets: [0, 0, 0, 0, 1, 0], family: 'Moveable', description: 'F sus2 — one-finger change from open' },

  // === High-neck shapes with open drone ===
  'A/E (high)': { frets: [0, 0, 9, 0, 0, 9], family: 'High', description: 'A major high on neck, open drones ring' },
  'D (high)': { frets: [0, 0, 7, 7, 0, 0], family: 'High', description: 'D major cluster with open C+E' },
  'E (high)': { frets: [0, 0, 9, 9, 0, 0], family: 'High', description: 'E major high cluster with open drones' },

  // === Asus / sus family ===
  'Asus2': { frets: [0, 0, 2, 2, 0, 0], family: 'Sus', description: 'A suspended 2' },
  'Asus4': { frets: [0, 0, 0, 2, 5, 0], family: 'Sus', description: 'A sus4 with drone' },
  'Csus4': { frets: [5, 7, 0, 0, 5, 0], family: 'Sus', description: 'C sus4 — wants to resolve to C' },

  // === Muted-string voicings (tighter, focused) ===
  // C(0,0)=C, G(3,0)=G, C(4,0)=C, E(5,0)=E → C major ✓
  'C (tight)': { frets: [-1, -1, 0, 0, 0, 0], family: 'C', description: 'C major — upper strings only' },
  // C(2,0)=C, B(3,4)=B, C(4,0)=C, E(5,0)=E → Cmaj7(no5) ✓
  'Cmaj7 (tight)': { frets: [-1, -1, 0, 4, 0, 0], family: 'C', description: 'Cmaj7 — B on G string, no bass' },
  // A(1,0)=A, C(2,0)=C, A(3,2)=A, C(4,0)=C, E(5,0)=E → Am ✓
  'Am (mid)': { frets: [-1, 0, 0, 2, 0, 0], family: 'Am', description: 'Am without low F — cleaner' },
  // A(1,0)=A, C(2,0)=C, G(3,0)=G, C(4,0)=C, E(5,0)=E → Am7 ✓
  'Am7 (mid)': { frets: [-1, 0, 0, 0, 0, 0], family: 'Am', description: 'Am7 — open strings minus low F' },
  // D(2,2)=D, A(3,2)=A, C(4,0)=C, F(5,1)=F → Dm7 ✓
  'Dm7 (tight)': { frets: [-1, -1, 2, 2, 0, 1], family: 'Dm', description: 'Dm7 upper strings — compact' },
  // A(3,2)=A, C(4,0)=C, E(5,0)=E → Am ✓
  'Am (top)': { frets: [-1, -1, -1, 2, 0, 0], family: 'Am', description: 'Am — top three strings only' },
  // G(3,0)=G, C(4,0)=C, E(5,0)=E → C/G ✓
  'C/G': { frets: [-1, -1, -1, 0, 0, 0], family: 'C', description: 'C/G — second inversion, top three' },
  // F(0,0)=F, C(2,0)=C → F5 ✓
  'F5': { frets: [0, -1, 0, -1, -1, -1], family: 'F', description: 'F power chord — F and C only' },
  // C(2,0)=C, G(3,0)=G, D(4,2)=D, E(5,0)=E → Cadd9 ✓
  'Cadd9 (tight)': { frets: [-1, -1, 0, 0, 2, 0], family: 'C', description: 'Cadd9 — shimmering, no bass' },
};

// Common progressions in FACGCE (all in C major context)
// All fingerings are physically playable with extended harmony
const PROGRESSIONS = [
  {
    name: 'I - V - vi - IV',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cadd9', frets: [7, 9, 0, 2, 0, 0] },
      { nashville: 'V', name: 'Gadd11', frets: [2, 4, 0, 0, 5, 0] },
      { nashville: 'vi', name: 'Am7', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
    ]
  },
  {
    name: 'I - IV - V',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj7', frets: [5, 7, 0, 0, 0, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'V', name: 'Gsus4', frets: [2, 4, 0, 0, 5, 0] },
    ]
  },
  {
    name: 'vi - IV - I - V',
    key: 'C',
    chords: [
      { nashville: 'vi', name: 'Am11', frets: [0, 0, 0, 2, 5, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Cadd9', frets: [7, 9, 0, 2, 0, 0] },
      { nashville: 'V', name: 'G6', frets: [2, 4, 0, 0, 0, 0] },
    ]
  },
  {
    name: 'I - vi - ii - V',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj7', frets: [5, 7, 0, 0, 0, 0] },
      { nashville: 'vi', name: 'Am7', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'ii', name: 'Dm9', frets: [3, 5, 2, 0, 3, 0] },
      { nashville: 'V', name: 'Gadd11', frets: [2, 4, 0, 0, 5, 0] },
    ]
  },
  {
    name: 'ii - V - I',
    key: 'C',
    chords: [
      { nashville: 'ii', name: 'Dm7', frets: [3, 5, 2, 0, 3, 0] },
      { nashville: 'V', name: 'G6', frets: [2, 4, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'I - iii - vi - IV',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cadd9', frets: [7, 9, 0, 2, 0, 0] },
      { nashville: 'iii', name: 'Em7', frets: [0, 2, 0, 0, 3, 0] },
      { nashville: 'vi', name: 'Am7', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
    ]
  },
  {
    name: 'vi - V - IV - V',
    key: 'C',
    chords: [
      { nashville: 'vi', name: 'Am7', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'V', name: 'Gsus4', frets: [2, 4, 0, 0, 5, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'V', name: 'G6', frets: [2, 4, 0, 0, 0, 0] },
    ]
  },
  {
    name: 'I - iii - IV - V',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj7', frets: [5, 7, 0, 0, 0, 0] },
      { nashville: 'iii', name: 'Em11', frets: [0, 2, 0, 0, 5, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'V', name: 'Gadd11', frets: [2, 4, 0, 0, 5, 0] },
    ]
  },
  {
    name: 'IV - V - iii - vi (Royal Road)',
    key: 'C',
    chords: [
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'V', name: 'Gsus4', frets: [2, 4, 0, 0, 5, 0] },
      { nashville: 'iii', name: 'Em7', frets: [0, 2, 0, 0, 3, 0] },
      { nashville: 'vi', name: 'Am11', frets: [0, 0, 0, 2, 5, 0] },
    ]
  },
  {
    name: 'vi - ii - V - I',
    key: 'C',
    chords: [
      { nashville: 'vi', name: 'Am7', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'ii', name: 'Dm9', frets: [3, 5, 2, 0, 3, 0] },
      { nashville: 'V', name: 'G6', frets: [2, 4, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'I - ii - iii - IV',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
      { nashville: 'ii', name: 'Dm7', frets: [3, 5, 2, 0, 3, 0] },
      { nashville: 'iii', name: 'Em7', frets: [0, 2, 0, 0, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
    ]
  },
  {
    name: 'I - V - vi - iii - IV',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cadd9', frets: [7, 9, 0, 2, 0, 0] },
      { nashville: 'V', name: 'G6', frets: [2, 4, 0, 0, 0, 0] },
      { nashville: 'vi', name: 'Am11', frets: [0, 0, 0, 2, 5, 0] },
      { nashville: 'iii', name: 'Em7', frets: [0, 2, 0, 0, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
    ]
  },
  // === Midwest Emo Progressions ===
  {
    name: 'IV - ii - IV - I',
    key: 'C',
    chords: [
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'ii', name: 'Dm9', frets: [3, 5, 2, 0, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'vi - IV - I - V',
    key: 'C',
    chords: [
      { nashville: 'vi', name: 'Am9', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Cmaj7', frets: [5, 7, 0, 0, 0, 0] },
      { nashville: 'V', name: 'Gadd9', frets: [2, 4, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'I - iii - vi - ii',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
      { nashville: 'iii', name: 'Em9', frets: [0, 2, 0, 0, 0, 2] },
      { nashville: 'vi', name: 'Am9', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'ii', name: 'Dm9', frets: [3, 5, 2, 0, 3, 0] },
    ]
  },
  {
    name: 'IV - Vsus4 - V - I',
    key: 'C',
    chords: [
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'V', name: 'Gsus4', frets: [2, 4, 0, 0, 5, 0] },
      { nashville: 'V', name: 'Gadd9', frets: [2, 4, 0, 2, 0, 0] },
      { nashville: 'I', name: 'Cmaj7', frets: [5, 7, 0, 0, 0, 0] },
    ]
  },
  {
    name: 'I - IV - vi - IV',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cadd9', frets: [7, 9, 0, 2, 0, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'vi', name: 'Am7', frets: [0, 0, 0, 2, 0, 7] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
    ]
  },
  {
    name: 'vi - iii - IV - I',
    key: 'C',
    chords: [
      { nashville: 'vi', name: 'Am(add9)', frets: [0, 0, 2, 2, 0, 0] },
      { nashville: 'iii', name: 'Em7', frets: [0, 2, 0, 0, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'I - bVII - IV - I',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj7', frets: [5, 7, 0, 0, 0, 0] },
      { nashville: 'bVII', name: 'Bbmaj7', frets: [0, 3, 0, 3, 3, 5] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Cadd9', frets: [7, 9, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'IV - bVII - I',
    key: 'C',
    chords: [
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'bVII', name: 'Bb', frets: [0, 3, 0, 3, 3, 0] },
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'ii - iii - IV - V',
    key: 'C',
    chords: [
      { nashville: 'ii', name: 'Dm9', frets: [3, 5, 2, 0, 3, 0] },
      { nashville: 'iii', name: 'Em9', frets: [0, 2, 0, 0, 0, 2] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'V', name: 'Gsus4', frets: [2, 4, 0, 0, 5, 0] },
    ]
  },
  {
    name: 'I - Isus4 - IV - iv',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj7', frets: [5, 7, 0, 0, 0, 0] },
      { nashville: 'I', name: 'Csus4', frets: [5, 7, 0, 0, 5, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'iv', name: 'Fm', frets: [0, 0, 0, 0, 1, 0] },
    ]
  },
  {
    name: 'vi - V - IV - iii',
    key: 'C',
    chords: [
      { nashville: 'vi', name: 'Am9', frets: [0, 0, 0, 2, 3, 0] },
      { nashville: 'V', name: 'G6', frets: [2, 4, 0, 0, 0, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'iii', name: 'Em9', frets: [0, 2, 0, 0, 0, 2] },
    ]
  },
  {
    name: 'I - vi - iii - IV - V',
    key: 'C',
    chords: [
      { nashville: 'I', name: 'Cmaj9', frets: [5, 7, 0, 2, 0, 0] },
      { nashville: 'vi', name: 'Am(add9)', frets: [0, 0, 2, 2, 0, 0] },
      { nashville: 'iii', name: 'Em7', frets: [0, 2, 0, 0, 3, 0] },
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, 0, 0, 0] },
      { nashville: 'V', name: 'Gadd9', frets: [2, 4, 0, 2, 0, 0] },
    ]
  },
  {
    name: 'I - vi - ii - V (tight)',
    key: 'C',
    chords: [
      // C(0), G(0), C(0), E(0) → C major
      { nashville: 'I', name: 'C', frets: [-1, -1, 0, 0, 0, 0] },
      // A(0), C(0), G(0), C(0), E(0) → Am7
      { nashville: 'vi', name: 'Am7', frets: [-1, 0, 0, 0, 0, 0] },
      // D(2), A(2), C(0), F(1) → Dm7
      { nashville: 'ii', name: 'Dm7', frets: [-1, -1, 2, 2, 0, 1] },
      // G(0), C(0), E(0) → C/G
      { nashville: 'V', name: 'C/G', frets: [-1, -1, -1, 0, 0, 0] },
    ]
  },
  {
    name: 'IV - vi - I - vi (sparse)',
    key: 'C',
    chords: [
      // F(0), A(0), C(0), C(0), E(0) → F with open strings
      { nashville: 'IV', name: 'Fmaj9', frets: [0, 0, 0, -1, 0, 0] },
      // A(0), C(0), A(2), E(0) → Am
      { nashville: 'vi', name: 'Am', frets: [-1, 0, 0, 2, -1, 0] },
      // C(0), G(0), D(2), E(0) → Cadd9
      { nashville: 'I', name: 'Cadd9', frets: [-1, -1, 0, 0, 2, 0] },
      // A(0), C(0), A(2), C(0), E(0) → Am
      { nashville: 'vi', name: 'Am (mid)', frets: [-1, 0, 0, 2, 0, 0] },
    ]
  },
];

function getNoteFromString(stringNum: number, fret: number) {
  const openNote = TUNING[stringNum];
  const openNoteIndex = NOTES.indexOf(openNote);
  return NOTES[(openNoteIndex + fret) % 12];
}

function identifyChord(selectedFrets: number[]) {
  const notes = selectedFrets
    .map((fret: number, string: number) => fret >= 0 ? getNoteFromString(string, fret) : null)
    .filter((note: string | null) => note !== null);
  
  if (notes.length === 0) return 'No notes selected';
  
  const uniqueNotes = [...new Set(notes)];
  
  if (uniqueNotes.length === 1) return `${uniqueNotes[0]} power chord`;
  if (uniqueNotes.length === 2) {
    // Two notes - could be power chord or interval
    return `${uniqueNotes[0]}/${uniqueNotes[1]} (interval)`;
  }
  
  // Convert notes to semitone values for interval calculation (C = 0)
  const noteToSemitone = (note: string) => NOTES.indexOf(note);
  const semitones = uniqueNotes.map(noteToSemitone);
  
  // Find the bass note (lowest note actually played, not just in the set)
  const playedNotes = selectedFrets
    .map((fret: number, string: number) => fret >= 0 ? getNoteFromString(string, fret) : null);
  const bassNote = playedNotes.find((n: string | null) => n !== null);
  
  // Try each note as potential root
  const chordCandidates = [];
  
  for (let rootSemitone of semitones) {
    const rootNote = NOTES[rootSemitone];
    
    // Calculate intervals from this potential root
    const intervals = semitones
      .map(s => (s - rootSemitone + 12) % 12)
      .sort((a, b) => a - b);
    
    const chordType = identifyChordType(intervals);
    
    if (chordType !== null) {
      // Score this candidate
      let score = 100;
      
      // Slight preference for roots in C major scale (C D E F G A B)
      const cMajorScale = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
      if (cMajorScale.includes(rootSemitone)) {
        score += 5;
      }
      
      // Prefer common roots in FACGCE context
      const commonRoots = ['C', 'F', 'G', 'A', 'D', 'E'];
      if (commonRoots.includes(rootNote)) {
        score += 10;
      }
      
      // Prefer simpler chord types
      const simpleChords = ['', 'm', 'sus2', 'sus4', 'add9', 'madd9'];
      if (simpleChords.includes(chordType)) {
        score += 15;
      }
      
      // Prefer complete triads over partial voicings
      if (intervals.includes(0) && intervals.length >= 3) {
        const hasThird = intervals.includes(3) || intervals.includes(4);
        const hasFifth = intervals.includes(7);
        if (hasThird && hasFifth) {
          score += 25;
        }
      }
      
      // Bonus if root is the bass note (not an inversion)
      if (rootNote === bassNote) {
        score += 15;
      }
      
      chordCandidates.push({
        root: rootNote,
        type: chordType,
        intervals: intervals,
        score: score,
        noteCount: uniqueNotes.length
      });
    }
  }
  
  if (chordCandidates.length > 0) {
    chordCandidates.sort((a, b) => b.score - a.score);
    const best = chordCandidates[0];
    
    // Check if this is an inversion (bass note is not the root)
    if (best.root !== bassNote) {
      // This is a slash chord
      return `${best.root}${best.type}/${bassNote}`;
    }
    
    return `${best.root}${best.type}`;
  }
  
  return `Custom (${uniqueNotes.join(', ')})`;
}

function identifyChordType(intervals: number[]) {
  // intervals is an array of semitone distances from root, e.g., [0, 2, 4, 7, 9]
  const set = new Set(intervals);

  // Must include root (0)
  if (!set.has(0)) return null;

  // Helper to check if all required intervals are present
  const hasAll = (...required: number[]) => required.every(i => set.has(i));
  
  // TRIADS (most common)
  const hasThird = set.has(3) || set.has(4);
  const hasFifth = set.has(7);
  const hasMajorThird = set.has(4);
  const hasMinorThird = set.has(3);
  
  // Major triad: 0, 4, 7
  if (hasAll(4, 7)) {
    // Check for extensions
    if (set.has(11)) {
      if (set.has(2) || set.has(14)) return 'maj9';
      return 'maj7';
    }
    if (set.has(10)) {
      if (set.has(2) || set.has(14)) return '9';
      return '7'; // dominant 7
    }
    if (set.has(2) || set.has(14)) return 'add9';
    if (set.has(9)) return 'add6';
    return ''; // major
  }
  
  // Minor triad: 0, 3, 7
  if (hasAll(3, 7)) {
    if (set.has(10)) {
      if (set.has(2) || set.has(14)) return 'm9';
      return 'm7';
    }
    if (set.has(11)) return 'mmaj7';
    if (set.has(2) || set.has(14)) return 'madd9';
    if (set.has(9)) return 'm6';
    return 'm';
  }
  
  // Suspended chords (no third)
  if (!hasThird && hasFifth) {
    if (set.has(2)) {
      if (set.has(10)) return '7sus2';
      if (set.has(9)) return 'sus2add9';
      return 'sus2';
    }
    if (set.has(5)) {
      if (set.has(10)) return '7sus4';
      if (set.has(2) || set.has(9)) return 'sus4add9';
      return 'sus4';
    }
  }
  
  // Diminished: 0, 3, 6
  if (hasAll(3, 6)) {
    if (set.has(9)) return 'dim7';
    if (set.has(10)) return 'm7♭5';
    return 'dim';
  }
  
  // Augmented: 0, 4, 8
  if (hasAll(4, 8)) {
    if (set.has(11)) return 'augmaj7';
    if (set.has(10)) return 'aug7';
    return 'aug';
  }
  
  // Power chord (just root and fifth)
  if (set.size === 2 && set.has(7)) {
    return '5';
  }
  
  // Check for partial voicings or slash chords
  // If we have a third but no fifth, might still be identifiable
  if (hasMajorThird && !hasFifth) {
    if (set.has(2)) return 'add9(no5)';
    return '(no5)';
  }
  if (hasMinorThird && !hasFifth) {
    if (set.has(2)) return 'madd9(no5)';
    return 'm(no5)';
  }
  
  // Check for quartal harmony (stacked fourths)
  if (hasAll(5, 10)) return 'quartal';
  
  // If we get here and have 3+ notes, it's likely a valid chord we don't recognize
  if (intervals.length >= 3) {
    // Try to give some indication
    if (set.has(2) && set.has(7)) return 'sus2';
    if (set.has(4) && !set.has(7)) return 'maj(no5)';
    if (set.has(3) && !set.has(7)) return 'min(no5)';
  }
  
  return null;
}

// Score how smoothly one chord shape transitions to another (higher = smoother)
function voiceLeadingScore(fromFrets: number[], toFrets: number[]): number {
  let score = 0;

  for (let s = 0; s < 6; s++) {
    const from = fromFrets[s];
    const to = toFrets[s];

    // Both muted — neutral
    if (from < 0 && to < 0) continue;

    // Common tone (same fret, including both open)
    if (from === to) {
      score += 10;
      // Extra bonus for open string drones maintained
      if (from === 0) score += 5;
      continue;
    }

    // One muted, one played — moderate cost
    if (from < 0 || to < 0) {
      score -= 3;
      continue;
    }

    // Small movement (1-2 frets)
    const distance = Math.abs(to - from);
    if (distance <= 2) {
      score += 6 - distance * 2; // +4 for 1 fret, +2 for 2 frets
    } else {
      score -= distance; // Penalize big jumps
    }
  }

  return score;
}

// Get voice leading description between two chord shapes
function getVoiceLeadingHints(fromFrets: number[], toFrets: number[]): string[] {
  const hints: string[] = [];
  let stayCount = 0;
  let moveCount = 0;

  for (let s = 0; s < 6; s++) {
    if (fromFrets[s] === toFrets[s] && fromFrets[s] >= 0) {
      stayCount++;
    } else if (fromFrets[s] >= 0 && toFrets[s] >= 0) {
      moveCount++;
    }
  }

  if (stayCount > 0) hints.push(`${stayCount} string${stayCount > 1 ? 's' : ''} stay`);
  if (moveCount > 0) hints.push(`${moveCount} string${moveCount > 1 ? 's' : ''} move`);
  return hints;
}

// Musical extensions worth suggesting (interval name → semitones from root)
const EXTENSION_INTERVALS = {
  'add9': 2, 'sus2': 2, 'sus4': 5, 'maj7': 11, 'min7': 10, '6': 9, 'add11': 5,
};

// Given the current frets and identified chord, find extensions reachable with 1-2 finger changes
function getExtensionSuggestions(selectedFrets: number[], chordName: string) {
  const suggestions: { description: string; frets: number[]; resultName: string }[] = [];
  if (!chordName || chordName.startsWith('No ') || chordName.startsWith('Custom')) return suggestions;

  // Get the root note from the chord name
  const rootMatch = chordName.match(/^([A-G][#b]?)/);
  if (!rootMatch) return suggestions;
  const root = rootMatch[1];
  const rootSemitone = NOTES.indexOf(root);
  if (rootSemitone < 0) return suggestions;

  // Current notes as semitones from root
  const currentIntervals = new Set<number>();
  selectedFrets.forEach((fret, string) => {
    if (fret >= 0) {
      const note = getNoteFromString(string, fret);
      currentIntervals.add((NOTES.indexOf(note) - rootSemitone + 12) % 12);
    }
  });

  // For each string, try small fret changes (±1, ±2) and see if they add a useful extension
  const seen = new Set<string>();
  for (let string = 0; string < 6; string++) {
    const currentFret = selectedFrets[string];
    // Try fret values near current position, or from open/muted
    const candidates: number[] = [];
    if (currentFret < 0) {
      // Muted string — try opening it or fretting 1-3
      candidates.push(0, 1, 2, 3);
    } else {
      // Already played — try ±1, ±2 fret changes
      for (let delta = -2; delta <= 2; delta++) {
        if (delta === 0) continue;
        const newFret = currentFret + delta;
        if (newFret >= 0 && newFret <= 24) candidates.push(newFret);
      }
      // Also try muting (lifting finger)
      if (currentFret > 0) candidates.push(0);
    }

    for (const newFret of candidates) {
      const newNote = newFret >= 0 ? getNoteFromString(string, newFret) : null;
      if (!newNote) continue;
      const interval = (NOTES.indexOf(newNote) - rootSemitone + 12) % 12;
      if (currentIntervals.has(interval)) continue; // Already have this interval

      // Check if this interval is a musically useful extension
      for (const [extName, extInterval] of Object.entries(EXTENSION_INTERVALS)) {
        if (interval !== extInterval) continue;

        // Build the modified fret array
        const newFrets = [...selectedFrets];
        newFrets[string] = newFret;

        // Identify what the new chord would be called
        const resultName = identifyChord(newFrets);
        if (resultName.startsWith('No ') || resultName.startsWith('Custom')) continue;

        const actionVerb = currentFret < 0
          ? `play string ${string + 1} at fret ${newFret}`
          : newFret === 0
          ? `open string ${string + 1}`
          : currentFret === 0
          ? `fret ${newFret} on string ${string + 1}`
          : `move string ${string + 1} to fret ${newFret}`;

        const key = `${extName}-${interval}`;
        if (seen.has(key)) continue;
        seen.add(key);

        suggestions.push({
          description: `${actionVerb} → ${extName}`,
          frets: newFrets,
          resultName,
        });
      }
    }
  }

  return suggestions.slice(0, 5); // Cap at 5 suggestions
}

export default function ChordExplorer() {
  const [selectedFrets, setSelectedFrets] = useState(Array(6).fill(-1));
  const [currentProgression, setCurrentProgression] = useState<any>(null);
  const [darkMode, setDarkMode] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showTuner, setShowTuner] = useState(false);
  const [showCopilot, setShowCopilot] = useState(false);
  const [chatMessages, setChatMessages] = useState<{role:'user'|'assistant', content:string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleFretChange = (stringIndex: number, value: string) => {
    const newFrets = [...selectedFrets];
    const normalized = value.toLowerCase().trim();
    
    if (normalized === '' || normalized === 'x' || normalized === '-') {
      newFrets[stringIndex] = -1;
    } else {
      const num = parseInt(value);
      if (!isNaN(num) && num >= 0 && num <= 24) {
        newFrets[stringIndex] = num;
      }
    }
    
    setSelectedFrets(newFrets);
  };

  const clearInput = () => {
    setSelectedFrets(Array(6).fill(-1));
  };

  const generateProgression = () => {
    // Get the current chord
    const hasValidChord = selectedFrets.some(f => f >= 0);
    
    if (!hasValidChord) {
      // No chord entered, just pick a random progression
      const progression = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
      setCurrentProgression(progression);
      return;
    }
    
    // Get the current chord name and extract details
    const currentChordName = identifyChord(selectedFrets);
    // Find which Nashville number this chord would be in C major
    const rootToNashville = {
      'C': 'I',
      'D': 'II', 
      'Dm': 'ii',
      'E': 'III',
      'Em': 'iii',
      'F': 'IV',
      'G': 'V',
      'A': 'VI',
      'Am': 'vi',
      'B': 'VII',
      'Bm': 'vii°'
    };
    
    // Determine the Nashville number for the current chord
    let currentNashville = null;
    for (let [key, value] of Object.entries(rootToNashville)) {
      if (currentChordName.startsWith(key)) {
        currentNashville = value;
        break;
      }
    }
    
    // Filter progressions that include this Nashville number
    const matchingProgressions = PROGRESSIONS.filter(prog => 
      prog.chords.some(c => c.nashville === currentNashville)
    );
    
    // Score matching progressions by voice-leading smoothness from the user's chord
    let selectedProgression;
    if (matchingProgressions.length > 0) {
      const scored = matchingProgressions.map(prog => {
        const matchIdx = prog.chords.findIndex(c => c.nashville === currentNashville);
        // The chord after the user's chord (wrapping around)
        const nextChord = prog.chords[(matchIdx + 1) % prog.chords.length];
        const vlScore = voiceLeadingScore(selectedFrets, nextChord.frets);
        return { prog, vlScore };
      });
      scored.sort((a, b) => b.vlScore - a.vlScore);
      // Pick from top 3 (with some randomness) to maintain variety
      const topN = Math.min(3, scored.length);
      selectedProgression = scored[Math.floor(Math.random() * topN)].prog;
    } else {
      selectedProgression = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    }

    // Rotate the progression so the user's chord is the starting chord
    const matchIndex = selectedProgression.chords.findIndex(c => c.nashville === currentNashville);
    const rotatedChords = matchIndex > 0
      ? [...selectedProgression.chords.slice(matchIndex), ...selectedProgression.chords.slice(0, matchIndex)]
      : [...selectedProgression.chords];

    // Replace the matching chord with the user's exact fingering, add voice-leading hints
    const finalChords = rotatedChords.map((chord, idx) => {
      const isUser = chord.nashville === currentNashville;

      // Compute voice-leading hints from the previous chord
      let voiceLeadingHints: string[] | undefined;
      if (idx > 0) {
        const prevFrets = idx === 1 && rotatedChords[0].nashville === currentNashville
          ? selectedFrets
          : rotatedChords[idx - 1].frets;
        voiceLeadingHints = getVoiceLeadingHints(prevFrets, chord.frets);
      }

      return {
        ...chord,
        ...(isUser ? { name: currentChordName, frets: [...selectedFrets], isUserChord: true } : {}),
        voiceLeadingHints,
      };
    });

    const modifiedProgression = {
      ...selectedProgression,
      chords: finalChords,
    };

    setCurrentProgression(modifiedProgression);
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const sendMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMessage = chatInput.trim();
    setChatInput('');
    setChatLoading(true);
    const updatedMessages = [...chatMessages, { role: 'user' as const, content: userMessage }];
    setChatMessages(updatedMessages);
    try {
      const playedNotes = selectedFrets
        .map((f, i) => f >= 0 ? getNoteFromString(i, f) : null)
        .filter(Boolean);
      const extensionText = extensionSuggestions
        .map(s => `- ${s.description} → ${s.resultName}`)
        .join('\n') || 'None';
      const progressionText = currentProgression
        ? `Name: ${currentProgression.name}\nChords: ${currentProgression.chords.map((c: {name: string}) => c.name).join(' → ')}`
        : 'No progression selected';
      const systemPrompt = `You are a music theory assistant in a guitar chord explorer app.
Tuning: FACGCE open tuning (F-A-C-G-C-E, low to high).

CURRENT CHORD:
- Frets: [${selectedFrets.join(', ')}] (-1 = muted)
- Name: ${chordName}
- Notes: ${playedNotes.join(', ') || 'None'}

EXTENSION SUGGESTIONS:
${extensionText}

CURRENT PROGRESSION:
${progressionText}

Keep answers concise (2–5 sentences). Focus on practical music theory.`;
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
          systemPrompt,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || `Server error (${res.status})`);
      }
      const data = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', content: data.content }]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to get response';
      setChatMessages(prev => [...prev, { role: 'assistant', content: `Error: ${msg}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const loadChordShape = (frets: number[]) => {
    setSelectedFrets([...frets]);
  };

  const getNotes = () => {
    return selectedFrets.map((fret, string) => {
      if (fret < 0) return null;
      return {
        string,
        fret,
        note: getNoteFromString(string, fret)
      };
    }).filter(n => n !== null);
  };

  const chordName = identifyChord(selectedFrets);
  const notes = getNotes();
  const extensionSuggestions = notes.length > 0 ? getExtensionSuggestions(selectedFrets, chordName) : [];

  return (
    <div className={`min-h-dvh p-6 ${darkMode ? 'bg-neutral-950 text-white' : 'bg-stone-50 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="flex justify-center gap-2 mb-4">
            <button
              onClick={() => setShowCopilot(!showCopilot)}
              className={`p-2 rounded-full transition-colors ${showCopilot ? (darkMode ? 'bg-emerald-800 text-emerald-200' : 'bg-emerald-100 text-emerald-700') : (darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-gray-300' : 'bg-white hover:bg-gray-200 text-gray-600 shadow')}`}
              title="Music Theory Copilot"
            >
              <MessageCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowTuner(!showTuner)}
              className={`p-2 rounded-full transition-colors ${showTuner ? (darkMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-100 text-amber-700') : (darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-gray-300' : 'bg-white hover:bg-gray-200 text-gray-600 shadow')}`}
            >
              <TuningForkIcon className="w-5 h-5" />
            </button>
            <button
              onClick={() => setShowHelp(true)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-gray-300' : 'bg-white hover:bg-gray-200 text-gray-600 shadow'}`}
            >
              <HelpCircle className="w-5 h-5" />
            </button>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`p-2 rounded-full transition-colors ${darkMode ? 'bg-neutral-800 hover:bg-neutral-700 text-white' : 'bg-white hover:bg-gray-200 text-gray-900 shadow'}`}
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
          </div>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Music className={`w-8 h-8 hidden md:block ${darkMode ? 'text-amber-400' : 'text-amber-600'}`} />
            <h1 className="text-4xl font-bold tracking-tight">FACGCE Chord Explorer</h1>
          </div>
          <p className={darkMode ? 'text-gray-400' : 'text-gray-500'}>Voicings and progressions for open FACGCE tuning</p>
        </div>

        {/* Tuner Panel */}
        {showTuner && (
          <div className={`mb-6 rounded-xl p-4 flex items-center justify-center gap-3 ${darkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white shadow-lg'}`}>
            {TUNING.map((note, idx) => (
              <button
                key={idx}
                onClick={() => playNote(STRING_FREQUENCIES[idx])}
                className={`w-12 h-12 flex items-center justify-center rounded-lg text-lg font-bold transition-colors ${
                  darkMode
                    ? 'bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600'
                    : 'bg-gray-50 hover:bg-gray-100 active:bg-gray-200 border border-gray-200'
                }`}
              >
                {note}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-6 items-start">
          <div className="flex-1 grid md:grid-cols-2 gap-6 min-w-0">
          {/* Chord Input Section */}
          <div className={`rounded-xl p-6 ${darkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white shadow-lg'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Enter Chord Shape</h2>
              <button
                onClick={clearInput}
                className={`px-4 py-2 rounded-lg transition-colors text-sm ${darkMode ? 'bg-neutral-700 hover:bg-neutral-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
              >
                Clear
              </button>
            </div>

            {/* Interactive fret inputs */}
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-gray-50'}`}>
              <div className="grid grid-cols-6 gap-2">
                {selectedFrets.map((fret, idx) => (
                  <div key={idx} className="text-center">
                    <div className={`text-xs mb-1 font-semibold ${darkMode ? 'text-amber-400' : 'text-amber-700'}`}>{TUNING[idx]}</div>
                    <input
                      type="text"
                      value={fret < 0 ? '' : fret}
                      onChange={(e) => handleFretChange(idx, e.target.value)}
                      placeholder="x"
                      className={`w-full h-14 text-center text-xl font-mono rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                        fret === 0
                          ? darkMode ? 'bg-emerald-950 border-emerald-600 text-emerald-200' : 'bg-green-50 border-green-500 text-green-900'
                          : fret > 0
                          ? darkMode ? 'bg-neutral-900 border-amber-600 text-white' : 'bg-white border-amber-500 text-gray-900'
                          : darkMode ? 'bg-neutral-950 border-neutral-700 text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-400'
                      }`}
                      maxLength={2}
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Chord Analysis */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-gray-50'}`}>
              <h3 className="font-semibold mb-3">Chord Analysis</h3>
              <div className={`text-2xl font-bold mb-3 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{chordName}</div>

              {notes.length > 0 && (
                <div className="space-y-2">
                  <div className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Notes:</div>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((n, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-sm ${
                        n.fret === 0
                          ? darkMode ? 'bg-emerald-900 text-emerald-200' : 'bg-green-100 text-green-800'
                          : darkMode ? 'bg-neutral-700 text-gray-200' : 'bg-gray-200 text-gray-800'
                      }`}>
                        {n.note} {n.fret === 0 ? '(open)' : `(fret ${n.fret})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Extension Suggestions */}
            {extensionSuggestions.length > 0 && (
              <div className={`mt-4 p-4 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                <h3 className="font-semibold mb-3 flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  Try adding...
                </h3>
                <div className="space-y-2">
                  {extensionSuggestions.map((suggestion, i) => (
                    <button
                      key={i}
                      onClick={() => loadChordShape(suggestion.frets)}
                      className={`w-full text-left p-3 rounded-lg transition-colors text-sm ${
                        darkMode ? 'bg-neutral-700 hover:bg-neutral-600' : 'bg-white hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span className={darkMode ? 'text-gray-300' : 'text-gray-600'}>{suggestion.description}</span>
                      <span className={`ml-2 font-semibold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{suggestion.resultName}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Progression Generator Section */}
          <div className={`rounded-xl p-6 ${darkMode ? 'bg-neutral-900 border border-neutral-800' : 'bg-white shadow-lg'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Progression Ideas
              </h2>
              <button
                onClick={generateProgression}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Generate
              </button>
            </div>

            {currentProgression ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-neutral-800' : 'bg-gray-50'}`}>
                  <div className="font-semibold text-lg">{currentProgression.name}</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Key of {currentProgression.key}</div>
                </div>

                <div className="space-y-3">
                  {currentProgression.chords.map((chord: any, idx: number) => (
                    <div key={idx} className={`p-4 rounded-lg transition-colors ${
                      chord.isUserChord
                        ? darkMode ? 'bg-amber-950 border border-amber-700' : 'bg-amber-50 border-2 border-amber-400'
                        : darkMode ? 'bg-neutral-800 hover:bg-neutral-750' : 'bg-gray-50 hover:bg-gray-100'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-mono px-2 py-1 rounded ${darkMode ? 'bg-neutral-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                              {chord.nashville}
                            </span>
                            <span className={`text-xl font-bold ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>{chord.name}</span>
                            {chord.isUserChord && (
                              <span className={`text-xs px-2 py-1 rounded ${darkMode ? 'bg-amber-800 text-amber-200' : 'bg-amber-200 text-amber-800'}`}>Your Chord</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => loadChordShape(chord.frets)}
                          className={`px-3 py-1 rounded text-sm transition-colors ${darkMode ? 'bg-neutral-700 hover:bg-neutral-600 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                        >
                          Load
                        </button>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {chord.frets.map((fret: number, string: number) => (
                          <div
                            key={string}
                            className={`w-8 h-8 flex items-center justify-center rounded text-xs font-mono ${
                              fret < 0
                                ? darkMode ? 'bg-neutral-900 text-gray-500' : 'bg-gray-100 text-gray-400'
                                : fret === 0
                                ? darkMode ? 'bg-emerald-900 text-emerald-200' : 'bg-green-100 text-green-800'
                                : darkMode ? 'bg-neutral-700 text-white' : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            {fret < 0 ? 'X' : fret}
                          </div>
                        ))}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                        {chord.frets.map((fret: number, string: number) =>
                          fret >= 0 ? getNoteFromString(string, fret) : null
                        ).filter((n: string | null) => n).join(' - ')}
                      </div>
                      {chord.voiceLeadingHints && chord.voiceLeadingHints.length > 0 && (
                        <div className={`text-xs mt-1 italic ${darkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          {chord.voiceLeadingHints.join(', ')}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}>
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p>Enter a chord shape and hit Generate</p>
                <p className="text-sm mt-1">or just hit Generate for a random progression</p>
              </div>
            )}
          </div>
          </div>

          {/* Music Theory Copilot Sidebar */}
          {showCopilot && (
            <>
            {/* Mobile backdrop */}
            <div className="fixed inset-0 z-40 bg-black/50 md:hidden" onClick={() => setShowCopilot(false)} />
            <div className={`fixed inset-0 z-50 flex flex-col md:static md:inset-auto md:z-auto md:w-80 md:flex-shrink-0 md:rounded-xl md:sticky md:top-6 md:self-start ${darkMode ? 'bg-neutral-900 md:border md:border-neutral-800' : 'bg-white md:shadow-lg'}`}>
              <div className={`flex justify-between items-center px-4 py-3 border-b ${darkMode ? 'border-neutral-800' : 'border-gray-100'}`}>
                <span className="font-semibold text-sm">Music Theory Copilot</span>
                <div className="flex items-center gap-2">
                  {chatMessages.length > 0 && (
                    <button
                      onClick={() => setChatMessages([])}
                      className={`px-2 py-1 rounded text-xs transition-colors ${darkMode ? 'bg-neutral-700 hover:bg-neutral-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600'}`}
                    >
                      Clear
                    </button>
                  )}
                  <button
                    onClick={() => setShowCopilot(false)}
                    className={`p-1 rounded transition-colors ${darkMode ? 'hover:bg-neutral-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
              {/* Message history */}
              <div className={`overflow-y-auto p-3 flex-1 md:h-[420px] md:flex-none ${darkMode ? 'bg-neutral-800/50' : 'bg-gray-50'}`}>
                {chatMessages.length === 0 ? (
                  <div className={`text-center text-xs mt-8 ${darkMode ? 'text-gray-600' : 'text-gray-400'}`}>
                    Ask anything about music theory, chord voicings, or your current progression
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={`text-xs ${msg.role === 'user' ? 'text-right' : 'text-left'}`}>
                        <span className={`inline-block px-2.5 py-1.5 rounded-lg max-w-[90%] text-left whitespace-pre-wrap ${
                          msg.role === 'user'
                            ? darkMode ? 'bg-amber-900 text-amber-100' : 'bg-amber-100 text-amber-900'
                            : darkMode ? 'bg-neutral-700 text-gray-200' : 'bg-white border border-gray-200 text-gray-800'
                        }`}>
                          {msg.content}
                        </span>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>
                )}
              </div>
              {/* Suggested prompt chips */}
              <div className="flex flex-wrap gap-1.5 px-3 pt-3">
                {['Explain this chord', 'What scale fits?', 'Why does this progression work?'].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => setChatInput(prompt)}
                    className={`px-2.5 py-1 rounded-full text-xs transition-colors ${darkMode ? 'bg-neutral-700 hover:bg-neutral-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-600 border border-gray-200'}`}
                  >
                    {prompt}
                  </button>
                ))}
              </div>
              {/* Input row */}
              <div className="flex gap-2 p-3">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void sendMessage(); } }}
                  placeholder="Ask about music theory..."
                  disabled={chatLoading}
                  className={`flex-1 px-3 py-2 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 disabled:opacity-50 ${darkMode ? 'bg-neutral-800 border border-neutral-700 text-white placeholder-gray-600' : 'bg-gray-50 border border-gray-300 text-gray-900 placeholder-gray-400'}`}
                />
                <button
                  onClick={() => { void sendMessage(); }}
                  disabled={chatLoading || !chatInput.trim()}
                  className="px-3 py-2 bg-emerald-700 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-xs transition-colors flex items-center"
                >
                  {chatLoading ? <RefreshCw className="w-3 h-3 animate-spin" /> : '▶'}
                </button>
              </div>
            </div>
            </>
          )}
        </div>

      </div>

      {/* Help Modal */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowHelp(false)}>
          <div
            className={`max-w-lg w-full rounded-xl p-6 relative max-h-[80vh] overflow-y-auto ${darkMode ? 'bg-neutral-900 border border-neutral-700 text-gray-200' : 'bg-white text-gray-800 shadow-2xl'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowHelp(false)}
              className={`absolute top-4 right-4 p-1 rounded-full transition-colors ${darkMode ? 'hover:bg-neutral-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            >
              <X className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">How to use</h2>
            <div className="space-y-4 text-sm leading-relaxed">
              <div>
                <h3 className={`font-semibold mb-1 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Chord Input</h3>
                <p>Enter fret numbers for each string (low to high). Type <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${darkMode ? 'bg-neutral-700' : 'bg-gray-100'}`}>0</kbd> for open strings, <kbd className={`px-1.5 py-0.5 rounded text-xs font-mono ${darkMode ? 'bg-neutral-700' : 'bg-gray-100'}`}>x</kbd> to mute. The app identifies the chord and shows its notes.</p>
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Progressions</h3>
                <p>Hit <strong>Generate</strong> to get progression suggestions. If you've entered a chord, the progression starts from your shape and ranks options by voice-leading smoothness. Nashville numbers (I, ii, IV, etc.) show the function of each chord.</p>
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Try Adding...</h3>
                <p>After entering a chord, the app suggests reachable extensions (add9, sus2, maj7, etc.) that are 1-2 finger movements away. Click any suggestion to load it.</p>
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Chord Library</h3>
                <p>Quick access to preset voicings that work well in FACGCE. Click any chord name to load its shape into the input.</p>
              </div>
              <div>
                <h3 className={`font-semibold mb-1 ${darkMode ? 'text-amber-300' : 'text-amber-700'}`}>Tuner</h3>
                <p>Click any note to hear the open string pitch. Tune low to high: F - A - C - G - C - E.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}