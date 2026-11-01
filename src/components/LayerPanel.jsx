import { useState } from 'react';
import { ChevronDown, Eye, Image, Layers2, LockKeyhole, MoreHorizontal, Plus, Scissors, Sparkles, Type } from 'lucide-react';

const layerIcons = { Image, Adjustment: Sparkles, Text: Type, Graphic: Layers2, Cutout: Scissors };

export function LayerPanel({ layers, selectedLayer, onSelect, onToggle, onOpacityChange, onMove, onAddLayer, activeLayer }) {
  const [collapsed, setCollapsed] = useState(false);
  return (
    <section className="layer-panel">
      <div className="layers-heading"><button className="layers-title" onClick={() => setCollapsed((value) => !value)}><ChevronDown size={15} className={collapsed ? 'collapsed-chevron' : ''} /><span>Layers</span><span className="layer-count">{layers.length}</span></button><button className="icon-button small-icon" onClick={() => onAddLayer('Text')} title="Add layer"><Plus size={16} /></button></div>
      {!collapsed && <><div className="layer-list">{layers.map((layer, index) => {
        const Icon = layerIcons[layer.kind] || Layers2;
        return <div key={layer.id} className={`layer-item ${selectedLayer === layer.id ? 'selected' : ''}`} onClick={() => onSelect(layer.id)}>
          <button className={`layer-eye ${layer.visible ? '' : 'hidden-layer'}`} disabled={layer.locked} onClick={(event) => { event.stopPropagation(); onToggle(layer.id, 'visible'); }} title={layer.locked ? 'Unlock this layer to change visibility' : layer.visible ? 'Hide layer' : 'Show layer'}><Eye size={14} /></button>
          <span className={`layer-thumb layer-${layer.kind.toLowerCase()}`}><Icon size={14} /></span>
          <span className="layer-text"><strong>{layer.name}</strong><small>{layer.kind}</small></span>
          <button className="layer-lock" onClick={(event) => { event.stopPropagation(); onToggle(layer.id, 'locked'); }} title={layer.locked ? 'Unlock layer' : 'Lock layer'}><LockKeyhole size={13} className={layer.locked ? 'is-locked' : ''} /></button>
          <button className="layer-more" onClick={(event) => { event.stopPropagation(); onMove(layer.id, index === 0 ? 1 : -1); }} title={index === 0 ? 'Send backward' : 'Bring forward'}><MoreHorizontal size={15} /></button>
        </div>;
      })}</div>
      {activeLayer && <div className="layer-opacity"><div><span>Opacity</span><span>{activeLayer.opacity}%</span></div><input type="range" min="0" max="100" value={activeLayer.opacity} disabled={activeLayer.locked} onChange={(event) => onOpacityChange(activeLayer.id, event.target.value)} aria-label="Selected layer opacity" /></div>}
      <button className="add-layer-button" onClick={() => onAddLayer('Text')}><Plus size={15} />Add a layer</button></>}
    </section>
  );
}
