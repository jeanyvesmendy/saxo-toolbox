import { useState, useEffect, useRef, useCallback } from 'react'
import { Mic, MicOff } from 'lucide-react'
import { PitchDetector } from 'pitchy'

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_NAMES_FR: Record<string, string> = {
  C: 'Do', 'C#': 'Do#', D: 'Ré', 'D#': 'Ré#', E: 'Mi',
  F: 'Fa', 'F#': 'Fa#', G: 'Sol', 'G#': 'Sol#', A: 'La', 'A#': 'La#', B: 'Si'
}
const ALL_NOTES_FR = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si']

function freqToNote(freq: number) {
  const semitones = 12 * Math.log2(freq / 440)
  const noteIndex = ((Math.round(semitones) % 12) + 12) % 12
  const octave = Math.floor((Math.round(semitones) + 9) / 12) + 4
  const cents = (semitones - Math.round(semitones)) * 100
  return { note: NOTES[noteIndex], octave, cents }
}

function getCentsColor(cents: number) {
  const abs = Math.abs(cents)
  if (abs < 5) return '#00d4b4'
  if (abs < 15) return '#f5a623'
  return '#e05252'
}

const card = {
  background: '#161616',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 16,
}

const btnPrimary = {
  background: 'linear-gradient(135deg,#00d4b4,#00a896)',
  color: '#000',
  fontWeight: 700,
  fontSize: 14,
  border: 'none',
  borderRadius: 12,
  padding: '14px 24px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  justifyContent: 'center',
  transition: 'opacity 0.2s',
}

const btnDanger = {
  background: 'rgba(224,82,82,0.12)',
  color: '#e05252',
  fontWeight: 700,
  fontSize: 14,
  border: '1px solid rgba(224,82,82,0.25)',
  borderRadius: 12,
  padding: '14px 24px',
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  width: '100%',
  justifyContent: 'center',
}

export default function Tuner() {
  const [listening, setListening] = useState(false)
  const [freq, setFreq] = useState<number | null>(null)
  const [note, setNote] = useState<string>('')
  const [octave, setOctave] = useState<number>(4)
  const [cents, setCents] = useState<number>(0)
  const [clarity, setClarity] = useState<number>(0)
  const [targetNote, setTargetNote] = useState<number | null>(null)
  const audioCtxRef = useRef<AudioContext | null>(null)
  const animRef = useRef<number>(0)
  const streamRef = useRef<MediaStream | null>(null)

  const stop = useCallback(() => {
    cancelAnimationFrame(animRef.current)
    streamRef.current?.getTracks().forEach(t => t.stop())
    audioCtxRef.current?.close()
    audioCtxRef.current = null
    streamRef.current = null
    setListening(false)
    setFreq(null)
  }, [])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const ctx = new AudioContext()
      audioCtxRef.current = ctx
      const source = ctx.createMediaStreamSource(stream)
      const analyser = ctx.createAnalyser()
      analyser.fftSize = 2048
      source.connect(analyser)
      const detector = PitchDetector.forFloat32Array(analyser.fftSize)
      const input = new Float32Array(analyser.fftSize)
      const detect = () => {
        analyser.getFloatTimeDomainData(input)
        const [pitch, cl] = detector.findPitch(input, ctx.sampleRate)
        setClarity(cl)
        if (pitch > 50 && pitch < 2000 && cl > 0.92) {
          const { note: n, octave: o, cents: c } = freqToNote(pitch)
          setFreq(Math.round(pitch * 10) / 10)
          setNote(n)
          setOctave(o)
          setCents(Math.round(c))
        }
        animRef.current = requestAnimationFrame(detect)
      }
      detect()
      setListening(true)
    } catch {
      alert('Accès au microphone refusé.')
    }
  }, [])

  useEffect(() => () => stop(), [stop])

  const centsColor = getCentsColor(cents)
  const needleAngle = Math.max(-45, Math.min(45, cents * 0.9))
  const detectedIdx = note ? NOTES.indexOf(note) : -1
  const isOnTarget = targetNote !== null && detectedIdx === targetNote && freq !== null

  return (
    <div style={{ maxWidth: 480, margin: '0 auto' }}>

      {/* Note cible */}
      <div style={{ ...card, padding: '16px 20px', marginBottom: 12 }}>
        <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Note cible</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
          {ALL_NOTES_FR.map((n, i) => (
            <button key={i} onClick={() => setTargetNote(targetNote === i ? null : i)}
              style={{
                minWidth: 40, padding: '5px 8px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                background: targetNote === i ? '#00d4b4' : 'rgba(255,255,255,0.05)',
                borderColor: targetNote === i ? '#00d4b4' : 'rgba(255,255,255,0.1)',
                color: targetNote === i ? '#000' : 'rgba(255,255,255,0.6)',
              }}
            >{n}</button>
          ))}
        </div>
      </div>

      {/* Display */}
      <div style={{ ...card, padding: '40px 32px', textAlign: 'center', marginBottom: 16 }}>
        {freq ? (
          <>
            {/* Target match banner */}
            {targetNote !== null && (
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, fontSize: 12, fontWeight: 600, marginBottom: 16,
                background: isOnTarget ? 'rgba(0,212,180,0.15)' : 'rgba(224,82,82,0.12)',
                color: isOnTarget ? '#00d4b4' : '#e05252',
                border: `1px solid ${isOnTarget ? 'rgba(0,212,180,0.3)' : 'rgba(224,82,82,0.25)'}`,
              }}>
                {isOnTarget ? '✓ En accord' : `Vous jouez ${NOTE_NAMES_FR[note] ?? note} — cible : ${ALL_NOTES_FR[targetNote]}`}
              </div>
            )}
            <div style={{ fontSize: 88, fontWeight: 900, letterSpacing: '-2px', color: centsColor, lineHeight: 1, marginBottom: 4, transition: 'color 0.2s' }}>
              {NOTE_NAMES_FR[note] ?? note}
            </div>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: 15, marginBottom: 4 }}>Octave {octave}</div>
            <div style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13, marginBottom: 28 }}>{freq} Hz</div>

            <div style={{ width: 200, height: 100, margin: '0 auto 16px' }}>
              <svg viewBox="0 0 200 100" style={{ width: '100%' }}>
                <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="#1e1e1e" strokeWidth="14" strokeLinecap="round" />
                <path d="M 20 90 A 80 80 0 0 1 180 90" fill="none" stroke="url(#arcGrad)" strokeWidth="8" strokeLinecap="round" />
                <defs>
                  <linearGradient id="arcGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#e05252" />
                    <stop offset="35%" stopColor="#f5a623" />
                    <stop offset="50%" stopColor="#00d4b4" />
                    <stop offset="65%" stopColor="#f5a623" />
                    <stop offset="100%" stopColor="#e05252" />
                  </linearGradient>
                </defs>
                <line x1="100" y1="14" x2="100" y2="28" stroke="#00d4b4" strokeWidth="2.5" />
                <line
                  x1="100" y1="90"
                  x2={100 + 65 * Math.sin((needleAngle * Math.PI) / 180)}
                  y2={90 - 65 * Math.cos((needleAngle * Math.PI) / 180)}
                  stroke="white" strokeWidth="2.5" strokeLinecap="round"
                  style={{ transition: 'all 0.1s ease' }}
                />
                <circle cx="100" cy="90" r="5" fill="white" />
              </svg>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: centsColor }}>
              {cents > 0 ? `+${cents}` : cents} cents
            </div>
          </>
        ) : (
          <div style={{ padding: '32px 0', color: 'rgba(255,255,255,0.2)' }}>
            <Mic size={44} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.3 }} />
            <p style={{ fontSize: 14 }}>{listening ? 'En écoute… jouez une note' : 'Cliquez sur Démarrer'}</p>
          </div>
        )}
      </div>

      {/* Signal */}
      {listening && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.3)', marginBottom: 6 }}>
            <span>Signal micro</span><span>{Math.round(clarity * 100)}%</span>
          </div>
          <div style={{ height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${clarity * 100}%`, background: centsColor, borderRadius: 4, transition: 'width 0.15s, background 0.2s' }} />
          </div>
        </div>
      )}

      <button
        onClick={listening ? stop : start}
        style={listening ? btnDanger : btnPrimary as React.CSSProperties}
      >
        {listening ? <><MicOff size={16} /> Arrêter</> : <><Mic size={16} /> Démarrer l'accordeur</>}
      </button>
    </div>
  )
}
