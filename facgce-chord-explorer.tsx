import React, { useState, useEffect } from 'react';
import { Music, RefreshCw, Lightbulb, Sun, Moon } from 'lucide-react';

const TUNING = ['F', 'A', 'C', 'G', 'C', 'E'];
const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

// Actual chord shapes that work well in FACGCE tuning
const CHORD_LIBRARY = {
  'Fmaj9': { frets: [0, 0, 0, 0, 0, 0], description: 'Open strings - the natural voicing' },
  'Fmaj7': { frets: [0, 0, 0, 0, 0, 0], description: 'Same as Fmaj9, emphasize different notes' },
  'C': { frets: [5, 7, 0, 0, 0, 7], description: 'C major with open strings' },
  'Cmaj7': { frets: [5, 7, 0, 0, 0, 0], description: 'C major 7 using open E' },
  'Am': { frets: [0, 0, 0, 2, 0, 0], description: 'A minor with resonant open strings' },
  'Am7': { frets: [0, 0, 0, 2, 0, 7], description: 'A minor 7' },
  'Dm': { frets: [3, 5, 2, 0, 0, 0], description: 'D minor' },
  'Dm7': { frets: [3, 5, 2, 0, 0, 5], description: 'D minor 7' },
  'G': { frets: [2, 4, 0, 0, 0, 0], description: 'G major with open strings' },
  'Gmaj7': { frets: [2, 4, 0, 0, 0, 7], description: 'G major 7' },
  'Em': { frets: [0, 2, 0, 0, 0, 0], description: 'E minor' },
  'Em7': { frets: [0, 2, 0, 5, 0, 0], description: 'E minor 7' },
  'Cadd9': { frets: [5, 7, 0, 2, 0, 7], description: 'C add 9' },
  'Asus2': { frets: [0, 0, 2, 2, 0, 0], description: 'A suspended 2' },
  'Dsus2': { frets: [3, 5, 0, 0, 0, 0], description: 'D suspended 2' },
  'Gsus4': { frets: [2, 4, 0, 0, 5, 0], description: 'G suspended 4' },
  'Bb': { frets: [0, 3, 0, 3, 3, 0], description: 'Bb major' },
  'Bbmaj7': { frets: [0, 3, 0, 3, 3, 5], description: 'Bb major 7' },
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
];

function getNoteFromString(stringNum, fret) {
  const openNote = TUNING[stringNum];
  const openNoteIndex = NOTES.indexOf(openNote);
  return NOTES[(openNoteIndex + fret) % 12];
}

function identifyChord(selectedFrets) {
  const notes = selectedFrets
    .map((fret, string) => fret >= 0 ? getNoteFromString(string, fret) : null)
    .filter(note => note !== null);
  
  if (notes.length === 0) return 'No notes selected';
  
  const uniqueNotes = [...new Set(notes)];
  
  if (uniqueNotes.length === 1) return `${uniqueNotes[0]} power chord`;
  if (uniqueNotes.length === 2) {
    // Two notes - could be power chord or interval
    return `${uniqueNotes[0]}/${uniqueNotes[1]} (interval)`;
  }
  
  // Convert notes to semitone values for interval calculation (C = 0)
  const noteToSemitone = (note) => NOTES.indexOf(note);
  const semitones = uniqueNotes.map(noteToSemitone);
  
  // Find the bass note (lowest note actually played, not just in the set)
  const playedNotes = selectedFrets
    .map((fret, string) => fret >= 0 ? getNoteFromString(string, fret) : null);
  const bassNote = playedNotes.find(n => n !== null);
  
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
      
      // Prefer roots in C major scale (C D E F G A B)
      const cMajorScale = [0, 2, 4, 5, 7, 9, 11]; // C D E F G A B
      if (cMajorScale.includes(rootSemitone)) {
        score += 20;
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
        score += 30;
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

function identifyChordType(intervals) {
  // intervals is an array of semitone distances from root, e.g., [0, 2, 4, 7, 9]
  const set = new Set(intervals);
  
  // Must include root (0)
  if (!set.has(0)) return null;
  
  // Helper to check if all required intervals are present
  const hasAll = (...required) => required.every(i => set.has(i));
  const hasAny = (...options) => options.some(i => set.has(i));
  
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

export default function ChordExplorer() {
  const [selectedFrets, setSelectedFrets] = useState(Array(6).fill(-1));
  const [currentProgression, setCurrentProgression] = useState(null);
  const [darkMode, setDarkMode] = useState(true);

  const handleFretChange = (stringIndex, value) => {
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
    const currentRoot = currentChordName.split('/')[0].replace(/[^A-G#b]/g, '');
    
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
    
    let selectedProgression;
    if (matchingProgressions.length > 0) {
      selectedProgression = matchingProgressions[Math.floor(Math.random() * matchingProgressions.length)];
    } else {
      selectedProgression = PROGRESSIONS[Math.floor(Math.random() * PROGRESSIONS.length)];
    }
    
    // Replace the matching chord in the progression with the user's exact fingering
    const modifiedProgression = {
      ...selectedProgression,
      chords: selectedProgression.chords.map(chord => {
        if (chord.nashville === currentNashville) {
          return {
            ...chord,
            name: currentChordName,
            frets: [...selectedFrets],
            isUserChord: true
          };
        }
        return chord;
      })
    };
    
    setCurrentProgression(modifiedProgression);
  };

  const loadChordShape = (frets) => {
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

  return (
    <div className={`min-h-screen p-6 ${darkMode ? 'bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 text-white' : 'bg-gradient-to-br from-gray-100 via-purple-100 to-gray-100 text-gray-900'}`}>
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8 relative">
          <button
            onClick={() => setDarkMode(!darkMode)}
            className={`absolute right-0 top-0 p-2 rounded-full transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-white hover:bg-gray-200 text-gray-900 shadow'}`}
          >
            {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </button>
          <div className="flex items-center justify-center gap-3 mb-2">
            <Music className={`w-8 h-8 ${darkMode ? 'text-purple-400' : 'text-purple-600'}`} />
            <h1 className="text-4xl font-bold">FACGCE Chord Explorer</h1>
          </div>
          <p className={darkMode ? 'text-gray-300' : 'text-gray-600'}>Discover chord voicings and progressions in open FACGCE tuning</p>
          <p className={`text-sm mt-1 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>Open strings: F major 9 (F-A-C-G-C-E)</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Chord Input Section */}
          <div className={`rounded-lg p-6 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Enter Chord Shape</h2>
              <button
                onClick={clearInput}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors text-sm"
              >
                Clear
              </button>
            </div>

            {/* Interactive fret inputs */}
            <div className={`mb-4 p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className={`text-sm mb-3 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Enter fret numbers (0 for open, x for muted):</div>
              <div className="grid grid-cols-6 gap-2">
                {selectedFrets.map((fret, idx) => (
                  <div key={idx} className="text-center">
                    <div className={`text-xs mb-1 font-semibold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{TUNING[idx]}</div>
                    <input
                      type="text"
                      value={fret < 0 ? '' : fret}
                      onChange={(e) => handleFretChange(idx, e.target.value)}
                      placeholder="x"
                      className={`w-full h-14 text-center text-xl font-mono rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-purple-500 ${
                        fret === 0
                          ? darkMode ? 'bg-green-900 border-green-500 text-white' : 'bg-green-100 border-green-500 text-green-900'
                          : fret > 0
                          ? darkMode ? 'bg-gray-800 border-purple-500 text-white' : 'bg-white border-purple-500 text-gray-900'
                          : darkMode ? 'bg-gray-900 border-gray-600 text-gray-500' : 'bg-gray-50 border-gray-300 text-gray-400'
                      }`}
                      maxLength="2"
                      autoComplete="off"
                      spellCheck="false"
                    />
                  </div>
                ))}
              </div>
              <div className={`mt-3 text-xs text-center ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                Tuning (low to high): F - A - C - G - C - E
              </div>
            </div>

            {/* Chord Analysis */}
            <div className={`p-4 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <h3 className="font-semibold mb-3">Chord Analysis</h3>
              <div className={`text-2xl font-bold mb-3 ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{chordName}</div>
              
              {notes.length > 0 && (
                <div className="space-y-2">
                  <div className={`text-sm ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Notes:</div>
                  <div className="flex flex-wrap gap-2">
                    {notes.map((n, i) => (
                      <span key={i} className={`px-3 py-1 rounded-full text-sm ${
                        n.fret === 0
                          ? darkMode ? 'bg-green-600 text-white' : 'bg-green-200 text-green-900'
                          : darkMode ? 'bg-purple-600 text-white' : 'bg-purple-200 text-purple-900'
                      }`}>
                        {n.note} {n.fret === 0 ? '(open)' : `(fret ${n.fret})`}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Progression Generator Section */}
          <div className={`rounded-lg p-6 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-yellow-400" />
                Progression Ideas
              </h2>
              <button
                onClick={generateProgression}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg transition-colors flex items-center gap-2 text-sm"
              >
                <RefreshCw className="w-4 h-4" />
                Generate
              </button>
            </div>

            {currentProgression ? (
              <div className="space-y-4">
                <div className={`p-3 rounded-lg ${darkMode ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <div className={`text-sm mb-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>Progression:</div>
                  <div className="font-semibold text-lg">{currentProgression.name}</div>
                  <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>Key of {currentProgression.key}</div>
                </div>

                <div className="space-y-3">
                  {currentProgression.chords.map((chord, idx) => (
                    <div key={idx} className={`p-4 rounded-lg transition-colors ${
                      chord.isUserChord
                        ? darkMode ? 'bg-purple-900 border-2 border-purple-500' : 'bg-purple-100 border-2 border-purple-400'
                        : darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                    }`}>
                      <div className="flex justify-between items-center mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm font-mono px-2 py-1 rounded ${darkMode ? 'bg-purple-900 text-white' : 'bg-purple-200 text-purple-900'}`}>
                              {chord.nashville}
                            </span>
                            <span className={`text-xl font-bold ${darkMode ? 'text-purple-300' : 'text-purple-600'}`}>{chord.name}</span>
                            {chord.isUserChord && (
                              <span className="text-xs bg-green-600 px-2 py-1 rounded">Your Chord</span>
                            )}
                          </div>
                        </div>
                        <button
                          onClick={() => loadChordShape(chord.frets)}
                          className="px-3 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm"
                        >
                          Load
                        </button>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {chord.frets.map((fret, string) => (
                          <div
                            key={string}
                            className={`w-8 h-8 flex items-center justify-center rounded text-xs font-mono ${
                              fret === 0
                                ? darkMode ? 'bg-green-700 text-white' : 'bg-green-200 text-green-900'
                                : darkMode ? 'bg-gray-800 text-white' : 'bg-gray-200 text-gray-900'
                            }`}
                          >
                            {fret < 0 ? 'X' : fret}
                          </div>
                        ))}
                      </div>
                      <div className={`text-xs ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                        {chord.frets.map((fret, string) =>
                          fret >= 0 ? getNoteFromString(string, fret) : null
                        ).filter(n => n).join(' - ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`text-center py-12 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>Click "Generate" to get chord progression ideas</p>
                <p className="text-sm mt-2">Progressions use Nashville Number System</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}