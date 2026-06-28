import { useState, useRef, useEffect, useCallback } from 'react'
import { Play, Pause, Plus, Minus } from 'lucide-react'
import * as Tone from 'tone'

const TIME_SIGS = [2, 3, 4, 5, 6, 7]

const card = { background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }

export default function Metronome() {
  const [bpm, setBpm] = useState(80)
  const [beats, setBeats] = useState(4)
  const [running, setRunning] = useState(false)
  const [currentBeat, setCurrentBeat] = useState(-1)
  const seqRef = useRef<Tone.Sequence | null>(null)
  const clickHiRef = useRef<Tone.Synth | null>(null)
  const clickLoRef = useRef<Tone.Synth | null>(null)

  const stopMetronome = useCallback(() => {
    seqRef.current?.stop()
    seqRef.current?.dispose()
    seqRef.current = null
    Tone.getTransport().stop()
    setRunning(false)
    setCurrentBeat(-1)
  }, [])

  const startMetronome = useCallback(async () => {
    await Tone.start()
    stopMetronome()
    clickHiRef.current = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 }, volume: -4 }).toDestination()
    clickLoRef.current = new Tone.Synth({ oscillator: { type: 'triangle' }, envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 }, volume: -8 }).toDestination()
    const seq = new Tone.Sequence(
      (time, idx) => {
        const synth = idx === 0 ? clickHiRef.current : clickLoRef.current
        synth?.triggerAttackRelease(idx === 0 ? 'C5' : 'G4', '32n', time)
        Tone.getDraw().schedule(() => setCurrentBeat(idx as number), time)
      },
      Array.from({ length: beats }, (_, i) => i), '4n'
    )
    Tone.getTransport().bpm.value = bpm
    seq.start(0)
    seqRef.current = seq
    Tone.getTransport().start()
    setRunning(true)
  }, [bpm, beats, stopMetronome])

  useEffect(() => { if (running) Tone.getTransport().bpm.value = bpm }, [bpm, running])
  useEffect(() => () => stopMetronome(), [stopMetronome])

  const changeBpm = (delta: number) => setBpm(v => Math.max(20, Math.min(320, v + delta)))

  const tapTimes = useRef<number[]>([])
  const tapBpm = () => {
    const now = Date.now()
    tapTimes.current = [...tapTimes.current.slice(-4), now]
    if (tapTimes.current.length >= 2) {
      const intervals = tapTimes.current.slice(1).map((t, i) => t - tapTimes.current[i])
      setBpm(Math.round(60000 / (intervals.reduce((a, b) => a + b, 0) / intervals.length)))
    }
  }

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>
      <div style={{ ...card, padding: '40px 32px', textAlign: 'center', marginBottom: 16 }}>
        <div style={{ fontSize: 84, fontWeight: 900, color: '#fff', letterSpacing: '-2px', lineHeight: 1, marginBottom: 4, fontVariantNumeric: 'tabular-nums' }}>{bpm}</div>
        <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 28, letterSpacing: '0.1em', textTransform: 'uppercase' }}>BPM</div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 28 }}>
          <button onClick={() => changeBpm(-5)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={14} /></button>
          <input type="range" min={20} max={320} value={bpm} onChange={e => setBpm(Number(e.target.value))} style={{ width: 140, accentColor: '#00d4b4' }} />
          <button onClick={() => changeBpm(5)} style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={14} /></button>
        </div>

        {/* Beat dots */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 10 }}>
          {Array.from({ length: beats }, (_, i) => (
            <div key={i} style={{
              width: 28, height: 28, borderRadius: '50%',
              border: `2px solid ${currentBeat === i ? (i === 0 ? '#00d4b4' : 'rgba(255,255,255,0.5)') : 'rgba(255,255,255,0.12)'}`,
              background: currentBeat === i ? (i === 0 ? '#00d4b4' : 'rgba(255,255,255,0.3)') : 'transparent',
              transform: currentBeat === i ? 'scale(1.2)' : 'scale(1)',
              transition: 'all 0.07s',
            }} />
          ))}
        </div>
      </div>

      {/* Mesure */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>Mesure</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TIME_SIGS.map(n => (
            <button key={n} onClick={() => { setBeats(n); if (running) stopMetronome() }}
              style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: 'none', transition: 'all 0.15s',
                background: beats === n ? '#00d4b4' : 'rgba(255,255,255,0.07)',
                color: beats === n ? '#000' : 'rgba(255,255,255,0.6)',
              }}
            >{n}/4</button>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={running ? stopMetronome : startMetronome}
          style={{
            flex: 1, padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, border: 'none', transition: 'all 0.2s',
            background: running ? 'rgba(224,82,82,0.12)' : 'linear-gradient(135deg,#00d4b4,#00a896)',
            color: running ? '#e05252' : '#000',
            boxShadow: running ? 'none' : '0 0 20px rgba(0,212,180,0.25)',
          }}
        >
          {running ? <><Pause size={16} /> Arrêter</> : <><Play size={16} /> Démarrer</>}
        </button>
        <button onClick={tapBpm}
          style={{ padding: '14px 22px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer', background: 'rgba(255,255,255,0.07)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)' }}
        >TAP</button>
      </div>
    </div>
  )
}
