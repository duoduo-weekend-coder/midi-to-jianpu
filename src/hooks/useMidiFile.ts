import { useState, useCallback } from 'react';
import type { ParsedMidi } from '../types/jianpu';
import { parseMidi } from '../core/midi-parser';

interface UseMidiFileReturn {
  parsedMidi: ParsedMidi | null;
  error: string | null;
  loading: boolean;
  loadFile: (file: File) => Promise<void>;
  reset: () => void;
}

export function useMidiFile(): UseMidiFileReturn {
  const [parsedMidi, setParsedMidi] = useState<ParsedMidi | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const loadFile = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);

    try {
      const buffer = await file.arrayBuffer();
      const parsed = parseMidi(buffer, file.name);

      if (parsed.tracks.length === 0) {
        throw new Error('No tracks with notes found in this MIDI file.');
      }

      setParsedMidi(parsed);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to parse MIDI file';
      setError(message);
      setParsedMidi(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setParsedMidi(null);
    setError(null);
    setLoading(false);
  }, []);

  return { parsedMidi, error, loading, loadFile, reset };
}
