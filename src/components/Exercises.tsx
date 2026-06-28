import { useState, useRef, useEffect } from 'react'
import { Play, Pause, RotateCcw, CheckCircle2, ChevronRight } from 'lucide-react'

interface Exercise {
  id: string
  category: string
  title: string
  duration: number
  description: string
  steps: string[]
  tip: string
}

const EXERCISES: Exercise[] = [
  {
    id: 'breath1',
    category: 'Souffle',
    title: 'Respiration diaphragmatique',
    duration: 120,
    description: 'Développez votre capacité pulmonaire et la maîtrise de votre colonne d\'air.',
    steps: [
      'Inspirez profondément en 4 temps — sentez votre ventre se gonfler',
      'Tenez l\'air 2 temps sans tension',
      'Expirez lentement en 8 temps de manière contrôlée',
      'Répétez le cycle 8 fois',
    ],
    tip: 'Posez une main sur le ventre pour sentir le diaphragme travailler.',
  },
  {
    id: 'breath2',
    category: 'Souffle',
    title: 'Long tons (Long Tones)',
    duration: 180,
    description: 'La base de tout travail sonore. Jouez des notes longues en maintenant un son pur et constant.',
    steps: [
      'Prenez un Si bémol grave — tenez 8 temps en pp',
      'Répétez en mf puis en ff, toujours 8 temps',
      'Montez chromatiquement jusqu\'au Ré aigu',
      'Concentrez-vous sur la régularité du son et la justesse',
    ],
    tip: 'Enregistrez-vous pour évaluer la stabilité de votre son.',
  },
  {
    id: 'emb1',
    category: 'Embouchure',
    title: 'Flexibilité d\'embouchure',
    duration: 90,
    description: 'Améliorez votre contrôle du registre et la souplesse de votre embouchure.',
    steps: [
      'Jouez un Sol moyen — faites-le descendre d\'un octave en glissando',
      'Remontez au Sol supérieur en glissando',
      'Travaillez le passage d\'octave sur toutes les notes de la gamme Do',
      'Gardez la mâchoire stable — tout change dans la gorge et les lèvres',
    ],
    tip: 'Pensez à dire "EE" pour les notes aiguës, "OH" pour les graves.',
  },
  {
    id: 'emb2',
    category: 'Embouchure',
    title: 'Growl et effets sonores',
    duration: 60,
    description: 'Ajoutez des couleurs à votre son avec le growl — technique jazz essentielle.',
    steps: [
      'Jouez un Sol médium à volume moyen',
      'Pendant que vous jouez, essayez de gronder doucement dans la gorge (comme un "grrr")',
      'Variez l\'intensité du growl sans interrompre le son',
      'Appliquez-le sur une gamme do majeure',
    ],
    tip: 'Le growl est plus facile à obtenir sur les notes médium-graves.',
  },
  {
    id: 'finger1',
    category: 'Doigtés',
    title: 'Gammes chromatiques lentes',
    duration: 120,
    description: 'Maîtrisez tous les doigtés dans les deux sens, du plus grave au plus aigu.',
    steps: [
      'Commencez au Sib grave — montez chromatiquement jusqu\'au Fa aigu',
      'Tempo = 60 BPM, une note par temps',
      'Redescendez chromatiquement',
      'Répétez 3 fois en augmentant progressivement le tempo',
    ],
    tip: 'Levez les doigts le moins possible — économie de mouvement = rapidité.',
  },
  {
    id: 'finger2',
    category: 'Doigtés',
    title: 'Passage Do-Ré-Mi (fourchette)',
    duration: 90,
    description: 'Le passage de fourchette (Do-Ré au saxophone) est souvent problématique.',
    steps: [
      'Jouez lentement : Si-Do-Ré-Mi-Ré-Do-Si en boucle',
      'Observez le changement de doigtés au niveau du pouce gauche',
      'Accélérez progressivement jusqu\'au tempo musical (♩=120)',
      'Travaillez aussi en liaison (legato) et en détaché',
    ],
    tip: 'Anticipez mentalement le prochain doigté avant de l\'exécuter.',
  },
  {
    id: 'art1',
    category: 'Articulation',
    title: 'Détaché simple Ta-Ta-Ta',
    duration: 90,
    description: 'La base de l\'articulation au saxophone — attaque de langue nette et régulière.',
    steps: [
      'Sur un Sol, jouez des noires en répétant "Ta" avec la langue',
      'Tempo 60 → 80 → 100 → 120 BPM',
      'Gardez le son identique entre chaque note',
      'Appliquez sur la gamme Do majeure montante et descendante',
    ],
    tip: 'La langue touche légèrement l\'anche — ne bloquez pas le souffle.',
  },
  {
    id: 'art2',
    category: 'Articulation',
    title: 'Slap tongue',
    duration: 60,
    description: 'Technique percussive avancée — effet claquement de langue.',
    steps: [
      'Sans le saxophone : collez la langue à l\'anche, retirez-la brusquement',
      'Avec le sax : produisez un "pop" percussif sans souffler',
      'Alternez note soufflée + slap pour créer un motif rythmique',
      'Travaillez lentement — précision avant vitesse',
    ],
    tip: 'Le slap sonne mieux sur les notes médium-graves (Do à Sol).',
  },
]

const CATEGORIES = ['Tous', 'Souffle', 'Embouchure', 'Doigtés', 'Articulation']

function formatTime(s: number) {
  const m = Math.floor(s / 60)
  const sec = Math.floor(s % 60)
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Exercises() {
  const [category, setCategory] = useState('Tous')
  const [selected, setSelected] = useState<Exercise | null>(null)
  const [running, setRunning] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const [done, setDone] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const filtered = EXERCISES.filter(e => category === 'Tous' || e.category === category)

  const startTimer = (ex: Exercise) => {
    setSelected(ex)
    setElapsed(0)
    setDone(false)
    setRunning(true)
  }

  useEffect(() => {
    if (running && selected) {
      timerRef.current = setInterval(() => {
        setElapsed(prev => {
          if (prev >= selected.duration) {
            clearInterval(timerRef.current!)
            setRunning(false)
            setDone(true)
            return selected.duration
          }
          return prev + 1
        })
      }, 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [running, selected])

  const reset = () => {
    setRunning(false)
    setElapsed(0)
    setDone(false)
  }

  const card = { background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16 }
  const lbl = { fontSize: 11, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.12em', textTransform: 'uppercase' as const, marginBottom: 12, display: 'block' }

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>

      {selected ? (
        <div>
          <button onClick={() => { reset(); setSelected(null) }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', fontSize: 13, cursor: 'pointer', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 4 }}>
            ← Retour aux exercices
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(0,212,180,0.1)', color: '#00d4b4', marginBottom: 12 }}>
            {selected.category}
          </div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: '#fff', marginBottom: 8 }}>{selected.title}</h3>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', marginBottom: 24 }}>{selected.description}</p>

          {/* Timer */}
          <div style={{ ...card, padding: '28px 24px', textAlign: 'center', marginBottom: 16 }}>
            {done ? (
              <div style={{ padding: '16px 0' }}>
                <CheckCircle2 size={48} style={{ margin: '0 auto 12px', display: 'block', color: '#00d4b4' }} />
                <div style={{ fontSize: 18, fontWeight: 700, color: '#00d4b4', marginBottom: 4 }}>Exercice terminé !</div>
                <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.35)' }}>{formatTime(selected.duration)} effectuées</div>
              </div>
            ) : (
              <>
                <div style={{ fontSize: 52, fontWeight: 900, color: '#fff', fontVariantNumeric: 'tabular-nums', letterSpacing: '-1px', marginBottom: 12 }}>
                  {formatTime(selected.duration - elapsed)}
                </div>
                <div style={{ height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                  <div style={{ height: '100%', background: '#00d4b4', borderRadius: 4, transition: 'width 1s linear', width: `${(elapsed / selected.duration) * 100}%` }} />
                </div>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <button onClick={() => setRunning(r => !r)} style={{
                    padding: '10px 24px', borderRadius: 10, fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, border: 'none',
                    background: running ? 'rgba(255,255,255,0.08)' : 'linear-gradient(135deg,#00d4b4,#00a896)',
                    color: running ? '#fff' : '#000',
                  }}>
                    {running ? <><Pause size={14} /> Pause</> : <><Play size={14} /> {elapsed === 0 ? 'Démarrer' : 'Reprendre'}</>}
                  </button>
                  <button onClick={reset} style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(255,255,255,0.05)', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <RotateCcw size={14} />
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Steps */}
          <div style={{ ...card, padding: '20px', marginBottom: 12 }}>
            <span style={lbl}>Étapes</span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {selected.steps.map((step, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, fontSize: 13 }}>
                  <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'rgba(0,212,180,0.15)', color: '#00d4b4', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, marginTop: 1 }}>{i+1}</div>
                  <span style={{ color: 'rgba(255,255,255,0.75)', lineHeight: 1.5 }}>{step}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'rgba(0,212,180,0.06)', border: '1px solid rgba(0,212,180,0.15)', borderRadius: 12, padding: '14px 16px', fontSize: 13, color: 'rgba(255,255,255,0.65)' }}>
            <span style={{ fontWeight: 600, color: '#00d4b4' }}>💡 Conseil : </span>{selected.tip}
          </div>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
            {CATEGORIES.map(c => (
              <button key={c} onClick={() => setCategory(c)} style={{
                padding: '6px 16px', borderRadius: 20, fontSize: 13, fontWeight: 500, cursor: 'pointer', border: '1px solid', transition: 'all 0.15s',
                background: category === c ? '#00d4b4' : 'rgba(255,255,255,0.05)',
                borderColor: category === c ? '#00d4b4' : 'rgba(255,255,255,0.1)',
                color: category === c ? '#000' : 'rgba(255,255,255,0.65)',
              }}>{c}</button>
            ))}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map(ex => (
              <button key={ex.id} onClick={() => startTimer(ex)} style={{
                background: '#161616', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: '16px', textAlign: 'left', cursor: 'pointer', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, transition: 'border-color 0.15s',
              }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.15)')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)')}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span style={{ padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, background: 'rgba(0,212,180,0.1)', color: '#00d4b4' }}>{ex.category}</span>
                    <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.25)' }}>{formatTime(ex.duration)}</span>
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: '#fff', marginBottom: 4 }}>{ex.title}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.35)', lineHeight: 1.5 }}>{ex.description}</div>
                </div>
                <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.25)', flexShrink: 0, marginTop: 2 }} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
