import type { JianpuDigit, Accidental } from '../types/jianpu';

/**
 * Mapping from MIDI pitch class (0-11) to Jianpu digit + accidental.
 * Always 1=C (no transposition).
 * Index 0 = C, 1 = C#, ..., 11 = B
 */
export interface NoteMapping {
  digit: JianpuDigit;
  accidental: Accidental;
}

/**
 * Sharp-preference mapping (for keys with sharps: G, D, A, E, B, F#, C#)
 */
export const SHARP_NOTE_MAP: NoteMapping[] = [
  { digit: 1, accidental: null },   // C
  { digit: 1, accidental: '#' },    // C#
  { digit: 2, accidental: null },   // D
  { digit: 2, accidental: '#' },    // D# (use sharp)
  { digit: 3, accidental: null },   // E
  { digit: 4, accidental: null },   // F
  { digit: 4, accidental: '#' },    // F#
  { digit: 5, accidental: null },   // G
  { digit: 5, accidental: '#' },    // G# (use sharp)
  { digit: 6, accidental: null },   // A
  { digit: 6, accidental: '#' },    // A# (use sharp)
  { digit: 7, accidental: null },   // B
];

/**
 * Flat-preference mapping (for keys with flats: F, Bb, Eb, Ab, Db, Gb, Cb)
 */
export const FLAT_NOTE_MAP: NoteMapping[] = [
  { digit: 1, accidental: null },   // C
  { digit: 2, accidental: 'b' },    // Db
  { digit: 2, accidental: null },   // D
  { digit: 3, accidental: 'b' },    // Eb
  { digit: 3, accidental: null },   // E
  { digit: 4, accidental: null },   // F
  { digit: 5, accidental: 'b' },    // Gb
  { digit: 5, accidental: null },   // G
  { digit: 6, accidental: 'b' },    // Ab
  { digit: 6, accidental: null },   // A
  { digit: 7, accidental: 'b' },    // Bb
  { digit: 7, accidental: null },   // B
];

/**
 * Default mapping (C major / A minor) - use sharps for accidentals
 */
export const DEFAULT_NOTE_MAP = SHARP_NOTE_MAP;

/**
 * Key signature to sharps/flats count mapping.
 * Positive = sharps, negative = flats.
 */
export const KEY_SIGNATURE_MAP: Record<string, number> = {
  'C major': 0, 'A minor': 0,
  'G major': 1, 'E minor': 1,
  'D major': 2, 'B minor': 2,
  'A major': 3, 'F# minor': 3,
  'E major': 4, 'C# minor': 4,
  'B major': 5, 'G# minor': 5,
  'F# major': 6, 'D# minor': 6,
  'C# major': 7, 'A# minor': 7,
  'F major': -1, 'D minor': -1,
  'Bb major': -2, 'G minor': -2,
  'Eb major': -3, 'C minor': -3,
  'Ab major': -4, 'F minor': -4,
  'Db major': -5, 'Bb minor': -5,
  'Gb major': -6, 'Eb minor': -6,
  'Cb major': -7, 'Ab minor': -7,
};

/**
 * MIDI note 60 = C4 = middle C = octave offset 0
 * Each octave is 12 semitones.
 */
export const MIDI_MIDDLE_C = 60;
export const MIDI_OCTAVE_BASE = 4; // C4 is octave 4 in MIDI

/**
 * Duration grid values (as fractions of a whole note)
 */
export const DURATION_GRID = {
  WHOLE: 1,
  HALF: 0.5,
  QUARTER: 0.25,
  EIGHTH: 0.125,
  SIXTEENTH: 0.0625,
  THIRTY_SECOND: 0.03125,
  DOTTED_HALF: 0.75,
  DOTTED_QUARTER: 0.375,
  DOTTED_EIGHTH: 0.1875,
  DOTTED_SIXTEENTH: 0.09375,
};

/**
 * All valid quantization grid points (sorted descending)
 */
export const QUANTIZE_GRID = [
  1, 0.75, 0.5, 0.375, 0.25, 0.1875, 0.125, 0.09375, 0.0625, 0.03125,
];

/**
 * SVG rendering constants - tuned to match traditional Jianpu engraving.
 */
export const SVG = {
  /** Base font size for note digits */
  NOTE_FONT_SIZE: 16,
  /** Approximate width of one digit at NOTE_FONT_SIZE */
  DIGIT_WIDTH: 9,
  /** Tight spacing within a beamed group */
  BEAM_GROUP_SPACING: 14,
  /** Spacing for quarter/half/whole notes (wider) */
  BEAT_SPACING: 18,
  /** Extra gap between beat groups within a measure */
  BEAT_GROUP_GAP: 4,
  /** Height allocated per voice line */
  VOICE_HEIGHT: 68,
  /** Space above digit baseline reserved for chord stacking + upper octave dots */
  SPACE_ABOVE: 30,
  /** Space below digit baseline reserved for beams + lower octave dots */
  SPACE_BELOW: 30,
  /** Beam (underline) thickness */
  BEAM_THICKNESS: 1.2,
  /** Beam vertical gap between multiple underlines */
  BEAM_GAP: 3.5,
  /** Space below digit bottom for first beam line */
  BEAM_OFFSET: 3,
  /** Bar line extends this far above the digit baseline */
  BAR_EXTEND_ABOVE: 8,
  /** Bar line extends this far below the digit baseline */
  BAR_EXTEND_BELOW: 12,
  /** Horizontal padding inside measure edges */
  MEASURE_PAD: 6,
  /** Page dimensions (A4 in points: 595 x 842) */
  PAGE_WIDTH: 595,
  PAGE_HEIGHT: 842,
  MARGIN_TOP: 60,
  MARGIN_BOTTOM: 40,
  MARGIN_LEFT: 50,
  MARGIN_RIGHT: 40,
  /** System vertical spacing */
  SYSTEM_GAP: 32,
  /** Header height */
  HEADER_HEIGHT: 80,
  /** Dot radius for octave dots */
  OCTAVE_DOT_RADIUS: 1.5,
  /** Vertical gap between stacked octave dots */
  OCTAVE_DOT_GAP: 4,
  /** Tie arc height */
  TIE_HEIGHT: 6,
  /** Accidental font size (superscript-style) */
  ACCIDENTAL_FONT_SIZE: 9,
  /** Chord vertical stacking offset between notes */
  CHORD_STACK_OFFSET: 18,
  /** Augmentation dot: x offset from digit right edge */
  AUG_DOT_OFFSET_X: 2,
  /** Augmentation dot radius */
  AUG_DOT_RADIUS: 1.3,
  /** Brace width for multi-voice */
  BRACE_WIDTH: 8,
  /** Measure number font size */
  MEASURE_NUM_FONT_SIZE: 8,
  /** Time signature font size */
  TIME_SIG_FONT_SIZE: 14,
};
