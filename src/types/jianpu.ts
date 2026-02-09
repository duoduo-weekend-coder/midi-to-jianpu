/** Jianpu digit 1-7 corresponding to do-re-mi-fa-sol-la-ti */
export type JianpuDigit = 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Accidental applied to a note */
export type Accidental = '#' | 'b' | '##' | 'bb' | null;

/**
 * Duration expressed as fraction of a whole note.
 * e.g. 1 = whole, 0.5 = half, 0.25 = quarter, 0.125 = eighth, etc.
 */
export type Duration = number;

/** A single Jianpu note */
export interface JianpuNote {
  type: 'note';
  /** Digit 1-7 */
  digit: JianpuDigit;
  /** Octave offset from middle octave (0). Positive = dots above, negative = dots below */
  octave: number;
  /** Accidental symbol */
  accidental: Accidental;
  /** Duration as fraction of whole note */
  duration: Duration;
  /** Original MIDI note number */
  midiNote: number;
  /** Augmentation dot */
  dotted: boolean;
  /** Tied to the next element */
  tiedToNext: boolean;
  /** Tied from the previous element */
  tiedFromPrev: boolean;
}

/** A chord (multiple simultaneous notes) */
export interface JianpuChord {
  type: 'chord';
  /** Notes in the chord, sorted bottom to top */
  notes: JianpuNote[];
  /** Duration (same for all notes) */
  duration: Duration;
  dotted: boolean;
  tiedToNext: boolean;
  tiedFromPrev: boolean;
}

/** A rest (rendered as "0") */
export interface JianpuRest {
  type: 'rest';
  duration: Duration;
  dotted: boolean;
}

/** A sustain dash (rendered as "-") */
export interface JianpuSustain {
  type: 'sustain';
  duration: Duration;
  dotted: boolean;
}

/** Any element that can appear in a beat group */
export type JianpuElement = JianpuNote | JianpuChord | JianpuRest | JianpuSustain;

/** A group of elements sharing a beam (underline) level */
export interface BeatGroup {
  /** Elements within this beat group */
  elements: JianpuElement[];
  /**
   * Beam level: 0 = quarter or longer (no underline),
   * 1 = eighth (1 underline), 2 = sixteenth (2 underlines), 3 = 32nd (3 underlines)
   */
  beamLevel: number;
}

/** Time signature */
export interface TimeSignature {
  numerator: number;
  denominator: number;
}

/** Key signature */
export interface KeySignature {
  /** Number of sharps (positive) or flats (negative) */
  sharpsOrFlats: number;
  /** Major or minor mode */
  mode: 'major' | 'minor';
  /** Root note name e.g. "C", "G", "F" */
  root: string;
}

/** A single measure */
export interface JianpuMeasure {
  /** Beat groups within this measure */
  beatGroups: BeatGroup[];
  /** Time signature (only set if it changes at this measure) */
  timeSignature?: TimeSignature;
  /** Measure number (1-based) */
  measureNumber: number;
}

/** A single voice/track */
export interface JianpuVoice {
  /** Display name */
  name: string;
  /** Original MIDI track index */
  trackIndex: number;
  /** Measures in this voice */
  measures: JianpuMeasure[];
  /** Whether this voice is visible */
  visible: boolean;
}

/** The complete score */
export interface JianpuScore {
  /** Title from MIDI file name or metadata */
  title: string;
  /** Key signature (always 1=C) */
  keySignature: KeySignature;
  /** Initial time signature */
  timeSignature: TimeSignature;
  /** Tempo in BPM */
  tempo: number;
  /** All voices in the score */
  voices: JianpuVoice[];
  /** Total number of measures */
  measureCount: number;
}

/** Layout types */
export interface LayoutMeasure {
  measureIndex: number;
  width: number;
}

export interface LayoutSystem {
  measures: LayoutMeasure[];
  y: number;
  totalWidth: number;
}

export interface LayoutPage {
  pageNumber: number;
  systems: LayoutSystem[];
}

export interface ScoreLayout {
  pages: LayoutPage[];
  pageWidth: number;
  pageHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
}

/** Parsed MIDI data (intermediate representation) */
export interface ParsedMidiNote {
  /** MIDI note number (0-127) */
  midi: number;
  /** Start time in ticks */
  startTick: number;
  /** Duration in ticks */
  durationTicks: number;
  /** Start time in seconds */
  startTime: number;
  /** Duration in seconds */
  durationSeconds: number;
  /** Velocity 0-127 */
  velocity: number;
}

export interface ParsedMidiTrack {
  name: string;
  notes: ParsedMidiNote[];
  instrument: string;
  channel: number;
}

export interface ParsedMidi {
  name: string;
  tracks: ParsedMidiTrack[];
  timeSignatures: Array<{ ticks: number; timeSignature: [number, number] }>;
  keySignatures: Array<{ ticks: number; key: string; scale: string }>;
  tempos: Array<{ ticks: number; bpm: number }>;
  ppq: number; // pulses per quarter note
  durationTicks: number;
}
