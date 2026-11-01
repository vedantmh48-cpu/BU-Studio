import { useEffect, useState } from 'react';
import { Aperture, ArrowRight, Check, ChevronDown, CircleHelp, Crop, ImagePlus, RotateCcw, RotateCw, Sparkles, WandSparkles } from 'lucide-react';

const presets = [
  { name: 'Original', tint: 'preset-original', values: { exposure: 0, contrast: 0, saturation: 100, warmth: 0 } },
  { name: 'Soft film', tint: 'preset-film', values: { exposure: 9, contrast: -5, saturation: 86, warmth: 14 } },
  { name: 'Golden', tint: 'preset-golden', values: { exposure: 14, contrast: 10, saturation: 123, warmth: 28 } },
  { name: 'Dreamy', tint: 'preset-dreamy', values: { exposure: 12, contrast: -7, saturation: 92, warmth: 11 } },
  { name: 'Cinematic', tint: 'preset-film', values: { exposure: -4, contrast: 22, saturation: 82, warmth: -8 } },
  { name: 'Vintage', tint: 'preset-golden', values: { exposure: 3, contrast: -8, saturation: 76, warmth: 20 } },
  { name: 'Moody', tint: 'preset-original', values: { exposure: -12, contrast: 24, saturation: 88, warmth: -5 } },
  { name: 'Pastel', tint: 'preset-dreamy', values: { exposure: 12, contrast: -12, saturation: 88, warmth: 8 } },
];

const enhancers = [
  { key: 'denoise', label: 'Denoise', min: 0, max: 100, hint: 'Soften visible image noise' },
  { key: 'sharpness', label: 'Sharpen', min: 0, max: 100, hint: 'Increase edge contrast' },
  { key: 'clarity', label: 'Clarity', min: 0, max: 100, hint: 'Add local contrast' },
];

const grading = [
  { key: 'exposure', label: 'Exposure', min: -50, max: 50 },
  { key: 'contrast', label: 'Contrast', min: -50, max: 50 },
  { key: 'highlights', label: 'Highlights', min: -50, max: 50 },
  { key: 'shadows', label: 'Shadows', min: -50, max: 50 },
  { key: 'saturation', label: 'Saturation', min: 0, max: 200, suffix: '%' },
  { key: 'warmth', label: 'Temperature', min: -50, max: 50 },
];

function Slider({ label, value, min, max, onChange, hint, suffix = '' }) {
  const percentage = ((value - min) / (max - min)) * 100;
  return <div className="slider-control"><div className="slider-label-row"><label>{label}</label><span className="slider-value">{value}{suffix}</span></div>{hint && <div className="slider-hint">{hint}</div>}<input type="range" min={min} max={max} value={value} style={{ '--range-progress': `${percentage}%` }} onChange={(event) => onChange(event.target.value)} aria-label={label} /></div>;
}

function EnhancePanel({ adjustments, updateAdjustment, upscale, onApplyUpscale }) {
  const [scale, setScale] = useState(upscale === 4 ? 4 : 2);
  return <>
    <div className="ai-callout"><div className="ai-callout-icon"><Sparkles size={17} /></div><div><strong>Fine-tune your image</strong><p>Preview adjustments before export.</p></div><span className="beta-pill">LOCAL</span></div>
    <div className="section-heading"><span>ENHANCEMENT PREVIEW</span><button title="Adjustments are previews; upscaling changes export dimensions"><CircleHelp size={14} /></button></div>
    <div className="enhancer-card">{enhancers.map(({ key, ...item }) => <Slider key={key} {...item} value={adjustments[key]} onChange={(value) => updateAdjustment(key, value)} />)}</div>
    <div className="section-heading upscale-heading"><span>EXPORT RESOLUTION</span></div>
    <div className="scale-options">{[2, 4].map((value) => <button key={value} className={`scale-option ${scale === value ? 'selected' : ''}`} onClick={() => setScale(value)}><span className="scale-glyph">{value === 2 ? '↗' : '✳'}</span><span><strong>{value}× output</strong><small>{value === 2 ? 'Double pixel dimensions' : 'Four times the pixels'}</small></span>{scale === value && <Check size={14} />}</button>)}</div>
    <button className="primary-button enhance-button" onClick={() => onApplyUpscale(scale)}><WandSparkles size={16} />Apply {scale}× export size<ArrowRight size={15} /></button>
    <div className="small-note">Filters are previews; output size changes on export.</div>
  </>;
}

function ColorPanel({ adjustments, updateAdjustment, preset, applyPreset }) {
  const [showAll, setShowAll] = useState(false);
  const visiblePresets = showAll ? presets : presets.slice(0, 4);
  return <>
    <div className="section-heading first-section"><span>QUICK LOOKS</span><button onClick={() => setShowAll((value) => !value)}>{showAll ? 'Fewer' : 'See all'} <ArrowRight size={12} /></button></div>
    <div className="preset-grid">{visiblePresets.map(({ name, tint, values }) => <button key={name} className={`preset-card ${preset === name ? 'active' : ''}`} onClick={() => applyPreset(name, values)}><span className={`preset-swatch ${tint}`}><span /></span><span className="preset-name">{name}</span>{preset === name && <span className="preset-check"><Check size={10} /></span>}</button>)}</div>
    <div className="section-heading color-heading"><span>LIGHT & COLOR</span><button className="reset-link" onClick={() => applyPreset('Original', presets[0].values)}>Reset</button></div>
    <div className="adjustment-list">{grading.map(({ key, ...item }) => <Slider key={key} {...item} value={adjustments[key]} onChange={(value) => updateAdjustment(key, value)} />)}</div>
    <div className="curve-card"><div className="curve-title"><span>TONAL CURVE · CONTRAST</span></div><Slider label="Curve contrast" value={adjustments.curve ?? 0} min={-50} max={50} onChange={(value) => updateAdjustment('curve', value)} /><div className="curve-graph"><span className="curve-line" /></div><div className="curve-foot"><span>Shadows</span><span>Highlights</span></div></div>
  </>;
}

function BackgroundPanel({
  onUpload, cutout, removingBackground, removalProgress, onRemoveBackground,
  onResetCutout, backgroundOption, onBackgroundChange, brushSize, onBrushSizeChange,
  brushMode, onBrushModeChange, onBackgroundUpload,
}) {
  const choices = [
    { name: 'Transparent', key: 'transparent', color: 'transparent-swatch' },
    { name: 'Soft sage', key: 'sage', color: 'sage-swatch' },
    { name: 'Warm sand', key: 'sand', color: 'sand-swatch' },
    { name: 'Lavender', key: 'lavender', color: 'lavender-swatch' },
    { name: 'Soft coral', key: 'coral', color: 'coral-swatch' },
  ];
  return <>
    <div className="ai-callout"><div className="ai-callout-icon coral-icon"><Aperture size={17} /></div><div><strong>Private on-device cutout</strong><p>Image processing stays in this browser.</p></div><span className="beta-pill">LOCAL</span></div>
    <button className="primary-button cutout-button" onClick={cutout ? onResetCutout : onRemoveBackground} disabled={removingBackground}><Sparkles size={16} />{removingBackground ? `Removing background · ${removalProgress}%` : cutout ? 'Restore original image' : 'Remove background'}<ArrowRight size={15} /></button>
    {!cutout && <p className="model-note">First use downloads a 90 MB segmentation model. Your photo is not uploaded.</p>}
    {removingBackground && <progress className="model-progress" max="100" value={removalProgress} aria-label="Background removal progress" />}
    <div className="section-heading bg-section"><span>REFINE EDGES</span></div>
    <div className="brush-card">
      <div className="brush-mode-options">{['restore', 'erase'].map((mode) => <button key={mode} className={brushMode === mode ? 'selected' : ''} disabled={!cutout} onClick={() => onBrushModeChange(mode)}>{mode === 'restore' ? 'Restore' : 'Erase'}</button>)}</div>
      <div className="brush-row"><span className="brush-swatch"><span /></span><div><strong>Brush size · {brushSize} px</strong><small>Paint over the subject or background</small></div></div>
      <input type="range" min="8" max="120" value={brushSize} disabled={!cutout} onChange={(event) => onBrushSizeChange(Number(event.target.value))} aria-label="Refine brush size" />
    </div>
    <div className="section-heading bg-section"><span>NEW BACKGROUND</span></div>
    <div className="background-swatches">{choices.map(({ name, key, color }) => <button key={key} className={`background-choice ${backgroundOption === key ? 'selected' : ''}`} onClick={() => onBackgroundChange(key)}><span className={`background-swatch ${color}`} />{name}</button>)}</div>
    <button className="upload-background" onClick={onBackgroundUpload} disabled={!cutout}><ImagePlus size={16} /><span><strong>Use your own image</strong><small>{cutout ? 'Choose a background file' : 'Remove the background first'}</small></span><ArrowRight size={15} /></button>
    <button className={`blur-background ${backgroundOption === 'blur' ? 'selected' : ''}`} onClick={() => onBackgroundChange(backgroundOption === 'blur' ? 'transparent' : 'blur')} disabled={!cutout}><span className="blur-thumb" />Blur original background<span className={`toggle-switch ${backgroundOption === 'blur' ? 'on' : ''}`} /></button>
    <div className="small-note bg-note">{cutout ? 'Drag over the preview to refine the mask.' : 'Run background removal to enable edge refinement.'}</div>
  </>;
}

function AdjustPanel({ adjustments, updateAdjustment, ratioPreset, onRatioChange, rotation, onRotate, flipHorizontal, onFlip, imageScale, onImageScale }) {
  return <>
    <div className="section-heading first-section"><span>TRANSFORM</span><button className="reset-link" onClick={() => { onRotate(0); onRatioChange('Original'); onFlip(false); onImageScale(100); }}>Reset</button></div>
    <div className="transform-actions"><button onClick={() => onRotate((rotation - 90 + 360) % 360)}><RotateCcw size={17} /><span>Rotate left</span></button><button onClick={() => onRotate((rotation + 90) % 360)}><RotateCw size={17} /><span>Rotate right</span></button><button onClick={() => onFlip(!flipHorizontal)}><Crop size={17} /><span>{flipHorizontal ? 'Unflip' : 'Flip'}</span></button></div>
    <p className="small-note transform-note">Rotation: {rotation}° · Horizontal flip: {flipHorizontal ? 'On' : 'Off'}</p>
    <div className="section-heading color-heading"><span>ASPECT RATIO</span></div>
    <div className="ratio-options">{['Original', '1:1', '4:5', '16:9', '9:16'].map((value) => <button className={ratioPreset === value ? 'selected' : ''} key={value} onClick={() => onRatioChange(value)}>{value}</button>)}</div>
    <div className="section-heading color-heading"><span>IMAGE SIZE</span></div>
    <Slider label="Scale" value={imageScale} min={25} max={200} suffix="%" onChange={onImageScale} />
    <div className="section-heading color-heading"><span>LIGHT</span></div>
    <div className="adjustment-list">{grading.slice(0, 4).map(({ key, ...item }) => <Slider key={key} {...item} value={adjustments[key]} onChange={(value) => updateAdjustment(key, value)} />)}</div>
    <div className="section-heading color-heading"><span>FINISH</span></div>
    <Slider label="Vignette" value={adjustments.vignette} min={0} max={100} onChange={(value) => updateAdjustment('vignette', value)} />
    <Slider label="Lens blur" value={adjustments.blur} min={0} max={10} suffix=" px" onChange={(value) => updateAdjustment('blur', value)} />
  </>;
}

function PosterPanel({ posterText, onTextChange, onAddText, onAddGraphic, canvasPreset, onCanvasPreset, posterStyle, onPosterStyleChange }) {
  return <>
    <div className="ai-callout poster-callout"><div className="ai-callout-icon"><Sparkles size={17} /></div><div><strong>Make it a moment</strong><p>Your next favorite poster starts here.</p></div></div>
    <div className="section-heading first-section"><span>CANVAS SIZE</span></div>
    <div className="poster-size-select"><select value={canvasPreset} onChange={(event) => onCanvasPreset(event.target.value)}><option>Instagram post</option><option>Instagram story</option><option>LinkedIn banner</option><option>YouTube thumbnail</option><option>A4 poster</option><option>18 × 24 poster</option><option>Custom size</option></select><ChevronDown size={15} /></div>
    <div className="section-heading color-heading"><span>YOUR TYPE</span><button onClick={onAddText}>+ Add text</button></div>
    <div className="type-card"><span className="type-preview">Aa</span><div className="type-meta"><strong>Headline</strong><small>{posterStyle.font} · Bold</small></div><input value={posterText} onChange={(event) => onTextChange(event.target.value, 'headline')} aria-label="Poster headline text" /></div>
    <div className="type-options"><select aria-label="Poster font" value={posterStyle.font} onChange={(event) => onPosterStyleChange({ font: event.target.value })}><option>Manrope</option><option>DM Sans</option><option>Georgia</option><option>Arial</option></select><label>Size <input aria-label="Poster text size" type="number" min="12" max="160" value={posterStyle.size} onChange={(event) => onPosterStyleChange({ size: Math.max(12, Math.min(160, Number(event.target.value) || 12)) })} /></label></div>
    <div className="section-heading color-heading"><span>TEXT COLOR</span></div>
    <div className="poster-colors">{[['#26332b', 'color-ink'], ['#f6f0e2', 'color-cream'], ['#c9d9c8', 'color-sage'], ['#f2c7bd', 'color-coral'], ['#c9b8de', 'color-purple']].map(([color, className]) => <button key={color} aria-label={`Set text color ${color}`} className={`poster-color ${className} ${posterStyle.color === color ? 'chosen' : ''}`} onClick={() => onPosterStyleChange({ color })} />)}</div>
    <div className="section-heading color-heading"><span>ELEMENTS</span></div>
    <div className="element-grid">{['Circle', 'Square', 'Line', 'Star'].map((item, index) => <button key={item} onClick={() => onAddGraphic(item)}><span className={`element-symbol element-${index}`} />{item}</button>)}</div>
  </>;
}

function CanvasSettingsPanel({ canvasPreset, onCanvasPreset, canvasSize, onCanvasSizeChange }) {
  const [dimensions, setDimensions] = useState(canvasSize);
  useEffect(() => setDimensions(canvasSize), [canvasSize]);
  const commitDimension = (key) => onCanvasSizeChange(key, dimensions[key]);
  return <>
    <div className="ai-callout"><div className="ai-callout-icon"><Crop size={17} /></div><div><strong>A canvas for every idea</strong><p>Choose a preset or enter pixel dimensions.</p></div></div>
    <div className="section-heading first-section"><span>START WITH A PRESET</span></div>
    <div className="canvas-preset-list">{['Instagram post', 'Instagram story', 'LinkedIn banner', 'YouTube thumbnail', 'A4 poster', '18 × 24 poster'].map((name) => <button key={name} className={canvasPreset === name ? 'selected' : ''} onClick={() => onCanvasPreset(name)}><span className={`canvas-preset-icon icon-${name.toLowerCase().replaceAll(' ', '-')}`} /><span><strong>{name}</strong><small>{name === 'Instagram post' ? '1080 × 1080 px' : name === 'Instagram story' ? '1080 × 1920 px' : name === 'LinkedIn banner' ? '1584 × 396 px' : name === 'YouTube thumbnail' ? '1280 × 720 px' : name === 'A4 poster' ? '2480 × 3508 px' : '5400 × 7200 px'}</small></span>{canvasPreset === name && <Check size={15} />}</button>)}</div>
    <div className="custom-dimensions"><label>Width (px)<input type="number" min="64" max="12000" value={dimensions.width} onChange={(event) => setDimensions((current) => ({ ...current, width: event.target.value }))} onBlur={() => { commitDimension('width'); setDimensions((current) => ({ ...current, width: canvasSize.width })); }} /></label><label>Height (px)<input type="number" min="64" max="12000" value={dimensions.height} onChange={(event) => setDimensions((current) => ({ ...current, height: event.target.value }))} onBlur={() => { commitDimension('height'); setDimensions((current) => ({ ...current, height: canvasSize.height })); }} /></label></div>
  </>;
}

export function ToolPanels(props) {
  if (props.tool === 'enhance') return <EnhancePanel {...props} />;
  if (props.tool === 'background') return <BackgroundPanel {...props} />;
  if (props.tool === 'color') return <ColorPanel {...props} />;
  if (props.tool === 'adjust') return <AdjustPanel {...props} />;
  if (props.tool === 'poster') return <PosterPanel {...props} />;
  return <CanvasSettingsPanel {...props} />;
}
