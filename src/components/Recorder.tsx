import { useState, useRef, useCallback } from 'react'
import { Mic, Square, Play, Pause, Download, Trash2, Circle } from 'lucide-react'

interface Recording {
  id: number
  name: string
  url: string
  duration: number
  date: string
  blob: Blob
}

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Recorder() {
  const [recording, setRecording] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [elapsed, setElapsed] = useState(0)
  const [playingId, setPlayingId] = useState<number | null>(null)

  const mediaRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const startTimeRef = useRef<number>(0)
  const audioRefs = useRef<Record<number, HTMLAudioElement>>({})

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream)
      mediaRef.current = mr
      chunksRef.current = []

      mr.ondataavailable = e => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      mr.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        const url = URL.createObjectURL(blob)
        const dur = (Date.now() - startTimeRef.current) / 1000
        setRecordings(prev => [{
          id: Date.now(),
          name: `Prise ${prev.length + 1}`,
          url, blob, duration: dur,
          date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
        }, ...prev])
        stream.getTracks().forEach(t => t.stop())
      }

      mr.start(100)
      startTimeRef.current = Date.now()
      setElapsed(0)
      setRecording(true)
      timerRef.current = setInterval(() => {
        setElapsed((Date.now() - startTimeRef.current) / 1000)
      }, 100)
    } catch {
      alert('Accès au microphone refusé.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }, [])

  const togglePlay = (rec: Recording) => {
    if (playingId === rec.id) {
      audioRefs.current[rec.id]?.pause()
      setPlayingId(null)
    } else {
      Object.values(audioRefs.current).forEach(a => a.pause())
      const audio = audioRefs.current[rec.id] ?? new Audio(rec.url)
      audioRefs.current[rec.id] = audio
      audio.onended = () => setPlayingId(null)
      audio.play()
      setPlayingId(rec.id)
    }
  }

  const download = (rec: Recording) => {
    const a = document.createElement('a')
    a.href = rec.url
    a.download = `${rec.name}.webm`
    a.click()
  }

  const remove = (id: number) => {
    audioRefs.current[id]?.pause()
    delete audioRefs.current[id]
    if (playingId === id) setPlayingId(null)
    setRecordings(prev => prev.filter(r => r.id !== id))
  }

  const card = { background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>

      {/* Record card */}
      <div style={{ ...card, padding: '40px 32px', textAlign: 'center', marginBottom: 24 }}>
        {recording ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 12 }}>
              <Circle size={10} style={{ color: '#e05252', fill: '#e05252' }} />
              <span style={{ color: '#e05252', fontWeight: 600, fontSize: 12, letterSpacing: '0.15em', textTransform: 'uppercase' }}>En cours</span>
            </div>
            <div style={{ fontSize: 56, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', marginBottom: 28 }}>{formatTime(elapsed)}</div>
            <button onClick={stopRecording} style={{
              padding: '12px 32px', borderRadius: 12, background: 'rgba(224,82,82,0.12)', border: '1px solid rgba(224,82,82,0.25)', color: '#e05252', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8,
            }}>
              <Square size={16} /> Arrêter
            </button>
          </>
        ) : (
          <>
            <Mic size={40} style={{ margin: '0 auto 16px', display: 'block', color: 'rgba(255,255,255,0.2)' }} />
            <p style={{ color: 'rgba(255,255,255,0.35)', fontSize: 14, marginBottom: 24 }}>Prêt à enregistrer</p>
            <button onClick={startRecording} style={{
              padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg,#00d4b4,#00a896)', border: 'none', color: '#000', fontWeight: 700, fontSize: 14, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 8, boxShadow: '0 0 20px rgba(0,212,180,0.25)',
            }}>
              <Mic size={16} /> Démarrer l'enregistrement
            </button>
          </>
        )}
      </div>

      {/* Recordings list */}
      {recordings.length > 0 && (
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 12 }}>
            Prises ({recordings.length})
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {recordings.map(rec => (
              <div key={rec.id} style={{ background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 12, padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
                <button onClick={() => togglePlay(rec)} style={{
                  width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,212,180,0.1)', border: '1px solid rgba(0,212,180,0.3)', color: '#00d4b4', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  {playingId === rec.id ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 500, color: '#fff' }}>{rec.name}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)' }}>{formatTime(rec.duration)} · {rec.date}</div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => download(rec)} title="Télécharger" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Download size={13} />
                  </button>
                  <button onClick={() => remove(rec.id)} title="Supprimer" style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
