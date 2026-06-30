import { useState } from 'react'

const TEAL = '#c9a24b'

type Aux = {
  d?: boolean        // Touche D (paume gauche)
  eb?: boolean       // Touche Eb (paume gauche)
  bisbb?: boolean    // Touche Bis Bb (côté gauche L1–L2)
  fsharp?: boolean   // Touche F# (côté droit, vers L3)
  c?: boolean        // Touche C (table droite, vers R1)
  gsharp?: boolean   // Touche G# (côté droit, vers R2)
  bb?: boolean       // Touche Bb (côté droit, vers R3)
}

interface Fin {
  label: string
  left: [boolean, boolean, boolean]
  right: [boolean, boolean, boolean]
  aux: Aux
}

const NOTES: Array<{
  id: string
  note: string
  altNote?: string
  fr: string
  desc: string
  fins: Fin[]
}> = [
  {
    id: 'fsharp', note: 'F#', altNote: 'Gb', fr: 'Fa#',
    desc: 'Première note de l\'altissimo, souvent la plus accessible. La clé d\'octave est obligatoire. Tester plusieurs doigtés : chaque instrument répond différemment.',
    fins: [
      { label: '1', left: [true,true,true],  right: [true,true,true],  aux: {} },
      { label: '2', left: [true,true,true],  right: [true,true,true],  aux: { bisbb: true } },
      { label: '3', left: [true,true,true],  right: [true,true,false], aux: {} },
      { label: '4', left: [true,true,true],  right: [true,true,true],  aux: { gsharp: true, bisbb: true } },
    ]
  },
  {
    id: 'g', note: 'G', fr: 'Sol',
    desc: 'Proche du doigté de Fa#. Une légère variation de pression ou un doigt levé suffit souvent à passer du Fa# au Sol suraigu.',
    fins: [
      { label: '1', left: [true,true,true],  right: [true,true,false],  aux: {} },
      { label: '2', left: [true,true,true],  right: [true,false,false], aux: { bisbb: true } },
      { label: '3', left: [true,true,false], right: [true,true,true],   aux: {} },
      { label: '4', left: [true,true,true],  right: [false,false,false],aux: { bisbb: true, gsharp: true } },
    ]
  },
  {
    id: 'gsharp', note: 'G#', altNote: 'Ab', fr: 'Sol#',
    desc: 'Les touches F# et C (table) sont souvent nécessaires pour stabiliser l\'intonation. Expérimenter les combinaisons avec Bb pour trouver la meilleure justesse.',
    fins: [
      { label: '1', left: [true,true,false],  right: [true,false,false],  aux: { fsharp: true, c: true } },
      { label: '2', left: [true,true,true],   right: [false,false,false], aux: { fsharp: true, c: true } },
      { label: '3', left: [true,true,false],  right: [false,false,false], aux: { bisbb: true, c: true } },
      { label: '4', left: [true,false,false], right: [false,false,false], aux: { c: true, gsharp: true } },
    ]
  },
  {
    id: 'a', note: 'A', fr: 'La',
    desc: 'La touche C (table droite) est centrale pour obtenir ce La suraigu. Toute combinaison des touches de table (C, B, Bb) peut fonctionner selon l\'instrument.',
    fins: [
      { label: '1', left: [true,true,false],  right: [false,false,false], aux: { c: true } },
      { label: '2', left: [false,true,false],  right: [false,false,false], aux: { c: true } },
      { label: '3', left: [true,true,false],  right: [false,false,false], aux: { c: true, bisbb: true } },
      { label: '4', left: [true,false,false], right: [false,false,false], aux: { c: true, bb: true } },
    ]
  },
  {
    id: 'bbflat', note: 'A#', altNote: 'Bb', fr: 'Sib',
    desc: 'La touche D (paume gauche) est quasi indispensable pour ce Sib suraigu. Elle s\'utilise combinée aux touches C ou à la configuration habituelle.',
    fins: [
      { label: '1', left: [true,true,true],  right: [true,true,true],   aux: { d: true, c: true } },
      { label: '2', left: [true,true,true],  right: [true,true,false],  aux: { d: true } },
      { label: '3', left: [true,true,false], right: [true,false,false],  aux: { d: true, c: true } },
      { label: '4', left: [true,true,true],  right: [false,false,false], aux: { d: true, c: true } },
    ]
  },
  {
    id: 'b', note: 'B', fr: 'Si',
    desc: 'Doigtés très variés selon les instruments. Les touches D et Eb (paume gauche) permettent d\'accéder à ce Si suraigu — tester impérativement chaque variante.',
    fins: [
      { label: '1', left: [true,false,false],  right: [true,true,true],   aux: { d: true, c: true } },
      { label: '2', left: [true,true,false],   right: [false,false,false], aux: { d: true, eb: true } },
      { label: '3', left: [false,false,false],  right: [true,true,false],  aux: { d: true, eb: true } },
      { label: '4', left: [true,false,false],  right: [false,false,false], aux: { d: true, c: true, eb: true } },
    ]
  },
  {
    id: 'c', note: 'C', fr: 'Do',
    desc: 'Do suraigu — note extrême du registre altissimo courant. Les touches Eb et D (paume) sont presque systématiques. Requiert un travail soutenu de l\'embouchure.',
    fins: [
      { label: '1', left: [true,false,false],   right: [false,false,false], aux: { eb: true, d: true, c: true } },
      { label: '2', left: [true,true,false],    right: [false,false,false], aux: { eb: true, d: true } },
      { label: '3', left: [false,false,false],   right: [false,false,false], aux: { eb: true, d: true } },
      { label: '4', left: [true,true,true],     right: [false,false,false], aux: { eb: true, d: true, c: true } },
    ]
  },
]

function FingeringDiagram({ left, right, aux }: {
  left: [boolean, boolean, boolean]
  right: [boolean, boolean, boolean]
  aux: Aux
}) {
  const CX = 40

  const mainHole = (cx: number, cy: number, closed: boolean) => (
    <>
      <circle cx={cx} cy={cy} r={11}
        fill={closed ? '#d8d8d8' : 'rgba(255,255,255,0.04)'}
        stroke={closed ? 'rgba(255,255,255,0.4)' : 'rgba(255,255,255,0.18)'}
        strokeWidth={1.5}
      />
      {closed && (
        <circle cx={cx} cy={cy - 3} r={4}
          fill="rgba(255,255,255,0.2)" />
      )}
    </>
  )

  const auxKey = (cx: number, cy: number, label: string) => (
    <>
      <circle cx={cx} cy={cy} r={6.5}
        fill={TEAL}
        stroke="rgba(201,162,75,0.3)"
        strokeWidth={2}
      />
      <text x={cx} y={cy + 17} textAnchor="middle"
        fill="rgba(201,162,75,0.7)" fontSize={7} fontFamily="system-ui, -apple-system, sans-serif"
        fontWeight="600">
        {label}
      </text>
    </>
  )

  return (
    <svg viewBox="0 0 80 252" style={{ width: 56, height: 177 }}>
      {/* Corps de l'instrument */}
      <rect x={30} y={14} width={20} height={226} rx={10}
        fill="rgba(255,255,255,0.02)"
        stroke="rgba(255,255,255,0.1)"
        strokeWidth={1}
      />

      {/* Clé d'octave — toujours enfoncée en altissimo */}
      <circle cx={17} cy={24} r={8.5}
        fill={TEAL}
        stroke="rgba(201,162,75,0.4)"
        strokeWidth={2}
      />
      <circle cx={17} cy={21} r={3} fill="rgba(255,255,255,0.3)" />
      <text x={17} y={40} textAnchor="middle"
        fill={TEAL} fontSize={6.5} fontFamily="system-ui, sans-serif" fontWeight="700">
        oct
      </text>

      {/* Main gauche */}
      {mainHole(CX, 54, left[0])}
      {mainHole(CX, 88, left[1])}
      {mainHole(CX, 122, left[2])}

      {/* Séparateur main droite */}
      <line x1={23} y1={140} x2={57} y2={140}
        stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="3 2" />

      {/* Main droite */}
      {mainHole(CX, 162, right[0])}
      {mainHole(CX, 196, right[1])}
      {mainHole(CX, 230, right[2])}

      {/* Touches auxiliaires */}
      {aux.d     && auxKey(14, 48, 'D')}
      {aux.eb    && auxKey(14, 82, 'Eb')}
      {aux.bisbb && auxKey(66, 70, 'Bb')}
      {aux.fsharp&& auxKey(66, 122, 'F#')}
      {aux.c     && auxKey(66, 162, 'C')}
      {aux.gsharp&& auxKey(66, 196, 'G#')}
      {aux.bb    && auxKey(66, 230, 'Bb')}
    </svg>
  )
}

export default function Altissimo() {
  const [activeNote, setActiveNote] = useState('fsharp')
  const note = NOTES.find(n => n.id === activeNote)!

  return (
    <div style={{ maxWidth: 820, margin: '0 auto' }}>

      {/* Introduction */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(201,162,75,0.06), rgba(0,168,150,0.03))',
        border: '1px solid rgba(201,162,75,0.18)',
        borderRadius: 16, padding: '18px 22px', marginBottom: 32
      }}>
        <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.55)', lineHeight: 1.8, margin: 0 }}>
          Ces doigtés sont issus d'une compilation de sources et d'expérimentations comparatives entre saxophonistes.
          Aucun doigté n'est universel — chaque instrument réagit différemment dans ce registre extrême.
          La <strong style={{ color: TEAL }}>clé d'octave est utilisée pour tous les doigtés</strong>, sauf mention contraire.
          Les touches en surbrillance laiton indiquent les clés auxiliaires à enfoncer.
          Certains doigtés peuvent aussi servir de notes de passage ou de trilles.
        </p>
      </div>

      {/* Sélecteur de note */}
      <div style={{ marginBottom: 32 }}>
        <div style={{
          fontSize: 10, fontWeight: 700, letterSpacing: '0.16em',
          color: 'rgba(201,162,75,0.6)', textTransform: 'uppercase', marginBottom: 14
        }}>
          Choisir la note
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {NOTES.map(n => {
            const isActive = activeNote === n.id
            return (
              <button key={n.id} onClick={() => setActiveNote(n.id)}
                style={{
                  padding: '10px 18px', borderRadius: 12, cursor: 'pointer',
                  border: '1px solid', transition: 'all 0.15s',
                  background: isActive ? '#c9a24b' : 'rgba(255,255,255,0.05)',
                  borderColor: isActive ? '#c9a24b' : 'rgba(255,255,255,0.1)',
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
                }}>
                <span style={{
                  fontSize: 15, fontWeight: 800,
                  color: isActive ? '#14110d' : 'rgba(255,255,255,0.75)',
                }}>
                  {n.note}{n.altNote ? `/${n.altNote}` : ''}
                </span>
                <span style={{
                  fontSize: 10, fontWeight: 500,
                  color: isActive ? 'rgba(20,17,13,0.55)' : 'rgba(255,255,255,0.3)',
                }}>
                  {n.fr}
                </span>
              </button>
            )
          })}
        </div>
      </div>

      {/* En-tête de la note */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontSize: 24, fontWeight: 700, color: '#f4ecd8', marginBottom: 8, letterSpacing: '-0.3px' }}>
          {note.note}{note.altNote ? ` / ${note.altNote}` : ''}
          <span style={{ color: TEAL }}> suraigu</span>
          <span style={{ fontSize: 14, fontWeight: 400, color: 'rgba(255,255,255,0.3)', marginLeft: 12 }}>
            ({note.fr})
          </span>
        </h2>
        <p style={{ fontSize: 13.5, color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, maxWidth: 620 }}>
          {note.desc}
        </p>
      </div>

      {/* Diagrammes de doigtés */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
        gap: 14,
        marginBottom: 36,
      }}>
        {note.fins.map((fin, i) => (
          <div key={i} style={{
            background: '#19140d',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 18,
            padding: '18px 14px 14px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14,
            transition: 'border-color 0.15s',
          }}>
            <div style={{
              fontSize: 10, fontWeight: 700, letterSpacing: '0.14em',
              color: 'rgba(201,162,75,0.55)', textTransform: 'uppercase',
            }}>
              Doigté {fin.label}
            </div>

            <FingeringDiagram left={fin.left} right={fin.right} aux={fin.aux} />

            {/* Résumé textuel compact */}
            <div style={{
              fontSize: 10, color: 'rgba(255,255,255,0.25)',
              textAlign: 'center', lineHeight: 1.6,
              fontFamily: 'monospace',
            }}>
              {[fin.left[0]&&'L1',fin.left[1]&&'L2',fin.left[2]&&'L3']
                .filter(Boolean).join(' ')}
              {([fin.left[0],fin.left[1],fin.left[2]].some(Boolean) &&
                [fin.right[0],fin.right[1],fin.right[2]].some(Boolean)) ? ' | ' : ''}
              {[fin.right[0]&&'R1',fin.right[1]&&'R2',fin.right[2]&&'R3']
                .filter(Boolean).join(' ')}
              {Object.entries(fin.aux).filter(([,v])=>v).map(([k])=>(
                <span key={k} style={{ color: 'rgba(201,162,75,0.5)' }}> +{k}</span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Légende */}
      <div style={{
        background: '#16120c',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: 14, padding: '16px 20px',
        display: 'flex', gap: 28, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', color: 'rgba(201,162,75,0.55)', textTransform: 'uppercase' }}>
          Légende
        </span>
        {[
          { color: '#d8d8d8', border: 'rgba(255,255,255,0.4)', label: 'Trou fermé' },
          { color: 'rgba(255,255,255,0.04)', border: 'rgba(255,255,255,0.18)', label: 'Trou ouvert' },
        ].map(item => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%',
              background: item.color, border: `1.5px solid ${item.border}`, flexShrink: 0,
            }} />
            <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{item.label}</span>
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Clé auxiliaire active</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 13, height: 13, borderRadius: '50%', background: TEAL, flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>Clé d'octave (toujours enfoncée)</span>
        </div>
      </div>
    </div>
  )
}
