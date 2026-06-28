import { useState } from 'react'
import { Music2, Settings2, Layers, BookOpen, Mic, Radio, Dumbbell, Menu, X } from 'lucide-react'
import Tuner from './components/Tuner'
import Metronome from './components/Metronome'
import Transposer from './components/Transposer'
import Scales from './components/Scales'
import Recorder from './components/Recorder'
import BackingTrack from './components/BackingTrack'
import Exercises from './components/Exercises'

const TOOLS = [
  { id: 'tuner',     label: 'Accordeur',     icon: Mic,       desc: 'Chromatique temps réel' },
  { id: 'metronome', label: 'Métronome',      icon: Settings2, desc: 'Tempo & pulsation' },
  { id: 'transposer',label: 'Transposeur',    icon: Layers,    desc: 'Sib / Mib / Do' },
  { id: 'scales',    label: 'Gammes',         icon: BookOpen,  desc: 'Gammes & modes' },
  { id: 'backing',   label: 'Backing Tracks', icon: Radio,     desc: 'Jazz, bossa, swing' },
  { id: 'recorder',  label: 'Enregistreur',   icon: Mic,       desc: 'Enregistre & écoute' },
  { id: 'exercises', label: 'Exercices',      icon: Dumbbell,  desc: 'Routines techniques' },
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
      case 'recorder':   return <Recorder />
      case 'exercises':  return <Exercises />
      default: return null
    }
  }

  const activeTool = TOOLS.find(t => t.id === active)!

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#0d0d0d', color: '#e8e8e8' }}>

      {/* Top nav */}
      <header style={{ borderBottom: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,13,13,0.95)', position: 'sticky', top: 0, zIndex: 50 }}
        className="backdrop-blur-md">
        <div className="flex items-center gap-4 px-5" style={{ height: 56 }}>
          {/* Logo */}
          <div className="flex items-center gap-2 shrink-0">
            <div style={{ background: 'linear-gradient(135deg,#00d4b4,#00a896)', borderRadius: 8, padding: 6 }}>
              <Music2 size={15} color="white" />
            </div>
            <span style={{ fontWeight: 800, fontSize: 16, letterSpacing: '-0.5px', color: '#fff' }}>
              Saxo<span style={{ color: '#00d4b4' }}>Toolbox</span>
            </span>
          </div>

          {/* Desktop nav tabs */}
          <nav className="hidden md:flex items-center gap-0 overflow-x-auto flex-1" style={{ scrollbarWidth: 'none' }}>
            {TOOLS.map(tool => {
              const Icon = tool.icon
              const isActive = active === tool.id
              return (
                <button key={tool.id} onClick={() => setActive(tool.id)}
                  className="flex items-center gap-1.5 px-3 whitespace-nowrap cursor-pointer transition-all duration-150"
                  style={{
                    height: 56, fontSize: 13, fontWeight: isActive ? 600 : 400,
                    color: isActive ? '#00d4b4' : 'rgba(255,255,255,0.45)',
                    borderTop: 'none', borderLeft: 'none', borderRight: 'none',
                    borderBottom: isActive ? '2px solid #00d4b4' : '2px solid transparent',
                    background: 'none',
                  }}
                >
                  <Icon size={13} />{tool.label}
                </button>
              )
            })}
          </nav>

          {/* Active tool label on mobile */}
          <span className="md:hidden flex-1 text-sm font-semibold" style={{ color: '#00d4b4' }}>
            {TOOLS.find(t => t.id === active)?.label}
          </span>

          {/* Burger button (mobile only) */}
          <button onClick={() => setMobileNavOpen(o => !o)}
            className="md:hidden flex items-center justify-center cursor-pointer"
            style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(255,255,255,0.07)', border: 'none', color: '#fff' }}
          >
            {mobileNavOpen ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>

        {/* Mobile dropdown nav */}
        {mobileNavOpen && (
          <div className="md:hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.07)', background: 'rgba(13,13,13,0.98)', padding: '8px 0' }}>
            {TOOLS.map(tool => {
              const Icon = tool.icon
              const isActive = active === tool.id
              return (
                <button key={tool.id} onClick={() => { setActive(tool.id); setMobileNavOpen(false) }}
                  className="w-full flex items-center gap-3 cursor-pointer transition-all"
                  style={{
                    padding: '12px 20px', fontSize: 14, fontWeight: isActive ? 600 : 400, textAlign: 'left',
                    background: isActive ? 'rgba(0,212,180,0.08)' : 'none',
                    borderTop: 'none', borderRight: 'none', borderBottom: 'none',
                    color: isActive ? '#00d4b4' : 'rgba(255,255,255,0.6)',
                    borderLeft: isActive ? '2px solid #00d4b4' : '2px solid transparent',
                  }}
                >
                  <Icon size={15} />{tool.label}
                </button>
              )
            })}
          </div>
        )}
      </header>

      {/* Hero band */}
      <div style={{ background: 'linear-gradient(to bottom, #111, #0d0d0d)', borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '32px 40px 28px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <p style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#00d4b4', textTransform: 'uppercase', marginBottom: 8 }}>
            Boîte à outils · Saxophoniste
          </p>
          <h1 style={{ fontSize: 32, fontWeight: 800, color: '#fff', letterSpacing: '-0.8px', lineHeight: 1.15, marginBottom: 6 }}>
            {activeTool.label}
          </h1>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.4)', fontWeight: 400 }}>
            {activeTool.desc}
          </p>
        </div>
      </div>

      {/* Main content */}
      <main style={{ flex: 1, padding: '40px 40px', maxWidth: 1100, margin: '0 auto', width: '100%' }}>
        {renderTool()}
      </main>

      {/* Footer */}
      <footer style={{ borderTop: '1px solid rgba(255,255,255,0.06)', padding: '20px 40px', textAlign: 'center' }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.2)' }}>
          SaxoToolbox · La boîte à outils du saxophoniste moderne
        </p>
      </footer>
    </div>
  )
}
