import { useState } from 'react'
import { Music2, Settings2, Layers, BookOpen, Mic, Radio, Dumbbell, Menu, X, Zap } from 'lucide-react'
import Tuner from './components/Tuner'
import Metronome from './components/Metronome'
import Transposer from './components/Transposer'
import Scales from './components/Scales'
import Recorder from './components/Recorder'
import BackingTrack from './components/BackingTrack'
import Exercises from './components/Exercises'
import Altissimo from './components/Altissimo'

const TOOLS = [
  { id: 'tuner',      label: 'Accordeur',       icon: Mic,      desc: 'Accordeur chromatique en temps réel' },
  { id: 'metronome',  label: 'Métronome',        icon: Settings2,desc: 'Tempo et pulsation' },
  { id: 'transposer', label: 'Transpositeur',     icon: Layers,   desc: 'Sib / Mib / Do' },
  { id: 'scales',     label: 'Gammes',           icon: BookOpen, desc: 'Gammes & modes' },
  { id: 'backing',    label: 'Accompagnements',  icon: Radio,    desc: 'Jazz, bossa, swing' },
  { id: 'altissimo',  label: 'Notes suraigues',  icon: Zap,      desc: 'Doigtés altissimo — Fa# à Do' },
  { id: 'recorder',   label: 'Enregistreur',     icon: Mic,      desc: 'Enregistre & écoute' },
  { id: 'exercises',  label: 'Exercices',        icon: Dumbbell, desc: 'Routines techniques' },
]

export default function App() {
  const [active, setActive] = useState('tuner')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)

  const renderTool = () => {
    switch (active) {
      case 'tuner':      return <Tuner />
      case 'metronome':  return <Metronome />
      case 'transposer': return <Transposer />
      case 'scales':     return <Scales />
      case 'backing':    return <BackingTrack />
      case 'altissimo':  return <Altissimo />
      case 'recorder':   return <Recorder />
      case 'exercises':  return <Exercises />
      default: return null
    }
  }

  const activeTool = TOOLS.find(t => t.id === active)!

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#14110d', color: '#e8e8e8' }}>

      {/* ── En-tête ── */}
      <header style={{
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(20,17,13,0.97)',
        position: 'sticky', top: 0, zIndex: 50,
        backdropFilter: 'blur(16px)',
      }}>
        <div className="flex items-center gap-5 px-6" style={{ height: 64 }}>

          {/* Logo */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div style={{
              background: 'linear-gradient(135deg, #c9a24b 0%, #a8842f 100%)',
              borderRadius: 10, padding: '7px 8px',
              boxShadow: '0 0 16px rgba(201,162,75,0.25)',
            }}>
              <Music2 size={16} color="white" />
            </div>
            <span style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontWeight: 700, fontSize: 18, letterSpacing: '-0.3px', color: '#f4ecd8' }}>
              Saxo<span style={{ color: '#c9a24b' }}>Toolbox</span>
            </span>
          </div>

          {/* Navigation desktop */}
          <nav className="hidden md:flex items-center gap-1.5 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {TOOLS.map(tool => {
              const Icon = tool.icon
              const isActive = active === tool.id
              return (
                <button key={tool.id} onClick={() => setActive(tool.id)}
                  className="flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-all duration-150"
                  style={{
                    padding: '7px 14px',
                    borderRadius: 9,
                    fontSize: 13,
                    fontWeight: isActive ? 700 : 400,
                    color: isActive ? '#14110d' : 'rgba(255,255,255,0.45)',
                    background: isActive ? '#c9a24b' : 'transparent',
                    border: '1px solid',
                    borderColor: isActive ? '#c9a24b' : 'transparent',
                    boxShadow: 'none',
                  }}
                >
                  <Icon size={13} />
                  {tool.label}
                </button>
              )
            })}
          </nav>

          {/* Nom de l'outil actif (mobile) */}
          <span className="md:hidden flex-1 text-sm font-bold" style={{ color: '#c9a24b' }}>
            {activeTool.label}
          </span>

          {/* Burger (mobile) */}
          <button onClick={() => setMobileNavOpen(o => !o)}
            className="md:hidden flex items-center justify-center cursor-pointer"
            style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#fff',
            }}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Menu mobile déroulant */}
        {mobileNavOpen && (
          <div className="md:hidden" style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            background: 'rgba(20,17,13,0.99)',
            padding: '10px 12px',
          }}>
            {TOOLS.map(tool => {
              const Icon = tool.icon
              const isActive = active === tool.id
              return (
                <button key={tool.id}
                  onClick={() => { setActive(tool.id); setMobileNavOpen(false) }}
                  className="w-full flex items-center gap-3 cursor-pointer transition-all"
                  style={{
                    padding: '12px 16px', marginBottom: 4,
                    fontSize: 14, fontWeight: isActive ? 700 : 400, textAlign: 'left',
                    background: isActive ? '#c9a24b' : 'rgba(255,255,255,0.03)',
                    border: '1px solid',
                    borderColor: isActive ? '#c9a24b' : 'rgba(255,255,255,0.06)',
                    borderRadius: 10,
                    color: isActive ? '#14110d' : 'rgba(255,255,255,0.6)',
                  }}
                >
                  <Icon size={15} />
                  {tool.label}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* ── Bandeau titre ── */}
      <div style={{
        background: 'linear-gradient(180deg, #1c1710 0%, #14110d 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '36px 48px 30px',
        position: 'relative', overflow: 'hidden',
      }}>
        {/* Décoration de fond */}
        <div style={{
          position: 'absolute', right: -80, top: -80,
          width: 300, height: 300, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,162,75,0.06) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <div style={{ maxWidth: 900, margin: '0 auto', position: 'relative' }}>
          <p style={{
            fontSize: 10, fontWeight: 800, letterSpacing: '0.2em',
            color: '#c9a24b', textTransform: 'uppercase', marginBottom: 10,
          }}>
            Boîte à outils · Saxophoniste
          </p>
          <h1 style={{
            fontFamily: 'Georgia, "Times New Roman", serif',
            fontSize: 38, fontWeight: 700, color: '#f4ecd8',
            letterSpacing: '-0.5px', lineHeight: 1.1, marginBottom: 8,
          }}>
            {activeTool.label}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.38)', fontWeight: 400 }}>
            {activeTool.desc}
          </p>
        </div>
      </div>

      {/* ── Contenu principal ── */}
      <main style={{
        flex: 1,
        padding: '44px 48px',
        maxWidth: 1140,
        margin: '0 auto',
        width: '100%',
      }}>
        {renderTool()}
      </main>

      {/* ── Pied de page ── */}
      <footer style={{
        borderTop: '1px solid rgba(255,255,255,0.05)',
        padding: '22px 48px',
        textAlign: 'center',
      }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.15)' }}>
          SaxoToolbox · La boîte à outils du saxophoniste moderne
        </p>
      </footer>
    </div>
  )
}
