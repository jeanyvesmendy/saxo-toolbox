import { useState } from 'react'

const ROOTS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B']
const ROOT_FR: Record<string, string> = {
  C:'Do', 'C#':'Do#', D:'Ré', Eb:'Mib', E:'Mi', F:'Fa', 'F#':'Fa#', G:'Sol', Ab:'Lab', A:'La', Bb:'Sib', B:'Si'
}
const ALL_NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const FLAT_MAP: Record<string, string> = { 'C#':'Db', 'D#':'Eb', 'F#':'Gb', 'G#':'Ab', 'A#':'Bb' }

const SCALES: Record<string, { name: string; desc: string; intervals: number[] }> = {
  major:      { name: 'Majeure', desc: 'Gamme diatonique fondamentale', intervals: [0,2,4,5,7,9,11] },
  minor_nat:  { name: 'Mineure naturelle', desc: 'Mineure éolienne', intervals: [0,2,3,5,7,8,10] },
  minor_harm: { name: 'Mineure harmonique', desc: 'VIIème degré élevé', intervals: [0,2,3,5,7,8,11] },
  dorian:     { name: 'Dorien', desc: 'Mode II — jazz blues', intervals: [0,2,3,5,7,9,10] },
  mixolydian: { name: 'Mixolydien', desc: 'Mode V — dominant blues', intervals: [0,2,4,5,7,9,10] },
  blues:      { name: 'Blues', desc: 'Pentatonique + blue note', intervals: [0,3,5,6,7,10] },
  pentatonic: { name: 'Pentatonique majeure', desc: '5 notes, très utilisée en jazz', intervals: [0,2,4,7,9] },
  penta_min:  { name: 'Pentatonique mineure', desc: '5 notes mineures', intervals: [0,3,5,7,10] },
  whole:      { name: 'Tons entiers', desc: 'Gamme symétrique — effets Debussy', intervals: [0,2,4,6,8,10] },
  dim:        { name: 'Diminuée (TS)', desc: 'Ton-demi-ton, symétrique', intervals: [0,2,3,5,6,8,9,11] },
}

function getScaleNotes(root: string, intervals: number[]): string[] {
  const rootIdx = ALL_NOTES.indexOf(root)
  return intervals.map(i => {
    const note = ALL_NOTES[(rootIdx + i) % 12]
    return FLAT_MAP[note] ?? note
  })
}

const SAX_FINGERINGS: Record<string, string> = {
  C: 'T 1 2 3 | 1 2 3', 'C#': 'T 1 2 3 | 1 2 3 + Eb', D: 'T 1 2 3 | 1 2',
  Db: 'T 1 2 3 | 1 2 3 + Eb', Eb: 'T 1 2 3 | 1', E: 'T 1 2 3',
  F: 'T 1 2 | F', 'F#': 'T 1 2 | F + Eb', Gb: 'T 1 2 | F + Eb',
  G: 'T 1 2', Ab: 'T 1 2 + G#', 'G#': 'T 1 2 + G#',
  A: 'T 1', Bb: 'T 1 + Bes', 'A#': 'T 1 + Bes', B: 'T', Db2: 'T + Octave',
}

export default function Scales() {
  const [root, setRoot] = useState('C')
  const [scale, setScale] = useState('major')

  const def = SCALES[scale]
  const notes = getScaleNotes(root, def.intervals)

  const card = { background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }
  const lbl = { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 10, display: 'block' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {/* Root selector */}
      <div style={{ marginBottom: 20 }}>
        <span style={lbl}>Tonique</span>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ROOTS.map(r => (
            <button key={r} onClick={() => setRoot(r)} style={{
              width: 48, height: 40, borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
              background: root === r ? '#00d4b4' : 'rgba(255,255,255,0.05)',
              borderColor: root === r ? '#00d4b4' : 'rgba(255,255,255,0.1)',
              color: root === r ? '#000' : 'rgba(255,255,255,0.7)',
            }}>{ROOT_FR[r]}</button>
          ))}
        </div>
      </div>

      {/* Scale selector */}
      <div style={{ marginBottom: 24 }}>
        <span style={lbl}>Gamme / Mode</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {Object.entries(SCALES).map(([id, s]) => (
            <button key={id} onClick={() => setScale(id)} style={{
              padding: '10px 14px', borderRadius: 12, textAlign: 'left', cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
              background: scale === id ? 'rgba(0,212,180,0.1)' : 'rgba(255,255,255,0.04)',
              borderColor: scale === id ? 'rgba(0,212,180,0.35)' : 'rgba(255,255,255,0.07)',
            }}>
              <div style={{ fontSize: 13, fontWeight: 500, color: scale === id ? '#00d4b4' : 'rgba(255,255,255,0.85)', marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.3)' }}>{s.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Scale display */}
      <div style={{ ...card, padding: '24px' }}>
        <div style={{ fontSize: 16, fontWeight: 700, color: '#fff', marginBottom: 2 }}>
          {ROOT_FR[root] ?? root} {def.name}
        </div>
        <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.3)', marginBottom: 20 }}>{def.desc}</div>

        {/* Notes */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
          {notes.map((n, i) => (
            <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{
                width: 48, height: 48, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700,
                background: i === 0 ? '#00d4b4' : 'rgba(255,255,255,0.08)',
                color: i === 0 ? '#000' : '#fff',
              }}>{ROOT_FR[n] ?? n}</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginTop: 4 }}>
                {['I','II','III','IV','V','VI','VII','VIII','IX'][i]}
              </div>
            </div>
          ))}
        </div>

        {/* Intervals */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>Intervalles (demi-tons)</div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {def.intervals.map((v, i) => (
              <span key={i} style={{ padding: '3px 10px', background: 'rgba(255,255,255,0.05)', borderRadius: 8, fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}>{v}</span>
            ))}
          </div>
        </div>

        {/* Fingerings */}
        <div>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 12 }}>Doigtés (saxophone)</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
            {notes.map((n, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12 }}>
                <span style={{ width: 32, textAlign: 'center', fontWeight: 700, color: i === 0 ? '#00d4b4' : 'rgba(255,255,255,0.7)' }}>
                  {ROOT_FR[n] ?? n}
                </span>
                <span style={{ color: 'rgba(255,255,255,0.3)', fontFamily: 'monospace' }}>{SAX_FINGERINGS[n] ?? '—'}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
