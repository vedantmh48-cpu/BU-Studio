import { useState } from 'react';
import { ArrowDownToLine, ChevronDown, Moon, Redo2, Sun, Undo2 } from 'lucide-react';

export function Header({ darkMode, onThemeToggle, onUndo, onRedo, canUndo, canRedo, onExport, exportOpen, onExportFormat, projectName }) {
  const [qualityOpen, setQualityOpen] = useState(false);
  return (
    <header className="topbar">
      <a className="brand" href="#" aria-label="BU Studio home"><span className="brand-mark"><img src="/logob.png" alt="BU Studio logo" className="brand-mark-image" /></span><span>BU<span className="brand-light"> Studio</span></span></a>
      <span className="topbar-separator" />
      <div className="project-title"><span className="project-label">WORKSPACE</span><span className="project-name">{projectName}</span><span className="project-state"><span /> Saved</span></div>
      <div className="topbar-right">
        <div className="history-actions">
          <button className="header-icon" disabled={!canUndo} onClick={onUndo} aria-label="Undo"><Undo2 size={17} /></button>
          <button className="header-icon" disabled={!canRedo} onClick={onRedo} aria-label="Redo"><Redo2 size={17} /></button>
        </div>
        <span className="topbar-separator history-divider" />
        <button className="theme-toggle" onClick={onThemeToggle} aria-label={`Switch to ${darkMode ? 'light' : 'dark'} mode`}>{darkMode ? <Sun size={16} /> : <Moon size={16} />}<span>{darkMode ? 'Light' : 'Dark'}</span></button>
        <div className="export-wrap">
          <button className="export-button" onClick={onExport}><ArrowDownToLine size={16} /><span>Export</span><ChevronDown size={14} /></button>
          {exportOpen && <div className="export-menu"><div className="export-menu-heading">IMAGE SCALE</div>{['png', 'jpg', 'webp'].map((format) => <div className="export-format-row" key={format}><span>{format.toUpperCase()}</span><div>{[1, 2, 3].map((scale) => <button key={scale} aria-label={`Export ${format.toUpperCase()} at ${scale}×`} onClick={() => onExportFormat(format, scale)}>{scale}×</button>)}</div></div>)}<button className="pdf-export" onClick={() => onExportFormat('pdf')}><span>PDF poster</span><span className="export-quality">Print</span></button></div>}
        </div>
      </div>
    </header>
  );
}
