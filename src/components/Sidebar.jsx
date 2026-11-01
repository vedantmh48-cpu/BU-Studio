import { Aperture, Crop, Frame, ImagePlus, Scissors, SlidersHorizontal, Sparkles, Type, Upload } from 'lucide-react';

const tools = [
  { id: 'enhance', label: 'AI Enhance', icon: Sparkles },
  { id: 'background', label: 'Remove BG', icon: Scissors },
  { id: 'color', label: 'Color grade', icon: Aperture },
  { id: 'adjust', label: 'Adjustments', icon: SlidersHorizontal },
  { id: 'poster', label: 'Poster design', icon: Type },
  { id: 'canvas', label: 'Canvas size', icon: Frame },
];

export function Sidebar({ activeTool, onSelect, onUpload }) {
  return (
    <nav className="sidebar" aria-label="Studio tools">
      <div className="side-section-label">CREATE</div>
      <div className="tool-list">{tools.map(({ id, label, icon: Icon }) => <button key={id} aria-label={label} title={label} className={`tool-button ${activeTool === id ? 'selected' : ''}`} onClick={() => onSelect(id)}><span className="tool-icon"><Icon size={18} strokeWidth={1.8} /></span><span>{label}</span>{id === 'enhance' && <span className="tool-new">AI</span>}</button>)}</div>
      <div className="sidebar-bottom">
        <div className="side-section-label">QUICK ACTIONS</div>
        <button className="tool-button quick-action" onClick={onUpload}><span className="tool-icon"><ImagePlus size={18} strokeWidth={1.8} /></span><span>Upload image</span></button>
        <div className="sidebar-tip"><div className="tip-glow"><Sparkles size={16} /></div><span className="tip-title">A little more magic</span><span className="tip-copy">Good things happen when you experiment.</span><button onClick={() => onSelect('enhance')}>Explore AI tools <span>→</span></button></div>
        <div className="sidebar-user"><div className="avatar">V</div><div className="user-copy"><strong>Vedant</strong><span>Free plan</span></div><button aria-label="Account options" className="user-menu">···</button></div>
      </div>
    </nav>
  );
}
