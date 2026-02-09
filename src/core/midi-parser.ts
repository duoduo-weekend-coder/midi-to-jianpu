import { Midi } from '@tonejs/midi';
import type { ParsedMidi, ParsedMidiTrack, ParsedMidiNote } from '../types/jianpu';

/**
 * Parse a MIDI ArrayBuffer into our intermediate representation.
 */
export function parseMidi(buffer: ArrayBuffer, fileName: string): ParsedMidi {
  const midi = new Midi(buffer);

  const tracks: ParsedMidiTrack[] = midi.tracks
    .map((track, index) => {
      const notes: ParsedMidiNote[] = track.notes.map((note) => ({
        midi: note.midi,
        startTick: note.ticks,
        durationTicks: note.durationTicks,
        startTime: note.time,
        durationSeconds: note.duration,
        velocity: Math.round(note.velocity * 127),
      }));

      return {
        name: track.name || `Track ${index + 1}`,
        notes,
        instrument: track.instrument?.name || 'unknown',
        channel: track.channel,
      };
    })
    .filter((track) => track.notes.length > 0);

  const timeSignatures = midi.header.timeSignatures.map((ts) => ({
    ticks: ts.ticks,
    timeSignature: [ts.timeSignature[0], ts.timeSignature[1]] as [number, number],
  }));

  // Default to 4/4 if no time signature found
  if (timeSignatures.length === 0) {
    timeSignatures.push({ ticks: 0, timeSignature: [4, 4] });
  }

  const keySignatures = midi.header.keySignatures.map((ks) => ({
    ticks: ks.ticks,
    key: ks.key,
    scale: ks.scale,
  }));

  const tempos = midi.header.tempos.map((t) => ({
    ticks: t.ticks,
    bpm: t.bpm,
  }));

  // Default tempo
  if (tempos.length === 0) {
    tempos.push({ ticks: 0, bpm: 120 });
  }

  // Calculate total duration in ticks
  let durationTicks = 0;
  for (const track of tracks) {
    for (const note of track.notes) {
      const endTick = note.startTick + note.durationTicks;
      if (endTick > durationTicks) {
        durationTicks = endTick;
      }
    }
  }

  // Clean up title from filename
  const title = fileName.replace(/\.midi?$/i, '').replace(/[_-]/g, ' ');

  return {
    name: title,
    tracks,
    timeSignatures,
    keySignatures,
    tempos,
    ppq: midi.header.ppq,
    durationTicks,
  };
}
