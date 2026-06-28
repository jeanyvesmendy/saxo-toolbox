import { useState, useRef, useCallback, useEffect } from 'react'
import { Play, Pause, Plus, Minus, Volume2, VolumeX } from 'lucide-react'
import * as Tone from 'tone'

// ─── Music helpers ────────────────────────────────────────────────────────────

const CHR = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const FLAT: Record<string,string> = { 'C#':'Db','D#':'Eb','F#':'Gb','G#':'Ab','A#':'Bb' }
const SHARP: Record<string,string> = { Db:'C#',Eb:'D#',Gb:'F#',Ab:'G#',Bb:'A#' }

function noteAt(root: number, semi: number, quality: string) {
  const n = CHR[(root + semi + 12) % 12]
  return (FLAT[n] ?? n) + quality
}

function parseRoot(sym: string): number {
  const m = sym.match(/^([A-G][b#]?)/)
  if (!m) return 0
  return CHR.indexOf(SHARP[m[1]] ?? m[1])
}

function qualityIntervals(q: string): number[] {
  if (q.startsWith('maj7') || q === 'Δ') return [0,4,7,11]
  if (q.startsWith('m7b5') || q === 'ø') return [0,3,6,10]
  if (q.startsWith('dim7') || q === '°') return [0,3,6,9]
  if (q.startsWith('m7') || q === 'm9')  return [0,3,7,10]
  if (q.startsWith('7') || q === '9')    return [0,4,7,10]
  if (q.startsWith('m6'))               return [0,3,7,9]
  if (q.startsWith('6'))                return [0,4,7,9]
  if (q.startsWith('m'))                return [0,3,7]
  return [0,4,7]
}

function chordNotes(sym: string, oct: number): string[] {
  const root = parseRoot(sym)
  const quality = sym.replace(/^[A-G][b#]?/, '')
  return qualityIntervals(quality).map(i => {
    const idx = (root + i) % 12
    const o   = oct + Math.floor((root + i) / 12)
    return `${CHR[idx]}${o}`
  })
}

function midiToName(m: number): string {
  return `${CHR[((m % 12) + 12) % 12]}${Math.floor(m / 12) - 1}`
}

function nameToMidi(n: string): number {
  const m = n.match(/^([A-G]#?)(-?\d+)$/)
  if (!m) return 60
  return (parseInt(m[2], 10) + 1) * 12 + CHR.indexOf(m[1])
}

// Rootless voicings (Bill Evans / iReal Pro style): no root (the bass has it),
// stack 3rd-5th-7th-9th in close position, centered around middle C (C4).
function rootlessVoicing(sym: string): string[] {
  const root = parseRoot(sym)
  const q = sym.replace(/^[A-G][b#]?/, '')

  // [3rd, 5th, 7th, 9th] as semitone offsets from root
  let off: number[]
  if (q.includes('maj7') || q === 'Δ' || q.startsWith('6') || q === '')      off = [4, 7, 11, 14]
  else if (q.includes('m7b5') || q === 'ø')                                   off = [3, 6, 10, 14]
  else if (q.includes('dim') || q === '°')                                    off = [3, 6, 9, 12]
  else if (q.startsWith('m'))                                                 off = [3, 7, 10, 14] // min7/min6/min9
  else                                                                        off = [4, 7, 10, 14] // dom7/9

  const pcs = off.map(o => (root + o) % 12)

  // Anchor the 3rd near middle C (MIDI 57–68), then stack the rest ascending.
  let thirdMidi = 48 + pcs[0]
  if (thirdMidi < 57) thirdMidi += 12

  const notes: string[] = []
  let prev = thirdMidi - 1
  for (const pc of pcs) {
    const m = pc + 12 * Math.ceil((prev + 1 - pc) / 12)
    notes.push(midiToName(m))
    prev = m
  }
  return notes
}

function walkingBass(sym: string, nextSym: string, oct = 1): string[] {
  const root    = parseRoot(sym)
  const fifth   = (root + 7)  % 12
  const seventh = (root + 10) % 12
  const nextRoot = parseRoot(nextSym)

  const o = (n: number) => oct + (n < root ? 1 : 0)

  const approachMidi = nextRoot + oct * 12 - 1
  const approachIdx  = ((approachMidi % 12) + 12) % 12
  const approachOct  = Math.floor(approachMidi / 12)

  return [
    `${CHR[root]}${o(root)}`,
    `${CHR[fifth]}${o(fifth)}`,
    `${CHR[seventh]}${o(seventh)}`,
    `${CHR[approachIdx]}${approachOct}`,
  ]
}

function fmt(s: string) {
  return s.replace('maj7','Δ7').replace('m7b5','ø7').replace('dim7','°7')
}

// ─── Chord progressions ────────────────────────────────────────────────────────

interface ChordDef { symbol: string; beats: number }

interface StyleDef {
  id: string
  name: string
  desc: string
  bpmDefault: number
  swing: boolean
  pianoPattern: number[]  // Kenny Barron: sparser, on beat 1 + anticipations
  bassPattern:  number[]
  kickPattern:  number[]
  snarePattern: number[]
  hihatPattern: number[]
  sections?: { label: string; startBar: number }[]
  getChords: (r: number) => ChordDef[]
}

const STYLES: StyleDef[] = [
  {
    id: 'anatole',
    name: 'Anatole — Rhythm Changes',
    desc: '32 mesures AABA · bebop classique',
    bpmDefault: 160,
    swing: true,
    pianoPattern: [1,0,0,0,0,0,0,1],  // Kenny Barron: lighter, beat 1 + and-of-4
    bassPattern:  [1,0,1,0,1,0,1,0],
    kickPattern:  [1,0,0,0,0,0,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hihatPattern: [1,1,1,1,1,1,1,1],
    sections: [
      {label:'A', startBar:0},
      {label:'A', startBar:8},
      {label:'B', startBar:16},
      {label:'A', startBar:24},
    ],
    getChords: (r) => {
      const N = (s:number,q:string) => noteAt(r,s,q)
      return [
        {symbol:N(0,'maj7'),beats:4}, {symbol:N(9,'7'),beats:4},
        {symbol:N(2,'m7'),beats:4},   {symbol:N(7,'7'),beats:4},
        {symbol:N(5,'maj7'),beats:4}, {symbol:N(10,'7'),beats:4},
        {symbol:N(2,'m7'),beats:4},   {symbol:N(7,'7'),beats:4},
        {symbol:N(0,'maj7'),beats:4}, {symbol:N(9,'7'),beats:4},
        {symbol:N(2,'m7'),beats:4},   {symbol:N(7,'7'),beats:4},
        {symbol:N(0,'6'),beats:4},    {symbol:N(9,'7'),beats:4},
        {symbol:N(2,'m7'),beats:4},   {symbol:N(7,'7'),beats:4},
        {symbol:N(4,'7'),beats:8},
        {symbol:N(9,'7'),beats:8},
        {symbol:N(2,'7'),beats:8},
        {symbol:N(7,'7'),beats:8},
        {symbol:N(0,'maj7'),beats:4}, {symbol:N(9,'7'),beats:4},
        {symbol:N(2,'m7'),beats:4},   {symbol:N(7,'7'),beats:4},
        {symbol:N(0,'maj7'),beats:4}, {symbol:N(9,'7'),beats:4},
        {symbol:N(2,'m7'),beats:2},   {symbol:N(7,'7'),beats:2},
        {symbol:N(0,'6'),beats:4},
      ]
    }
  },
  {
    id: 'blues12',
    name: 'Jazz Blues 12 mesures',
    desc: 'Blues jazz · turnaround VI IIm V',
    bpmDefault: 120,
    swing: true,
    pianoPattern: [1,0,0,0,0,0,0,1],
    bassPattern:  [1,0,1,0,1,0,1,0],
    kickPattern:  [1,0,0,0,1,0,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hihatPattern: [1,1,1,1,1,1,1,1],
    getChords: (r) => {
      const N = (s:number,q:string) => noteAt(r,s,q)
      return [
        {symbol:N(0,'7'),beats:4},
        {symbol:N(5,'7'),beats:4},
        {symbol:N(0,'7'),beats:4},
        {symbol:N(0,'7'),beats:4},
        {symbol:N(5,'7'),beats:4},
        {symbol:N(5,'7'),beats:4},
        {symbol:N(0,'7'),beats:4},
        {symbol:N(9,'7'),beats:4},
        {symbol:N(2,'m7'),beats:4},
        {symbol:N(7,'7'),beats:4},
        {symbol:N(0,'7'),beats:2},{symbol:N(9,'7'),beats:2},
        {symbol:N(2,'m7'),beats:2},{symbol:N(7,'7'),beats:2},
      ]
    }
  },
  {
    id: 'bossa',
    name: 'Bossa Nova',
    desc: 'Clave brésilienne · II V I maj7',
    bpmDefault: 80,
    swing: false,
    pianoPattern: [1,0,0,0,0,1,0,0],
    bassPattern:  [1,0,0,0,1,0,0,0],
    kickPattern:  [1,0,0,0,0,0,0,0],
    snarePattern: [0,0,0,0,1,0,0,0],
    hihatPattern: [1,0,1,0,1,0,1,0],
    getChords: (r) => {
      const N = (s:number,q:string) => noteAt(r,s,q)
      return [
        {symbol:N(2,'m7'),beats:4},
        {symbol:N(7,'7'),beats:4},
        {symbol:N(0,'maj7'),beats:8},
        {symbol:N(2,'m7'),beats:4},
        {symbol:N(7,'7'),beats:4},
        {symbol:N(0,'maj7'),beats:4},
        {symbol:N(5,'maj7'),beats:4},
      ]
    }
  },
  {
    id: 'minor_blues',
    name: 'Blues Mineur',
    desc: 'Im IVm bVI V · ambiance Coltrane',
    bpmDefault: 110,
    swing: true,
    pianoPattern: [0,0,0,1,0,0,0,1],
    bassPattern:  [1,0,1,0,1,0,1,0],
    kickPattern:  [1,0,0,0,1,0,0,0],
    snarePattern: [0,0,1,0,0,0,1,0],
    hihatPattern: [1,0,1,0,1,0,1,0],
    getChords: (r) => {
      const N = (s:number,q:string) => noteAt(r,s,q)
      return [
        {symbol:N(0,'m7'),beats:4},
        {symbol:N(5,'m7'),beats:4},
        {symbol:N(0,'m7'),beats:4},
        {symbol:N(0,'m7'),beats:4},
        {symbol:N(5,'m7'),beats:4},
        {symbol:N(5,'m7'),beats:4},
        {symbol:N(0,'m7'),beats:4},
        {symbol:N(8,'7'),beats:4},
        {symbol:N(3,'m7b5'),beats:4},
        {symbol:N(7,'7'),beats:4},
        {symbol:N(0,'m7'),beats:2},{symbol:N(8,'7'),beats:2},
        {symbol:N(3,'m7b5'),beats:2},{symbol:N(7,'7'),beats:2},
      ]
    }
  },
  {
    id: 'modal',
    name: 'Modal — Dorien',
    desc: 'Pédale Im7 · improvisation libre',
    bpmDefault: 90,
    swing: false,
    pianoPattern: [1,0,0,0,0,0,0,0],
    bassPattern:  [1,0,0,0,1,0,0,0],
    kickPattern:  [1,0,0,0,0,0,0,0],
    snarePattern: [0,0,0,0,1,0,0,0],
    hihatPattern: [1,0,1,0,1,0,1,0],
    getChords: (r) => [{ symbol: noteAt(r, 0, 'm7'), beats: 16 }]
  },
]

const ROOTS = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']
const ROOTS_DISPLAY = ['Do','Do#','Ré','Ré#','Mi','Fa','Fa#','Sol','Sol#','La','La#','Si']

function toBars(chords: ChordDef[]): ChordDef[][] {
  const bars: ChordDef[][] = []
  let bar: ChordDef[] = []
  let inBar = 0
  for (const c of chords) {
    let rem = c.beats
    while (rem > 0) {
      const space = 4 - inBar
      const take  = Math.min(rem, space)
      bar.push({ symbol: c.symbol, beats: take })
      inBar += take
      rem   -= take
      if (inBar >= 4) { bars.push(bar); bar = []; inBar = 0 }
    }
  }
  if (bar.length > 0) bars.push(bar)
  return bars
}

export default function BackingTrack() {
  const [styleId,    setStyleId]    = useState('anatole')
  const [rootIdx,    setRootIdx]    = useState(10)
  const [bpm,        setBpm]        = useState(160)
  const [playing,    setPlaying]    = useState(false)
  const [loading,    setLoading]    = useState(false)
  const [activeBeat, setActiveBeat] = useState(-1)

  // Volume & mute controls
  const [pianoVol,   setPianoVol]   = useState(-12)
  const [bassVol,    setBassVol]    = useState(-8)
  const [drumsVol,   setDrumsVol]   = useState(-10)
  const [pianMute,   setPianoMute]  = useState(false)
  const [bassMute,   setBassMute]   = useState(false)
  const [drumsMute,  setDrumsMute]  = useState(false)

  const pianoRef = useRef<Tone.Sampler | null>(null)
  const bassRef  = useRef<Tone.Sampler | null>(null)
  const drumsRef = useRef<Tone.Players | null>(null)
  const seqRef   = useRef<Tone.Sequence | null>(null)

  const style  = STYLES.find(s => s.id === styleId)!
  const chords = style.getChords(rootIdx)
  const bars   = toBars(chords)
  const totalBeats = chords.reduce((s, c) => s + c.beats, 0)

  const activeBar = activeBeat >= 0 ? Math.floor(activeBeat / 4) : -1

  function chordForBeat(beat: number): string {
    const barIdx    = Math.floor(beat / 4)
    const beatInBar = beat % 4
    const bar = bars[barIdx % bars.length]
    let acc = 0
    for (const c of bar) {
      acc += c.beats
      if (beatInBar < acc) return c.symbol
    }
    return bar[bar.length - 1].symbol
  }

  const stop = useCallback(() => {
    seqRef.current?.stop(); seqRef.current?.dispose(); seqRef.current = null
    Tone.getTransport().stop()
    pianoRef.current?.dispose(); pianoRef.current = null
    bassRef.current?.dispose();  bassRef.current  = null
    drumsRef.current?.dispose(); drumsRef.current = null
    setPlaying(false); setLoading(false); setActiveBeat(-1)
  }, [])

  const start = useCallback(async () => {
    await Tone.start()
    stop()
    setLoading(true)

    try {
      Tone.getTransport().swing = style.swing ? 0.55 : 0
      Tone.getTransport().swingSubdivision = '8n'

      // Piano — Kamoepiano301: ONLY real samples (mezzo-forte, soft for comping).
      // Tone.Sampler interpolates the gaps with minimal pitch-shift (≤2-3 semitones).
      pianoRef.current = new Tone.Sampler({
        urls: {
          'A0':'mf_a0.wav','A1':'mf_a1.wav','A2':'mf_a2.wav','A4':'mf_a4.wav','A5':'mf_a5.wav','A6':'mf_a6.wav','A7':'mf_a7.wav',
          'C1':'mf_c1.wav','C2':'mf_c2.wav','C3':'mf_c3.wav','C4':'mf_c4.wav','C5':'mf_c5.wav','C6':'f_c6.wav','C7':'mf_c7.wav','C8':'mf_c8.wav',
          'D#1':'mf_ds1.wav','D#2':'mf_ds2.wav','D#4':'mf_ds4.wav','D#5':'mf_ds5.wav','D#7':'mf_ds7.wav',
          'F#1':'mf_fs1.wav','F#2':'mf_fs2.wav','F#5':'mf_fs5.wav','F#6':'f_fs6.wav','F#7':'mf_fs7.wav',
        },
        baseUrl: '/samples/piano/',
        volume: pianoVol,
        release: 1.2,
      }).toDestination()

      // Bass — Meatbass pizzicato real samples
      bassRef.current = new Tone.Sampler({
        urls: {
          'A0':'a0_vl3_rr1.wav','A1':'a1_vl3_rr1.wav','A2':'a2_vl3_rr1.wav','A3':'a3_vl3_rr1.wav',
          'C1':'c1_vl3_rr1.wav','C2':'c2_vl3_rr1.wav','C3':'c3_vl3_rr1.wav','C4':'c4_vl3_rr1.wav',
          'D#1':'eb1_vl3_rr1.wav','D#2':'eb2_vl3_rr1.wav','D#3':'eb3_vl3_rr1.wav',
          'F#1':'gb1_vl3_rr1.wav','F#2':'gb2_vl3_rr1.wav','F#3':'gb3_vl3_rr1.wav',
        },
        baseUrl: '/samples/bass/',
        volume: bassVol,
      }).toDestination()

      // Drums — Virtuosity Drums real kit (ride, hi-hat, kick, snare, crash)
      drumsRef.current = new Tone.Players({
        urls: {
          ride1:'ride1.wav', ride2:'ride2.wav', ride3:'ride3.wav', ridebell:'ridebell.wav',
          hihat:'hihat.wav', kick:'kick.wav', snare:'snare.wav', snareghost:'snare_ghost.wav', crash:'crash.wav',
        },
        baseUrl: '/samples/drums/',
      }).toDestination()
      drumsRef.current.volume.value = drumsVol

      await Tone.loaded()
      setLoading(false)

      const beatChords: string[] = []
      for (let b = 0; b < totalBeats; b++) beatChords.push(chordForBeat(b))

      const totalSteps = totalBeats * 2
      const steps = Array.from({ length: totalSteps }, (_, i) => i)

      // Drum hit helper — per-voice velocity in dB, round-robin friendly
      const hit = (name: string, velDb: number, t: number) => {
        const p = drumsRef.current?.player(name)
        if (!p) return
        p.volume.value = velDb
        p.start(t)
      }
      const rideVoices = ['ride1', 'ride2', 'ride3']
      let rideRR = 0

      const seq = new Tone.Sequence((time, step) => {
        const s         = step as number
        const stepInBar = s % 8
        const qBeat     = Math.floor(s / 2)
        const beatIdx   = qBeat % totalBeats
        const sym       = beatChords[beatIdx]
        const beatInBar = stepInBar / 2

        const absBar = Math.floor(s / 8)

        // ── Piano — clear block voicing struck on EVERY chord change (+ each bar for held chords)
        if (!pianMute) {
          const piano     = pianoRef.current
          const onBeat    = s % 2 === 0   // downbeat (first 8th of a beat)
          const prevChord = beatChords[(beatIdx - 1 + totalBeats) % totalBeats]
          const isChange  = sym !== prevChord
          if (piano && onBeat && (stepInBar === 0 || isChange)) {
            const lh  = rootlessVoicing(sym)                          // 3-5-7-9 around middle C
            const up  = lh.map(n => midiToName(nameToMidi(n) + 12))
            const vel = 0.42 + Math.random() * 0.16

            if (Math.random() < 0.88) {
              // Block voicing, struck together — the chord clearly stated
              lh.forEach((n, i) => piano.triggerAttackRelease(n, '2n', time + i * 0.010, vel))
              // occasional soft top note for colour (not arpeggiated)
              if (Math.random() < 0.22) piano.triggerAttackRelease(up[3], '1n', time + 0.02, vel * 0.7)
            } else {
              // Rare gentle spread — a touch of colour, unhurried
              const spread = [lh[0], lh[1], lh[2], lh[3], up[1]]
              spread.forEach((n, i) =>
                piano.triggerAttackRelease(n, i < 4 ? '2n' : '1n', time + i * 0.055, vel * (1 - i * 0.04)))
            }
          }
        }

        // ── Bass — steady walking quarters, even intensity (swing from Transport, not jitter)
        if (!bassMute && stepInBar % 2 === 0) {
          const nextSym  = beatChords[(beatIdx + 1) % totalBeats]
          const walk     = walkingBass(sym, nextSym, 1)
          const walkNote = walk[Math.floor(beatInBar)] ?? walk[0]
          const vel      = 0.7 + Math.random() * 0.12
          bassRef.current?.triggerAttackRelease(walkNote, '4n', time, Math.min(1, vel))
        }

        // ── Drums
        if (!drumsMute) {
          if (style.swing) {
            // Ride "spang-a-lang": beats + swung skip notes (steps 0,2,3,4,6,7)
            if (stepInBar === 0 || stepInBar === 2 || stepInBar === 3 || stepInBar === 4 || stepInBar === 6 || stepInBar === 7) {
              const accent = stepInBar === 0 || stepInBar === 4
              const skip   = stepInBar === 3 || stepInBar === 7
              const vel    = accent ? -1 : skip ? -7 : -3
              hit(rideVoices[rideRR % 3], vel + (Math.random() * 1.5 - 0.75), time)
              rideRR++
            }
            // Hi-hat foot "chick" on beats 2 & 4
            if (stepInBar === 2 || stepInBar === 6) {
              hit('hihat', -5 + (Math.random() - 0.5), time)
            }
            // Kick feathered very soft on all four beats — felt, not heard
            if (stepInBar % 2 === 0) {
              hit('kick', -22, time)
            }
            // Snare comping: sporadic ghost/accent on off-beats
            if ((stepInBar === 1 || stepInBar === 3 || stepInBar === 5 || stepInBar === 7) && Math.random() < 0.18) {
              const ghost = Math.random() < 0.7
              hit(ghost ? 'snareghost' : 'snare', ghost ? -16 : -8, time)
            }
          } else {
            // Straight feel (bossa / modal)
            if (style.kickPattern[stepInBar])  hit('kick', -6, time)
            if (style.snarePattern[stepInBar]) hit('snareghost', -10, time)
            if (style.hihatPattern[stepInBar]) hit('hihat', -8, time)
          }
          // Crash on the downbeat of each section start
          if (stepInBar === 0 && style.sections?.some(sec => sec.startBar === absBar)) {
            hit('crash', -4, time)
          }
        }

        if (stepInBar % 2 === 0) {
          Tone.getDraw().schedule(() => setActiveBeat(qBeat % totalBeats), time)
        }
      }, steps, '8n')

      Tone.getTransport().bpm.value = bpm
      Tone.getTransport().loop    = true
      Tone.getTransport().loopEnd = `${totalBeats / 4}m`
      seq.start(0)
      seqRef.current = seq
      Tone.getTransport().start()
      setPlaying(true)
    } catch (e) {
      console.error('BackingTrack error:', e)
      setLoading(false)
      setPlaying(false)
    }
  }, [bpm, style, chords, bars, totalBeats, stop, pianMute, bassMute, drumsMute, pianoVol, bassVol, drumsVol])

  useEffect(() => { if (playing) Tone.getTransport().bpm.value = bpm }, [bpm, playing])
  useEffect(() => {
    if (pianoRef.current) pianoRef.current.volume.value = pianMute ? -Infinity : pianoVol
  }, [pianoVol, pianMute])
  useEffect(() => {
    if (bassRef.current) bassRef.current.volume.value = bassMute ? -Infinity : bassVol
  }, [bassVol, bassMute])
  useEffect(() => {
    if (drumsRef.current) drumsRef.current.volume.value = drumsMute ? -Infinity : drumsVol
  }, [drumsVol, drumsMute])
  useEffect(() => { stop() }, [styleId, rootIdx, stop])
  useEffect(() => () => stop(), [stop])

  const card = { background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }
  const lbl  = { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10, display: 'block' }

  return (
    <div style={{ maxWidth: 900, margin: '0 auto' }}>

      {/* Style selector */}
      <div style={{ marginBottom: 20 }}>
        <span style={lbl}>Style</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8 }}>
          {STYLES.map(s => (
            <button key={s.id} onClick={() => { setStyleId(s.id); setBpm(s.bpmDefault) }} style={{
              padding: '10px 12px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
              background: styleId === s.id ? 'rgba(0,212,180,0.1)' : 'rgba(255,255,255,0.04)',
              borderColor: styleId === s.id ? 'rgba(0,212,180,0.35)' : 'rgba(255,255,255,0.07)',
            }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: styleId === s.id ? '#00d4b4' : 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.28)' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Root + BPM */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 12, marginBottom: 16 }}>
        <div style={{ ...card, padding: '14px 16px' }}>
          <span style={lbl}>Tonalité</span>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {ROOTS.map((r, i) => (
              <button key={r} onClick={() => setRootIdx(i)} style={{
                padding: '4px 10px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                background: rootIdx === i ? '#00d4b4' : 'rgba(255,255,255,0.05)',
                borderColor: rootIdx === i ? '#00d4b4' : 'rgba(255,255,255,0.1)',
                color: rootIdx === i ? '#000' : 'rgba(255,255,255,0.65)',
              }}>{ROOTS_DISPLAY[i]}</button>
            ))}
          </div>
        </div>

        <div style={{ ...card, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10, minWidth: 160 }}>
          <span style={lbl}>BPM</span>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', letterSpacing: '-2px', textAlign: 'center', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>{bpm}</div>
          <input type="range" min={40} max={300} value={bpm} onChange={e => setBpm(Number(e.target.value))} disabled={playing}
            style={{ width: '100%', accentColor: '#00d4b4' }} />
          <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
            <button onClick={() => setBpm(v => Math.max(40, v - 5))} disabled={playing} style={{ flex: 1, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Minus size={12} /></button>
            <button onClick={() => setBpm(v => Math.min(300, v + 5))} disabled={playing} style={{ flex: 1, height: 28, borderRadius: 7, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={12} /></button>
          </div>
        </div>
      </div>

      {/* Instrument Controls */}
      <div style={{ ...card, padding: '16px', marginBottom: 16 }}>
        <span style={lbl}>Instruments</span>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
          {/* Piano */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Piano</span>
              <button onClick={() => setPianoMute(!pianMute)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: pianMute ? '#e05252' : '#00d4b4', padding: 0 }}>
                {pianMute ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            <input type="range" min={-40} max={0} value={pianoVol} onChange={e => setPianoVol(Number(e.target.value))} disabled={pianMute}
              style={{ width: '100%', accentColor: '#00d4b4' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{pianoVol} dB</div>
          </div>

          {/* Bass */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Bass</span>
              <button onClick={() => setBassMute(!bassMute)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: bassMute ? '#e05252' : '#00d4b4', padding: 0 }}>
                {bassMute ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            <input type="range" min={-40} max={0} value={bassVol} onChange={e => setBassVol(Number(e.target.value))} disabled={bassMute}
              style={{ width: '100%', accentColor: '#00d4b4' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{bassVol} dB</div>
          </div>

          {/* Drums */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#fff', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>Drums</span>
              <button onClick={() => setDrumsMute(!drumsMute)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: drumsMute ? '#e05252' : '#00d4b4', padding: 0 }}>
                {drumsMute ? <VolumeX size={14} /> : <Volume2 size={14} />}
              </button>
            </div>
            <input type="range" min={-40} max={0} value={drumsVol} onChange={e => setDrumsVol(Number(e.target.value))} disabled={drumsMute}
              style={{ width: '100%', accentColor: '#00d4b4' }} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4 }}>{drumsVol} dB</div>
          </div>
        </div>
      </div>

      {/* Chord grid */}
      <div style={{ ...card, padding: '16px 16px 12px', marginBottom: 16 }}>
        <span style={lbl}>Grille d'accords</span>
        {Array.from({ length: Math.ceil(bars.length / 4) }, (_, rowIdx) => {
          const rowBars = bars.slice(rowIdx * 4, rowIdx * 4 + 4)
          const sectionLabel = style.sections?.find(s => s.startBar === rowIdx * 4)?.label
          return (
            <div key={rowIdx} style={{ marginBottom: 6 }}>
              {sectionLabel && (
                <div style={{ fontSize: 10, color: '#00d4b4', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Section {sectionLabel}
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 3 }}>
                {rowBars.map((bar, bOff) => {
                  const barIdx   = rowIdx * 4 + bOff
                  const isActive = barIdx === activeBar
                  return (
                    <div key={barIdx} style={{
                      border: `1px solid ${isActive ? 'rgba(0,212,180,0.55)' : 'rgba(255,255,255,0.08)'}`,
                      borderRadius: 6, padding: '5px 7px',
                      background: isActive ? 'rgba(0,212,180,0.07)' : 'rgba(255,255,255,0.015)',
                      minHeight: 40,
                    }}>
                      <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.18)', marginBottom: 3, fontVariantNumeric: 'tabular-nums' }}>
                        {barIdx + 1}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                        {bar.map((c, ci) => (
                          <span key={ci} style={{ fontSize: 11, fontWeight: 700, color: isActive ? '#00d4b4' : 'rgba(255,255,255,0.82)', lineHeight: 1.2 }}>
                            {fmt(c.symbol)}
                            {ci < bar.length - 1 && <span style={{ color: 'rgba(255,255,255,0.25)', fontWeight: 400 }}> / </span>}
                          </span>
                        ))}
                      </div>
                    </div>
                  )
                })}
                {Array.from({ length: 4 - rowBars.length }, (_, i) => (
                  <div key={`e${i}`} style={{ border: '1px dashed rgba(255,255,255,0.04)', borderRadius: 6, minHeight: 40 }} />
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {/* Play button */}
      <button onClick={playing ? stop : start} disabled={loading} style={{
        width: '100%', padding: '14px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14,
        cursor: loading ? 'wait' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        border: 'none', transition: 'all 0.2s',
        background: playing ? 'rgba(224,82,82,0.12)' : loading ? 'rgba(255,255,255,0.07)' : 'linear-gradient(135deg,#00d4b4,#00a896)',
        color: playing ? '#e05252' : loading ? 'rgba(255,255,255,0.4)' : '#000',
        boxShadow: playing || loading ? 'none' : '0 0 20px rgba(0,212,180,0.25)',
        opacity: loading ? 0.7 : 1,
      }}>
        {loading
          ? '⏳ Chargement des sons…'
          : playing
            ? <><Pause size={16} /> Arrêter</>
            : <><Play size={16} /> Lancer le backing track</>
        }
      </button>

      <div style={{ marginTop: 10, display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
        {[
          { label: 'Piano', detail: 'Kenny Barron comping' },
          { label: 'Basse', detail: 'Karoryfer Sneakybass pizzicato' },
          { label: 'Batterie', detail: 'Orange Tree Samples Jazz Kit' },
        ].map(i => (
          <div key={i.label} style={{ fontSize: 10, color: 'rgba(255,255,255,0.2)', textAlign: 'center' }}>
            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 600 }}>{i.label}</span> · {i.detail}
          </div>
        ))}
      </div>
    </div>
  )
}
