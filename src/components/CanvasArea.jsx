import { useRef, useState } from 'react';
import { ArrowDownToLine, ImagePlus, Move, Sparkles } from 'lucide-react';

export function CanvasArea({
  image, cutout, imageName, imageRef, originalImageRef, imageStyle, imageVisible,
  imageOpacity, vignette, beforeAfter, comparison, setComparison, zoom, tool, removingBackground,
  posterText, posterStyle, textLayers, graphicLayers, onTextChange, onUpload,
  fileInput, onNotice, backgroundOption, backgroundImage, aspectRatio, fitMode, rotation,
  flipHorizontal, imageScale, brushMode, brushSize, onRefine, onFinishRefinement,
}) {
  const [dragging, setDragging] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const dragStart = useRef(null);
  const [posterPosition, setPosterPosition] = useState({ x: 50, y: 82 });
  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    onUpload(event.dataTransfer.files?.[0]);
  };
  const handlePointerDown = (event) => {
    if (event.target instanceof HTMLInputElement) return;
    if (tool === 'background' && cutout) {
      if (event.target.closest('.bg-preview-chip,.poster-overlay,.comparison-range')) return;
      event.currentTarget.setPointerCapture(event.pointerId);
      applyBrush(event);
      return;
    }
    if (tool !== 'poster' || event.target.tagName === 'INPUT') return;
    dragStart.current = { x: event.clientX, y: event.clientY, position: posterPosition };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const handlePointerMove = (event) => {
    if (tool === 'background' && cutout && event.buttons === 1) {
      applyBrush(event);
      return;
    }
    if (!dragStart.current) return;
    setPosterPosition({
      x: Math.max(10, Math.min(90, dragStart.current.position.x + (event.clientX - dragStart.current.x) / 5)),
      y: Math.max(10, Math.min(90, dragStart.current.position.y + (event.clientY - dragStart.current.y) / 5)),
    });
  };
  const applyBrush = (event) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    onRefine?.({
      x: Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)),
      y: Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height)),
    });
  };
  const handlePointerUp = () => {
    dragStart.current = null;
    if (tool === 'background' && cutout) onFinishRefinement?.();
  };

  return (
    <div className={`canvas-stage ${dragging ? 'is-dragging' : ''}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={handleDrop}>
      <div className="canvas-top-label"><span className="canvas-live-dot" /> LIVE PREVIEW <span className="canvas-top-divider" /> {imageName}</div>
      <div className="canvas-artboard-wrap">
        <div className={`artboard ${imageFailed ? 'image-error' : ''} ${tool === 'background' && cutout ? `brush-${brushMode}` : ''}`} style={{ aspectRatio, transform: `scale(${zoom / 100})` }} onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerUp}>
          {cutout && backgroundOption === 'sage' && <div className="replacement-background sage-swatch" />}
          {cutout && backgroundOption === 'sand' && <div className="replacement-background sand-swatch" />}
          {cutout && backgroundOption === 'lavender' && <div className="replacement-background lavender-swatch" />}
          {cutout && backgroundOption === 'coral' && <div className="replacement-background coral-swatch" />}
          {cutout && backgroundOption === 'image' && backgroundImage && <img className="replacement-background-image" src={backgroundImage} alt="Replacement background" />}
          {cutout && backgroundOption === 'blur' && <img className="replacement-background-image blurred-background" src={image} alt="" />}
          {!imageFailed && <img ref={imageRef} src={cutout || image} alt={imageName} className={`artboard-image ${cutout ? 'cutout-image' : ''}`} style={{ ...imageStyle, opacity: imageVisible ? imageOpacity / 100 : 0, objectFit: fitMode, transform: `translate(-50%, -50%) rotate(${rotation}deg) scale(${imageScale / 100}) scaleX(${flipHorizontal ? -1 : 1})` }} crossOrigin="anonymous" onError={() => setImageFailed(true)} onLoad={() => setImageFailed(false)} />}
          <img ref={originalImageRef} src={image} alt="" className="original-export-image" crossOrigin="anonymous" />
          {imageFailed && <div className="image-placeholder"><ImagePlus size={34} /><strong>Let’s make something</strong><span>Drop an image here or upload from your device.</span><button onClick={() => fileInput.current?.click()}>Choose an image</button></div>}
          {vignette > 0 && imageVisible && <div className="vignette-overlay" style={{ background: `radial-gradient(ellipse at center, transparent 38%, rgba(12, 16, 13, ${vignette / 210}) 100%)` }} />}
          {beforeAfter && !imageFailed && <div className="comparison-layer" style={{ clipPath: `inset(0 ${100 - comparison}% 0 0)` }}><img src={image} alt="Original image comparison" style={{ filter: 'none' }} /></div>}
          {beforeAfter && !imageFailed && <div className="comparison-divider" style={{ left: `${comparison}%` }}><span className="comparison-handle"><Move size={14} /></span><span className="comparison-label before-label">BEFORE</span><span className="comparison-label after-label">AFTER</span></div>}
          {beforeAfter && <input className="comparison-range" aria-label="Before and after comparison" type="range" min="5" max="95" value={comparison} onChange={(event) => setComparison(Number(event.target.value))} />}
          {tool === 'poster' && textLayers.map((layer, index) => <div key={layer.id} className="poster-overlay" style={{ left: `${posterPosition.x}%`, top: `${posterPosition.y + index * 8}%`, opacity: layer.opacity / 100, color: posterStyle.color, fontFamily: posterStyle.font, fontSize: `${posterStyle.size}px` }}><input aria-label={index === 0 ? 'Poster headline' : layer.name} value={layer.content} onChange={(event) => onTextChange(event.target.value, layer.id)} onPointerDown={(event) => event.stopPropagation()} /><span className="poster-kicker">A COLLECTION OF MOMENTS</span></div>)}
          {tool === 'poster' && graphicLayers.map((layer, index) => <span key={layer.id} className={`poster-graphic graphic-${layer.content.toLowerCase()}`} style={{ left: `${20 + index * 13}%`, top: `${22 + index * 8}%`, opacity: layer.opacity / 100 }} />)}
          {tool === 'background' && <div className="bg-preview-chip"><Sparkles size={14} /> {cutout ? 'Refine foreground edges' : 'On-device segmentation'} <span>{cutout ? 'Ready' : 'Private'}</span></div>}
          <div className="artboard-corner artboard-corner-tl" /><div className="artboard-corner artboard-corner-br" />
        </div>
      </div>
      <div className="canvas-bottom-left"><span className="canvas-status"><span /> {tool === 'enhance' ? 'Ready to enhance' : tool === 'background' ? removingBackground ? `Processing · ${imageName}` : cutout ? 'Background removed' : 'Ready to remove background' : 'Preview updated'}</span><span className="canvas-name">{imageName}</span></div>
      <button className="canvas-float-action" onClick={() => onNotice('Your image preview is up to date.')} title="Image options"><ArrowDownToLine size={16} /></button>
      {dragging && <div className="drop-overlay"><div><ImagePlus size={28} /><strong>Drop your image here</strong><span>JPG, PNG or WebP</span></div></div>}
    </div>
  );
}
