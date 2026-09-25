import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, Mic, MicOff, PhoneOff, Hand } from 'lucide-react';
import { voiceService, audioUrl } from '../../services/voiceService';
import { errorMessage } from '../../services/apiClient';

const PREFERRED = ['audio/webm;codecs=opus', 'audio/webm', 'audio/ogg;codecs=opus', 'audio/mp4'];
const MAX_TURN_MS = 90000; // a forgotten open mic is sent rather than recorded for ever

const STATUS = {
  connecting: 'Connecting…',
  greeting: 'AI Mentor is speaking',
  listening: 'Listening',
  thinking: 'Thinking',
  speaking: 'AI Mentor is speaking',
  muted: 'You are muted',
};

const clock = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

// A call with the AI mentor. One turn: she talks and taps Send (or presses Space) when she is
// done, the question goes to /api/voice/ask, the answer is played, and the call listens again.
// She ends her own turn: guessing it from pauses breaks in a noisy room.
export const VoiceCall = ({ projectId, studentName, getSessionId, onTurn, onClose }) => {
  const [phase, setPhase] = useState('connecting');
  const [seconds, setSeconds] = useState(0);
  const [heard, setHeard] = useState('');
  const [said, setSaid] = useState('');
  const [error, setError] = useState('');

  const phaseRef = useRef('connecting');
  const stream = useRef(null);
  const ctx = useRef(null);
  const recorder = useRef(null);
  const player = useRef(null);
  const frame = useRef(null);
  const orb = useRef(null);
  const alive = useRef(true);
  // The first render's send() stays in use, so the latest callback is read through a ref
  const turn = useRef(onTurn);
  turn.current = onTurn;
  const turnTimer = useRef(null);

  const go = (p) => {
    phaseRef.current = p;
    setPhase(p);
  };

  const dropRecorder = () => {
    clearTimeout(turnTimer.current);
    const rec = recorder.current;
    recorder.current = null;
    if (rec && rec.state !== 'inactive') {
      rec.onstop = null;
      rec.stop();
    }
  };

  const listen = useCallback(() => {
    if (!alive.current || !stream.current) return;
    dropRecorder();
    const mimeType = PREFERRED.find((t) => MediaRecorder.isTypeSupported(t));
    const rec = new MediaRecorder(stream.current, mimeType ? { mimeType } : undefined);
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => send(new Blob(chunks, { type: rec.mimeType || 'audio/webm' }));
    recorder.current = rec;
    rec.start();
    turnTimer.current = setTimeout(() => finishTurn(), MAX_TURN_MS);
    go('listening');
  }, []);

  // She is done talking: stop recording, which sends the turn
  const finishTurn = () => {
    const rec = recorder.current;
    if (phaseRef.current !== 'listening' || !rec || rec.state === 'inactive') return;
    clearTimeout(turnTimer.current);
    go('thinking');
    rec.stop();
  };

  const playThen = useCallback((url, next) => {
    const audio = new Audio(url);
    player.current = audio;
    const done = () => {
      if (player.current !== audio) return;
      player.current = null;
      if (alive.current) next();
    };
    audio.onended = done;
    audio.onerror = done;
    audio.play().catch(done);
  }, []);

  const send = async (blob) => {
    if (!alive.current) return;
    go('thinking');
    setError('');
    try {
      const reply = await voiceService.ask(projectId, blob, getSessionId());
      if (!alive.current) return;
      turn.current(reply);
      setHeard(reply.transcript);
      setSaid(reply.message || '');
      if (!reply.audio) return listen();
      go('speaking');
      playThen(audioUrl(reply), listen);
    } catch (err) {
      if (!alive.current) return;
      // 422 is "nothing was said": a cough or background noise. Just keep listening.
      if (err.response?.status !== 422) setError(errorMessage(err));
      listen();
    }
  };

  // The orb moves with her voice, so she can see the call hears her
  const tick = useCallback((analyser, samples) => {
    const loop = () => {
      frame.current = requestAnimationFrame(loop);
      if (!orb.current) return;
      analyser.getFloatTimeDomainData(samples);
      let sum = 0;
      for (let i = 0; i < samples.length; i += 1) sum += samples[i] * samples[i];
      const level = Math.sqrt(sum / samples.length);
      const size = phaseRef.current === 'listening' ? 1 + Math.min(level * 9, 0.45) : 1;
      orb.current.style.transform = `scale(${size.toFixed(3)})`;
    };
    loop();
  }, []);

  useEffect(() => {
    alive.current = true;
    // React runs this twice in development; only the run that is still current may set up the call
    let current = true;
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000);
    (async () => {
      try {
        const media = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
        });
        if (!current) return media.getTracks().forEach((t) => t.stop());
        stream.current = media;
        ctx.current = new (window.AudioContext || window.webkitAudioContext)();
        const analyser = ctx.current.createAnalyser();
        analyser.fftSize = 1024;
        ctx.current.createMediaStreamSource(media).connect(analyser);
        tick(analyser, new Float32Array(analyser.fftSize));

        go('greeting');
        const hello = `Hi ${studentName}! What's going on?`;
        setSaid(hello);
        let greeting = null;
        try {
          greeting = audioUrl(await voiceService.speak(hello, 'en-IN'));
        } catch {
          // No greeting is fine; the call still works
        }
        if (!current) return;
        if (greeting) playThen(greeting, listen);
        else listen();
      } catch {
        setError('The microphone is blocked. Allow it in the browser address bar, then call again.');
      }
    })();

    const onKey = (e) => {
      if (e.code !== 'Space' || e.repeat) return;
      e.preventDefault();
      finishTurn();
    };
    window.addEventListener('keydown', onKey);

    return () => {
      window.removeEventListener('keydown', onKey);
      current = false;
      alive.current = false;
      clearInterval(timer);
      cancelAnimationFrame(frame.current);
      dropRecorder();
      player.current?.pause();
      player.current = null;
      stream.current?.getTracks().forEach((t) => t.stop());
      ctx.current?.close().catch(() => {});
    };
    // The call is set up once; its props do not change while it is open
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleMute = () => {
    if (phase === 'muted') return listen();
    if (phase !== 'listening') return;
    dropRecorder();
    go('muted');
  };

  // Cut the answer short and take the next question
  const interrupt = () => {
    player.current?.pause();
    player.current = null;
    listen();
  };

  const talking = phase === 'speaking' || phase === 'greeting';
  const canMute = phase === 'listening' || phase === 'muted';

  // On the body, so no animated or scrolling ancestor can clip the full-screen call
  return createPortal(
    <div className="fade-enter call-screen" role="dialog" aria-label="Call with the AI mentor">
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '0.78rem', letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.7 }}>
          On a call with
        </div>
        <div style={{ fontSize: '1.5rem', fontWeight: 700, letterSpacing: '-0.02em', marginTop: '4px' }}>AI Mentor</div>
        <div style={{ fontSize: '0.9rem', opacity: 0.7, marginTop: '2px', fontVariantNumeric: 'tabular-nums' }}>{clock(seconds)}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '22px' }}>
        <div className={`call-orb ${talking ? 'is-talking' : ''} ${phase === 'thinking' ? 'is-thinking' : ''}`}>
          <div ref={orb} className="call-orb-core" style={{ opacity: phase === 'muted' ? 0.45 : 1 }}>
            <img src="/logo.svg" alt="" style={{ width: '54px', height: '54px', filter: 'brightness(0) invert(1)' }} />
          </div>
        </div>
        <div style={{ fontSize: '1.05rem', fontWeight: 600 }} className={phase === 'thinking' ? 'call-shimmer' : ''}>
          {STATUS[phase]}
        </div>
        <button type="button" className="call-send" onClick={finishTurn} style={{ visibility: phase === 'listening' ? 'visible' : 'hidden' }}>
          <ArrowUp size={16} strokeWidth={2.4} /> Send when you are done
          <span className="call-key">Space</span>
        </button>
      </div>

      <div style={{ width: 'min(680px, 100%)', minHeight: '120px', textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {error && <div style={{ color: '#F3C4B6', fontSize: '0.9rem' }}>{error}</div>}
        {heard && phase !== 'greeting' && <div style={{ fontSize: '0.88rem', opacity: 0.65 }}>You: {heard}</div>}
        {said && (
          <div style={{ fontSize: '1rem', lineHeight: 1.6, maxHeight: '9.6em', overflowY: 'auto' }}>{said}</div>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
        <button type="button" className="call-btn" onClick={toggleMute} disabled={!canMute} aria-label={phase === 'muted' ? 'Unmute' : 'Mute'} title={phase === 'muted' ? 'Unmute' : 'Mute'}>
          {phase === 'muted' ? <MicOff size={20} /> : <Mic size={20} />}
        </button>
        <button type="button" className="call-btn call-end" onClick={onClose} aria-label="End call" title="End call">
          <PhoneOff size={22} />
        </button>
        <button type="button" className="call-btn" onClick={interrupt} disabled={!talking} aria-label="Interrupt" title="Interrupt and speak">
          <Hand size={20} />
        </button>
      </div>
      <div style={{ fontSize: '0.76rem', opacity: 0.55 }}>The whole call is saved in this chat. Speak in Hindi, English or your own language.</div>
    </div>,
    document.body
  );
};
