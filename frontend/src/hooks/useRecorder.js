import { useCallback, useEffect, useRef, useState } from 'react';

const MAX_SECONDS = 90;
const PREFERRED = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];

export const canRecord = () =>
  typeof window !== 'undefined' && !!navigator.mediaDevices?.getUserMedia && !!window.MediaRecorder;

// Records from the microphone. stop() hands the recording to onDone; cancel() throws it away.
// Recording stops by itself at MAX_SECONDS so a forgotten mic never uploads minutes of audio.
export const useRecorder = (onDone) => {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const recorder = useRef(null);
  const discard = useRef(false);
  const timer = useRef(null);
  const done = useRef(onDone);
  done.current = onDone;

  const release = () => {
    clearInterval(timer.current);
    recorder.current?.stream.getTracks().forEach((t) => t.stop());
    recorder.current = null;
    setRecording(false);
    setSeconds(0);
  };

  const finish = useCallback((keep) => {
    const rec = recorder.current;
    if (!rec || rec.state === 'inactive') return;
    discard.current = !keep;
    rec.stop();
  }, []);

  const start = useCallback(async () => {
    if (recorder.current) return;
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const mimeType = PREFERRED.find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || 'audio/webm' });
      const keep = !discard.current && blob.size > 0;
      release();
      if (keep) done.current(blob);
    };
    recorder.current = rec;
    discard.current = false;
    rec.start();
    setRecording(true);
    timer.current = setInterval(() => {
      setSeconds((s) => {
        if (s + 1 >= MAX_SECONDS) finish(true);
        return s + 1;
      });
    }, 1000);
  }, [finish]);

  // Leaving the page turns the microphone off
  useEffect(() => () => finish(false), [finish]);

  return { recording, seconds, start, stop: () => finish(true), cancel: () => finish(false) };
};
