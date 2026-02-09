import type { ParsedMidi, TimeSignature } from '../types/jianpu';

/**
 * A quantized note with start and duration expressed as fractions of a whole note.
 */
export interface QuantizedNote {
  midi: number;
  /** Start position in whole notes from the beginning */
  startPos: number;
  /** Duration in whole notes */
  duration: number;
  velocity: number;
}

export interface QuantizedTrack {
  name: string;
  trackIndex: number;
  notes: QuantizedNote[];
  instrument: string;
  channel: number;
}

export interface QuantizedMidi {
  tracks: QuantizedTrack[];
  timeSignatures: Array<{ pos: number; timeSignature: TimeSignature }>;
  keySignatures: Array<{ pos: number; key: string; scale: string }>;
  tempo: number;
  ppq: number;
  totalDuration: number; // in whole notes
  title: string;
}

/**
 * The finest quantization grid: 32nd note = 1/32 of a whole note
 */
const GRID_UNIT = 1 / 32;

/**
 * Snap a value to the nearest grid point.
 */
function snapToGrid(value: number): number {
  return Math.round(value / GRID_UNIT) * GRID_UNIT;
}

/**
 * Convert ticks to whole notes.
 */
function ticksToWholeNotes(ticks: number, ppq: number): number {
  // ppq = pulses per quarter note
  // quarter note = 0.25 whole notes
  return (ticks / ppq) * 0.25;
}

/**
 * Quantize all MIDI data: snap note start/duration to 32nd-note grid.
 */
export function quantizeMidi(parsed: ParsedMidi): QuantizedMidi {
  const { ppq } = parsed;

  const tracks: QuantizedTrack[] = parsed.tracks.map((track, index) => {
    const notes: QuantizedNote[] = track.notes.map((note) => {
      const startPos = snapToGrid(ticksToWholeNotes(note.startTick, ppq));
      let duration = snapToGrid(ticksToWholeNotes(note.durationTicks, ppq));

      // Minimum duration: 32nd note
      if (duration < GRID_UNIT) {
        duration = GRID_UNIT;
      }

      return {
        midi: note.midi,
        startPos,
        duration,
        velocity: note.velocity,
      };
    });

    // Sort by start position, then by pitch (ascending)
    notes.sort((a, b) => a.startPos - b.startPos || a.midi - b.midi);

    return {
      name: track.name,
      trackIndex: index,
      notes,
      instrument: track.instrument,
      channel: track.channel,
    };
  });

  // Convert time signatures
  const timeSignatures = parsed.timeSignatures.map((ts) => ({
    pos: snapToGrid(ticksToWholeNotes(ts.ticks, ppq)),
    timeSignature: {
      numerator: ts.timeSignature[0],
      denominator: ts.timeSignature[1],
    } as TimeSignature,
  }));

  // Convert key signatures
  const keySignatures = parsed.keySignatures.map((ks) => ({
    pos: snapToGrid(ticksToWholeNotes(ks.ticks, ppq)),
    key: ks.key,
    scale: ks.scale,
  }));

  const tempo = parsed.tempos[0]?.bpm ?? 120;

  const totalDuration = snapToGrid(ticksToWholeNotes(parsed.durationTicks, ppq));

  return {
    tracks,
    timeSignatures,
    keySignatures,
    tempo,
    ppq,
    totalDuration,
    title: parsed.name,
  };
}
