import type {
  JianpuNote,
  JianpuChord,
  JianpuRest,
  JianpuSustain,
  JianpuElement,
  JianpuDigit,
  Accidental,
  KeySignature,
} from '../types/jianpu';
import {
  SHARP_NOTE_MAP,
  FLAT_NOTE_MAP,
  DEFAULT_NOTE_MAP,
  MIDI_MIDDLE_C,
  KEY_SIGNATURE_MAP,
} from './constants';
import type { QuantizedNote, QuantizedTrack } from './duration-quantizer';

interface NoteMapping {
  digit: JianpuDigit;
  accidental: Accidental;
}

/**
 * Get the note mapping table based on key signature.
 */
function getNoteMap(keySig: KeySignature): NoteMapping[] {
  if (keySig.sharpsOrFlats > 0) return SHARP_NOTE_MAP;
  if (keySig.sharpsOrFlats < 0) return FLAT_NOTE_MAP;
  return DEFAULT_NOTE_MAP;
}

/**
 * Convert a MIDI note number to a JianpuNote (without duration/tie info).
 */
function midiToJianpuNote(midiNote: number, noteMap: NoteMapping[]): { digit: JianpuDigit; octave: number; accidental: Accidental } {
  const pitchClass = ((midiNote % 12) + 12) % 12;
  const midiOctave = Math.floor(midiNote / 12) - 1; // MIDI octave
  const middleOctave = Math.floor(MIDI_MIDDLE_C / 12) - 1; // = 4
  const octaveOffset = midiOctave - middleOctave;

  const mapping = noteMap[pitchClass];
  return {
    digit: mapping.digit,
    octave: octaveOffset,
    accidental: mapping.accidental,
  };
}

/**
 * Parse key signature from MIDI data.
 */
export function parseKeySignature(
  keySignatures: Array<{ pos: number; key: string; scale: string }>
): KeySignature {
  if (keySignatures.length === 0) {
    return { sharpsOrFlats: 0, mode: 'major', root: 'C' };
  }

  const ks = keySignatures[0];
  const mode = ks.scale === 'minor' ? 'minor' : 'major';
  const keyName = `${ks.key} ${mode}`;
  const sharpsOrFlats = KEY_SIGNATURE_MAP[keyName] ?? 0;

  return {
    sharpsOrFlats,
    mode,
    root: ks.key,
  };
}

/**
 * Determine if a duration is dotted and what the base duration is.
 * Returns { baseDuration, dotted }
 */
function analyzeDuration(duration: number): { baseDuration: number; dotted: boolean } {
  // Check dotted values (duration = base * 1.5)
  const dottedBase = duration / 1.5;
  const validBases = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125];

  for (const base of validBases) {
    if (Math.abs(dottedBase - base) < 0.001) {
      return { baseDuration: base, dotted: true };
    }
  }

  return { baseDuration: duration, dotted: false };
}

/**
 * Decompose a long note into initial note + sustain dashes.
 * Each sustain dash represents one beat (quarter note by default).
 */
function decomposeNote(
  note: JianpuNote,
  beatDuration: number
): JianpuElement[] {
  const elements: JianpuElement[] = [];
  let remaining = note.duration;

  if (remaining <= beatDuration) {
    // Fits in one beat, no decomposition needed
    elements.push(note);
    return elements;
  }

  // First element is the note itself, lasting one beat
  const firstNote: JianpuNote = {
    ...note,
    duration: beatDuration,
    dotted: false,
    tiedToNext: true,
  };
  elements.push(firstNote);
  remaining -= beatDuration;

  // Remaining beats become sustain dashes
  while (remaining > 0.001) {
    const dashDur = Math.min(remaining, beatDuration);
    const sustain: JianpuSustain = {
      type: 'sustain',
      duration: dashDur,
      dotted: false,
    };
    elements.push(sustain);
    remaining -= dashDur;
  }

  return elements;
}

/**
 * Group simultaneous notes into chords.
 * Notes starting at the same position are considered simultaneous.
 */
function groupSimultaneousNotes(
  notes: QuantizedNote[]
): Array<{ startPos: number; notes: QuantizedNote[] }> {
  const groups: Array<{ startPos: number; notes: QuantizedNote[] }> = [];
  let i = 0;

  while (i < notes.length) {
    const startPos = notes[i].startPos;
    const group: QuantizedNote[] = [];

    while (i < notes.length && Math.abs(notes[i].startPos - startPos) < 0.001) {
      group.push(notes[i]);
      i++;
    }

    groups.push({ startPos, notes: group });
  }

  return groups;
}

/**
 * Convert a single track's quantized notes to JianpuElements with timeline.
 * Fills gaps with rests and decomposes long notes.
 */
export function convertTrackToElements(
  track: QuantizedTrack,
  keySig: KeySignature,
  totalDuration: number,
  beatDuration: number
): Array<{ pos: number; element: JianpuElement }> {
  const noteMap = getNoteMap(keySig);
  const noteGroups = groupSimultaneousNotes(track.notes);
  const timeline: Array<{ pos: number; element: JianpuElement }> = [];

  let currentPos = 0;

  for (const group of noteGroups) {
    // Fill gap with rests
    if (group.startPos > currentPos + 0.001) {
      const gap = group.startPos - currentPos;
      const rests = fillWithRests(gap, beatDuration);
      for (const rest of rests) {
        timeline.push({ pos: currentPos, element: rest });
        currentPos += rest.duration;
      }
    }

    // Use the minimum duration among simultaneous notes for the chord/note
    const minDuration = Math.min(...group.notes.map((n) => n.duration));
    const { dotted } = analyzeDuration(minDuration);

    if (group.notes.length === 1) {
      // Single note
      const qNote = group.notes[0];
      const mapping = midiToJianpuNote(qNote.midi, noteMap);
      const jNote: JianpuNote = {
        type: 'note',
        digit: mapping.digit,
        octave: mapping.octave,
        accidental: mapping.accidental,
        duration: minDuration,
        midiNote: qNote.midi,
        dotted,
        tiedToNext: false,
        tiedFromPrev: false,
      };

      // Decompose if longer than one beat
      const elements = decomposeNote(jNote, beatDuration);
      for (const el of elements) {
        timeline.push({ pos: currentPos, element: el });
        currentPos += el.duration;
      }
    } else {
      // Chord
      const chordNotes: JianpuNote[] = group.notes.map((qNote) => {
        const mapping = midiToJianpuNote(qNote.midi, noteMap);
        return {
          type: 'note' as const,
          digit: mapping.digit,
          octave: mapping.octave,
          accidental: mapping.accidental,
          duration: minDuration,
          midiNote: qNote.midi,
          dotted,
          tiedToNext: false,
          tiedFromPrev: false,
        };
      });

      // Sort chord notes bottom to top (by MIDI note number)
      chordNotes.sort((a, b) => a.midiNote - b.midiNote);

      if (minDuration > beatDuration) {
        // Decompose chord: first beat is chord, rest are sustain dashes
        const chord: JianpuChord = {
          type: 'chord',
          notes: chordNotes,
          duration: beatDuration,
          dotted: false,
          tiedToNext: true,
          tiedFromPrev: false,
        };
        timeline.push({ pos: currentPos, element: chord });
        currentPos += beatDuration;

        let remaining = minDuration - beatDuration;
        while (remaining > 0.001) {
          const dashDur = Math.min(remaining, beatDuration);
          timeline.push({
            pos: currentPos,
            element: { type: 'sustain', duration: dashDur, dotted: false },
          });
          currentPos += dashDur;
          remaining -= dashDur;
        }
      } else {
        const chord: JianpuChord = {
          type: 'chord',
          notes: chordNotes,
          duration: minDuration,
          dotted,
          tiedToNext: false,
          tiedFromPrev: false,
        };
        timeline.push({ pos: currentPos, element: chord });
        currentPos += minDuration;
      }
    }
  }

  // Fill trailing gap with rests
  if (totalDuration > currentPos + 0.001) {
    const gap = totalDuration - currentPos;
    const rests = fillWithRests(gap, beatDuration);
    for (const rest of rests) {
      timeline.push({ pos: currentPos, element: rest });
      currentPos += rest.duration;
    }
  }

  return timeline;
}

/**
 * Fill a gap duration with appropriately-sized rests.
 */
function fillWithRests(gap: number, _beatDuration: number): JianpuRest[] {
  const rests: JianpuRest[] = [];
  let remaining = gap;

  // Use standard rest durations: whole, half, quarter, eighth, sixteenth, 32nd
  const restDurations = [1, 0.5, 0.25, 0.125, 0.0625, 0.03125];

  while (remaining > 0.001) {
    let found = false;
    for (const dur of restDurations) {
      if (dur <= remaining + 0.001) {
        rests.push({ type: 'rest', duration: dur, dotted: false });
        remaining -= dur;
        found = true;
        break;
      }
    }
    if (!found) {
      // Fallback: use smallest grid unit
      rests.push({ type: 'rest', duration: 0.03125, dotted: false });
      remaining -= 0.03125;
    }
  }

  return rests;
}
