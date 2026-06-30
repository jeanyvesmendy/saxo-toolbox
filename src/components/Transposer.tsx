import { useState } from 'react'
import { ArrowRight } from 'lucide-react'

const card = { background: '#1f1a12', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }

const NOTES_SHARP = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTES_FLAT  = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B']

const INSTRUMENTS = [
  { id: 'concert', label: 'Concert (Do)', offset: 0 },
  { id: 'soprano', label: 'Soprano Sib', offset: 2 },
  { id: 'alto', label: 'Alto Mib', offset: 9 },
  { id: 'tenor', label: 'Ténor Sib', offset: 2 },
  { id: 'bari', label: 'Baryton Mib', offset: 9 },
]

const KEYS = [
  { name: 'Do', idx: 0 }, { name: 'Do#/Réb', idx: 1 }, { name: 'Ré', idx: 2 },
  { name: 'Mib', idx: 3 }, { name: 'Mi', idx: 4 }, { name: 'Fa', idx: 5 },
  { name: 'Fa#/Solb', idx: 6 }, { name: 'Sol', idx: 7 }, { name: 'Lab', idx: 8 },
  { name: 'La', idx: 9 }, { name: 'Sib', idx: 10 }, { name: 'Si', idx: 11 },
]


function transposeText(text: string, fromOffset: number, toOffset: number): string {
  const noteRegex = /\b([A-G])(#|b)?\b/g
  return text.replace(noteRegex, (_, n, acc) => {
    const note = n + (acc || '')
    const idx = NOTES_SHARP.indexOf(note) !== -1
      ? NOTES_SHARP.indexOf(note)
      : NOTES_FLAT.indexOf(note)
    if (idx === -1) return note
    const newIdx = ((idx - fromOffset + toOffset) % 12 + 12) % 12
    return NOTES_FLAT[newIdx]
  })
}

export default function Transposer() {
  const [from, setFrom] = useState('concert')
  const [to, setTo] = useState('alto')
  const [text, setText] = useState('')

  const fromInstr = INSTRUMENTS.find(i => i.id === from)!
  const toInstr = INSTRUMENTS.find(i => i.id === to)!

  const transposed = text ? transposeText(text, fromInstr.offset, toInstr.offset) : ''

  const lbl = { fontSize: 11, color: 'rgba(201,162,75,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase' as const, marginBottom: 10, display: 'block', fontWeight: 600 }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      {/* Instrument selector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        <div>
          <span style={lbl}>De</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {INSTRUMENTS.map(i => (
              <button key={i.id} onClick={() => setFrom(i.id)}
                style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                  background: from === i.id ? '#c9a24b' : 'rgba(255,255,255,0.04)',
                  borderColor: from === i.id ? '#c9a24b' : 'rgba(255,255,255,0.07)',
                  color: from === i.id ? '#14110d' : 'rgba(255,255,255,0.6)',
                  fontWeight: from === i.id ? 700 : 400,
                }}
              >{i.label}</button>
            ))}
          </div>
        </div>
        <div>
          <span style={lbl}>Vers</span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {INSTRUMENTS.map(i => (
              <button key={i.id} onClick={() => setTo(i.id)}
                style={{
                  padding: '10px 14px', borderRadius: 10, fontSize: 13, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', border: '1px solid',
                  background: to === i.id ? '#c9a24b' : 'rgba(255,255,255,0.04)',
                  borderColor: to === i.id ? '#c9a24b' : 'rgba(255,255,255,0.07)',
                  color: to === i.id ? '#14110d' : 'rgba(255,255,255,0.6)',
                  fontWeight: to === i.id ? 700 : 400,
                }}
              >{i.label}</button>
            ))}
          </div>
        </div>
      </div>

      {/* Tonality table */}
      <div style={{ ...card, padding: '20px 24px', marginBottom: 16 }}>
        <span style={lbl}>Table de transposition — toutes tonalités</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 32px 1fr', gap: '4px 8px' }}>
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', paddingBottom: 8 }}>Concert</div>
          <div />
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', paddingBottom: 8 }}>{toInstr.label}</div>
          {KEYS.map(k => (
            <div key={k.idx} style={{ display: 'contents' }}>
              <div style={{ fontSize: 14, color: '#c9a24b', fontWeight: 600, padding: '3px 0' }}>{k.name}</div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ArrowRight size={11} color="rgba(255,255,255,0.2)" /></div>
              <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500, padding: '3px 0' }}>
                {NOTES_FLAT[((k.idx - fromInstr.offset + toInstr.offset) % 12 + 12) % 12]}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Free text */}
      <div style={{ ...card, padding: '20px 24px' }}>
        <span style={lbl}>Transposer des accords libres</span>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>{fromInstr.label}</div>
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder={'Ex: Am G F C\nDm7 G7 Cmaj7'} rows={5}
              style={{ width: '100%', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#fff', fontFamily: 'monospace', resize: 'none', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)', marginBottom: 6 }}>{toInstr.label}</div>
            <div style={{ background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '10px 12px', fontSize: 13, color: '#c9a24b', fontFamily: 'monospace', minHeight: 120, whiteSpace: 'pre-wrap' }}>
              {transposed || <span style={{ color: 'rgba(255,255,255,0.15)' }}>Résultat…</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
