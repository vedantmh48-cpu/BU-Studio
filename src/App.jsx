import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowDownToLine, ArrowLeft, ArrowRight, ArrowUpRight, Aperture, Blend,
  Check, ChevronDown, ChevronLeft, ChevronRight, CircleHelp, Crop, Eye,
  FlipHorizontal2, Focus, Frame, ImagePlus, Layers2, LockKeyhole, Maximize2,
  Minus, Moon, MoreHorizontal, Move, Plus, Redo2, RotateCcw, RotateCw,
  Scissors, Settings2, SlidersHorizontal, Sparkles, Sun, SunMedium, Type,
  Undo2, Upload, WandSparkles, X,
} from 'lucide-react';
import { CanvasArea } from './components/CanvasArea.jsx';
import { Header } from './components/Header.jsx';
import { LayerPanel } from './components/LayerPanel.jsx';
import { Sidebar } from './components/Sidebar.jsx';
import { ToolPanels } from './components/ToolPanels.jsx';

const initialAdjustments = {
  exposure: 0, contrast: 0, saturation: 100, warmth: 0, sharpness: 0,
  denoise: 0, clarity: 0, highlights: 0, shadows: 0, vignette: 0, curve: 0,
  blur: 0,
};

const initialLayers = [
  { id: 'photo', name: 'Studio portrait.jpg', kind: 'Image', visible: true, locked: false, opacity: 100 },
  { id: 'adjustments', name: 'Color adjustments', kind: 'Adjustment', visible: true, locked: false, opacity: 100 },
  { id: 'headline', name: 'Chase the light', content: 'Chase the light', kind: 'Text', visible: true, locked: false, opacity: 100 },
];

const initialSnapshot = {
  adjustments: initialAdjustments,
  preset: 'Original',
  layers: initialLayers,
  rotation: 0,
  flipHorizontal: false,
  ratioPreset: 'Original',
  imageScale: 100,
  canvasPreset: 'Instagram post',
  canvasSize: { width: 1080, height: 1080 },
  backgroundOption: 'transparent',
  cutout: '',
  posterStyle: { font: 'Manrope', size: 48, color: '#ffffff' },
  posterText: 'Chase the light',
  upscale: 1,
};

const toolNames = {
  enhance: 'AI Enhancer',
  background: 'Background remover',
  color: 'Color grading',
  adjust: 'Pro adjustments',
  poster: 'Poster builder',
  canvas: 'Canvas settings',
};

function App() {
  const [tool, setTool] = useState('enhance');
  const [darkMode, setDarkMode] = useState(false);
  const [image, setImage] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=88');
  const [imageName, setImageName] = useState('Studio portrait.jpg');
  const [sourceBlob, setSourceBlob] = useState(null);
  const [cutout, setCutout] = useState('');
  const [alphaMask, setAlphaMask] = useState(null);
  const [removalProgress, setRemovalProgress] = useState(0);
  const [removingBackground, setRemovingBackground] = useState(false);
  const [backgroundOption, setBackgroundOption] = useState('transparent');
  const [backgroundImage, setBackgroundImage] = useState('');
  const [brushMode, setBrushMode] = useState('restore');
  const [brushSize, setBrushSize] = useState(32);
  const [ratioPreset, setRatioPreset] = useState('Original');
  const [rotation, setRotation] = useState(0);
  const [flipHorizontal, setFlipHorizontal] = useState(false);
  const [imageScale, setImageScale] = useState(100);
  const [canvasSize, setCanvasSize] = useState({ width: 1080, height: 1080 });
  const [upscale, setUpscale] = useState(1);
  const [adjustments, setAdjustments] = useState(initialAdjustments);
  const [layers, setLayers] = useState(initialLayers);
  const [selectedLayer, setSelectedLayer] = useState('photo');
  const [beforeAfter, setBeforeAfter] = useState(false);
  const [comparison, setComparison] = useState(54);
  const [zoom, setZoom] = useState(100);
  const [preset, setPreset] = useState('Original');
  const [history, setHistory] = useState([initialSnapshot]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [posterText, setPosterText] = useState('Chase the light');
  const [posterStyle, setPosterStyle] = useState({ font: 'Manrope', size: 48, color: '#ffffff' });
  const [canvasPreset, setCanvasPreset] = useState('Instagram post');
  const [exportOpen, setExportOpen] = useState(false);
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);
  const backgroundInput = useRef(null);
  const imageRef = useRef(null);
  const originalImageRef = useRef(null);
  const maskRef = useRef(null);
  const removalRun = useRef(0);
  const objectUrls = useRef({ image: '', cutout: '', background: '' });
  const cutoutUrls = useRef([]);
  const historyRef = useRef([initialSnapshot]);
  const historyIndexRef = useRef(0);
  const snapshotRef = useRef(initialSnapshot);

  useEffect(() => {
    maskRef.current = alphaMask;
  }, [alphaMask]);

  useEffect(() => () => {
    Object.values(objectUrls.current).forEach((url) => {
      if (url && !cutoutUrls.current.includes(url)) URL.revokeObjectURL(url);
    });
    cutoutUrls.current.forEach((url) => URL.revokeObjectURL(url));
  }, []);

  const filterStyle = useMemo(() => ({
    filter: `brightness(${100 + adjustments.exposure + adjustments.shadows * 0.12 + adjustments.highlights * 0.04}%) contrast(${100 + adjustments.contrast + (adjustments.curve ?? 0) + adjustments.clarity * 0.1 + adjustments.sharpness * 0.06}%) saturate(${adjustments.saturation}%) sepia(${Math.max(0, adjustments.warmth) * 0.003}) hue-rotate(${Math.min(0, adjustments.warmth) * 0.45}deg) blur(${adjustments.blur + adjustments.denoise * 0.003}px)`,
  }), [adjustments]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(''), 2600);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const pruneCutoutUrls = (snapshots) => {
    const retainedUrls = new Set(snapshots.map((snapshot) => snapshot.cutout).filter(Boolean));
    cutoutUrls.current = cutoutUrls.current.filter((url) => {
      if (retainedUrls.has(url)) return true;
      URL.revokeObjectURL(url);
      if (objectUrls.current.cutout === url) objectUrls.current.cutout = '';
      return false;
    });
  };

  const recordHistory = useCallback((updates) => {
    const snapshot = { ...snapshotRef.current, ...updates };
    snapshotRef.current = snapshot;
    const next = historyRef.current.slice(0, historyIndexRef.current + 1);
    next.push(snapshot);
    if (next.length > 100) next.shift();
    historyRef.current = next;
    historyIndexRef.current = next.length - 1;
    pruneCutoutUrls(next);
    setHistory(next);
    setHistoryIndex(next.length - 1);
  }, []);

  const resetHistory = (updates) => {
    const snapshot = { ...snapshotRef.current, ...updates };
    snapshotRef.current = snapshot;
    historyRef.current = [snapshot];
    historyIndexRef.current = 0;
    pruneCutoutUrls(historyRef.current);
    setHistory(historyRef.current);
    setHistoryIndex(0);
  };

  const saveHistory = (nextAdjustments, nextPreset = preset) => recordHistory({ adjustments: nextAdjustments, preset: nextPreset });

  const updateAdjustment = (key, value) => {
    const next = { ...adjustments, [key]: Number(value) };
    setAdjustments(next);
    saveHistory(next);
  };

  const applyPreset = (name, values) => {
    setPreset(name);
    const next = { ...adjustments, ...values };
    setAdjustments(next);
    saveHistory(next, name);
  };

  const stepHistory = (direction) => {
    const nextIndex = Math.min(historyRef.current.length - 1, Math.max(0, historyIndexRef.current + direction));
    if (nextIndex === historyIndexRef.current) return;
    const snapshot = historyRef.current[nextIndex];
    historyIndexRef.current = nextIndex;
    setHistoryIndex(nextIndex);
    snapshotRef.current = snapshot;
    setAdjustments(snapshot.adjustments);
    setPreset(snapshot.preset);
    setLayers(snapshot.layers);
    setRotation(snapshot.rotation);
    setFlipHorizontal(snapshot.flipHorizontal);
    setRatioPreset(snapshot.ratioPreset);
    setImageScale(snapshot.imageScale);
    setCanvasPreset(snapshot.canvasPreset);
    setCanvasSize(snapshot.canvasSize);
    setBackgroundOption(snapshot.backgroundOption);
    setCutout(snapshot.cutout || '');
    setPosterStyle(snapshot.posterStyle);
    setPosterText(snapshot.posterText);
    setUpscale(snapshot.upscale);
  };

  const loadFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setNotice('Choose an image file to get started.');
      return;
    }
    const nextImage = URL.createObjectURL(file);
    removalRun.current += 1;
    if (objectUrls.current.image) URL.revokeObjectURL(objectUrls.current.image);
    cutoutUrls.current.forEach((url) => URL.revokeObjectURL(url));
    cutoutUrls.current = [];
    objectUrls.current.image = nextImage;
    objectUrls.current.cutout = '';
    setImage(nextImage);
    setImageName(file.name);
    setSourceBlob(file);
    setCutout('');
    setAlphaMask(null);
    setRemovingBackground(false);
    setRemovalProgress(0);
    setBackgroundOption('transparent');
    const nextLayers = layers.filter((layer) => layer.kind !== 'Cutout').map((layer) => layer.kind === 'Image'
      ? { ...layer, id: 'photo', name: file.name, visible: true, locked: false, opacity: 100 }
      : layer);
    setLayers(nextLayers);
    setSelectedLayer('photo');
    resetHistory({ layers: nextLayers, backgroundOption: 'transparent', cutout: '' });
    setNotice('Your image is ready to edit.');
  };

  const loadBackgroundFile = (file) => {
    if (!file || !file.type.startsWith('image/')) {
      setNotice('Choose an image file to use as your new background.');
      return;
    }
    const nextBackground = URL.createObjectURL(file);
    if (objectUrls.current.background) URL.revokeObjectURL(objectUrls.current.background);
    objectUrls.current.background = nextBackground;
    setBackgroundImage(nextBackground);
    setBackgroundOption('image');
    recordHistory({ backgroundOption: 'image' });
    setNotice('Background image added.');
  };

  const removeBackground = async () => {
    if (removingBackground) return;
    const run = removalRun.current + 1;
    removalRun.current = run;
    setRemovingBackground(true);
    setRemovalProgress(0);
    try {
      const { composeCutout, makeAlphaMask } = await import('./utils/backgroundRemoval.js');
      const inputBlob = sourceBlob || await fetch(image).then((response) => {
        if (!response.ok) throw new Error('Could not read the current image. Upload it from your device and try again.');
        return response.blob();
      });
      const mask = await makeAlphaMask(inputBlob, (progress) => {
        if (run === removalRun.current) setRemovalProgress(progress);
      });
      if (run !== removalRun.current) return;
      const nextCutout = await composeCutout(inputBlob, mask);
      if (run !== removalRun.current) {
        URL.revokeObjectURL(nextCutout);
        return;
      }
      cutoutUrls.current.push(nextCutout);
      objectUrls.current.cutout = nextCutout;
      setSourceBlob(inputBlob);
      setAlphaMask(mask);
      setCutout(nextCutout);
      setBackgroundOption('transparent');
      const nextLayers = layers.some((layer) => layer.kind === 'Cutout')
        ? layers.map((layer) => layer.kind === 'Cutout' ? { ...layer, visible: true } : layer)
        : [{ id: `cutout-${Date.now()}`, name: 'Background removed', kind: 'Cutout', visible: true, locked: false, opacity: 100 }, ...layers];
      setLayers(nextLayers);
      recordHistory({ layers: nextLayers, backgroundOption: 'transparent', cutout: nextCutout });
      setNotice('Background removed on your device.');
    } catch (error) {
      if (run === removalRun.current) setNotice(error instanceof Error ? error.message : 'Background removal failed. Please try another image.');
    } finally {
      if (run === removalRun.current) setRemovingBackground(false);
    }
  };

  const refineMask = (point) => {
    const mask = maskRef.current;
    if (!mask || !originalImageRef.current) return;
    const imageElement = originalImageRef.current;
    const maskData = mask.data.data;
    const centerX = Math.round(point.x * (mask.width - 1));
    const centerY = Math.round(point.y * (mask.height - 1));
    const radius = Math.max(3, Math.round(brushSize * mask.width / imageElement.naturalWidth / 2));
    const minX = Math.max(0, centerX - radius);
    const maxX = Math.min(mask.width - 1, centerX + radius);
    const minY = Math.max(0, centerY - radius);
    const maxY = Math.min(mask.height - 1, centerY + radius);
    for (let y = minY; y <= maxY; y += 1) {
      for (let x = minX; x <= maxX; x += 1) {
        const distance = Math.hypot(x - centerX, y - centerY);
        if (distance <= radius) {
          const coverage = Math.min(1, (radius - distance) / Math.max(1, radius * 0.18));
          const alphaIndex = (y * mask.width + x) * 4 + 3;
          const alpha = Math.round(coverage * 255);
          maskData[alphaIndex] = brushMode === 'restore'
            ? Math.max(maskData[alphaIndex], alpha)
            : Math.min(maskData[alphaIndex], 255 - alpha);
        }
      }
    }
    maskRef.current = mask;
  };

  const finishRefinement = async () => {
    if (!sourceBlob || !maskRef.current) return;
    try {
      const { composeCutout } = await import('./utils/backgroundRemoval.js');
      const nextCutout = await composeCutout(sourceBlob, maskRef.current);
      cutoutUrls.current.push(nextCutout);
      objectUrls.current.cutout = nextCutout;
      setCutout(nextCutout);
      recordHistory({ cutout: nextCutout });
    } catch (error) {
      setNotice(error instanceof Error ? error.message : 'Could not update the refined cutout.');
    }
  };

  const resetCutout = () => {
    setCutout('');
    setBackgroundOption('transparent');
    const nextLayers = layers.filter((layer) => layer.kind !== 'Cutout');
    setLayers(nextLayers);
    recordHistory({ backgroundOption: 'transparent', layers: nextLayers, cutout: '' });
    setNotice('Original image restored.');
  };

  const changePosterText = (value, layerId = 'headline') => {
    const target = layers.find((layer) => layer.id === layerId);
    if (!target || target.locked) return;
    const nextLayers = layers.map((layer) => layer.id === layerId ? { ...layer, content: value, name: value || 'Text layer' } : layer);
    setLayers(nextLayers);
    if (layerId === 'headline') setPosterText(value);
    recordHistory(layerId === 'headline' ? { layers: nextLayers, posterText: value } : { layers: nextLayers });
  };

  const changeBackgroundOption = (option) => {
    setBackgroundOption(option);
    recordHistory({ backgroundOption: option });
  };

  const changeRotation = (nextValue) => {
    const next = typeof nextValue === 'function' ? nextValue(rotation) : nextValue;
    setRotation(next);
    recordHistory({ rotation: next });
  };

  const changeFlip = (value) => {
    setFlipHorizontal(value);
    recordHistory({ flipHorizontal: value });
  };

  const changeImageScale = (value) => {
    const next = Number(value);
    setImageScale(next);
    recordHistory({ imageScale: next });
  };

  const changeRatio = (value) => {
    setRatioPreset(value);
    recordHistory({ ratioPreset: value });
  };

  const changePosterStyle = (style) => {
    const next = { ...posterStyle, ...style };
    setPosterStyle(next);
    recordHistory({ posterStyle: next });
  };

  const applyUpscale = (value) => {
    setUpscale(value);
    recordHistory({ upscale: value });
    setNotice(`Export size set to ${value}×.`);
  };

  const applyCanvasPreset = (name) => {
    const dimensions = {
      'Instagram post': [1080, 1080],
      'Instagram story': [1080, 1920],
      'LinkedIn banner': [1584, 396],
      'YouTube thumbnail': [1280, 720],
      'A4 poster': [2480, 3508],
      '18 × 24 poster': [5400, 7200],
    };
    const nextSize = dimensions[name];
    if (nextSize) setCanvasSize({ width: nextSize[0], height: nextSize[1] });
    if (nextSize) setRatioPreset('Canvas');
    setCanvasPreset(name);
    recordHistory({ canvasSize: nextSize ? { width: nextSize[0], height: nextSize[1] } : canvasSize, canvasPreset: name, ratioPreset: nextSize ? 'Canvas' : ratioPreset });
  };

  const updateCanvasSize = (dimension, value) => {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 64 || parsed > 12000) {
      setNotice('Canvas dimensions must be between 64 and 12,000 pixels.');
      return;
    }
    setCanvasSize((current) => ({ ...current, [dimension]: parsed }));
    setRatioPreset('Canvas');
    setCanvasPreset('Custom size');
    recordHistory({
      canvasSize: { ...canvasSize, [dimension]: parsed },
      canvasPreset: 'Custom size',
      ratioPreset: 'Canvas',
    });
  };

  const addLayer = (kind = 'Text', content = '') => {
    const id = `${kind.toLowerCase()}-${Date.now()}`;
    const nextLayers = [{ id, name: kind === 'Text' ? 'New text layer' : `${content} element`, content: kind === 'Text' ? 'New text' : content, kind, visible: true, locked: false, opacity: 100 }, ...layers];
    setLayers(nextLayers);
    recordHistory({ layers: nextLayers });
    setSelectedLayer(id);
    setNotice(`${kind} layer added.`);
  };

  const toggleLayer = (id, property) => {
    const next = layers.map((layer) => layer.id === id && (property === 'locked' || !layer.locked) ? { ...layer, [property]: !layer[property] } : layer);
    setLayers(next);
    recordHistory({ layers: next });
  };
  const changeOpacity = (id, opacity) => {
    const next = layers.map((layer) => layer.id === id && !layer.locked ? { ...layer, opacity: Number(opacity) } : layer);
    setLayers(next);
    recordHistory({ layers: next });
  };
  const moveLayer = (id, direction) => {
    const next = [...layers];
    const index = next.findIndex((layer) => layer.id === id);
    const target = index + direction;
    if (index < 0 || next[index].locked || target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setLayers(next);
    recordHistory({ layers: next });
  };

  const exportImage = async (format = 'png', scale = 1) => {
    if (format === 'pdf') {
      window.print();
      setExportOpen(false);
      return;
    }
    const source = imageRef.current;
    if (!source?.complete || !source.naturalWidth) {
      setNotice('The image is still loading. Try exporting again in a moment.');
      return;
    }
    const outputScale = scale * upscale;
    const width = Math.round((ratioPreset === 'Original' ? source.naturalWidth : canvasSize.width) * outputScale);
    const height = Math.round((ratioPreset === 'Original' ? source.naturalHeight : canvasSize.height) * outputScale);
    if (width > 16384 || height > 16384 || width * height > 100_000_000) {
      setNotice('That export size is too large for this browser. Choose a smaller canvas or export scale.');
      return;
    }
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    if (!context) {
      setNotice('Your browser could not prepare the export.');
      return;
    }
    try {
      if (format === 'jpg' || format === 'jpeg') {
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, width, height);
      }
      if (backgroundOption === 'sage' || backgroundOption === 'sand' || backgroundOption === 'lavender' || backgroundOption === 'coral') {
        context.fillStyle = { sage: '#d1e7dd', sand: '#fff3cd', lavender: '#e2d9f3', coral: '#fde2e4' }[backgroundOption];
        context.fillRect(0, 0, width, height);
      } else if (backgroundOption === 'image' && backgroundImage) {
        const backgroundBitmap = await createImageBitmap(await fetch(backgroundImage).then((response) => response.blob()));
        context.drawImage(backgroundBitmap, 0, 0, width, height);
        backgroundBitmap.close();
      } else if (backgroundOption === 'blur') {
        const original = originalImageRef.current;
        if (original?.complete && original.naturalWidth) {
          context.filter = 'blur(24px)';
          context.drawImage(original, -24, -24, width + 48, height + 48);
          context.filter = 'none';
        }
      }

      const sourceAspect = source.naturalWidth / source.naturalHeight;
      const frameAspect = width / height;
      const drawWidth = frameAspect > sourceAspect ? width : height * sourceAspect;
      const drawHeight = frameAspect > sourceAspect ? width / sourceAspect : height;
      context.save();
      context.translate(width / 2, height / 2);
      context.rotate((rotation * Math.PI) / 180);
      context.scale((flipHorizontal ? -1 : 1) * imageScale / 100, imageScale / 100);
      context.filter = showAdjustments ? filterStyle.filter : 'none';
      context.globalAlpha = (imageLayer?.opacity ?? 100) / 100;
      if (visibleLayers) context.drawImage(source, -drawWidth / 2, -drawHeight / 2, drawWidth, drawHeight);
      context.restore();
      context.filter = 'none';
      context.globalAlpha = 1;

      if (showAdjustments && adjustments.vignette > 0) {
        const vignette = context.createRadialGradient(width / 2, height / 2, Math.min(width, height) * 0.18, width / 2, height / 2, Math.max(width, height) * 0.72);
        vignette.addColorStop(0, 'transparent');
        vignette.addColorStop(1, `rgba(12, 16, 13, ${adjustments.vignette / 210})`);
        context.fillStyle = vignette;
        context.fillRect(0, 0, width, height);
      }

      if (tool === 'poster') {
        const heading = layers.find((layer) => layer.kind === 'Text' && layer.visible);
        if (heading) {
          const previewWidth = imageRef.current.closest('.artboard')?.clientWidth || width;
          context.globalAlpha = heading.opacity / 100;
          context.fillStyle = posterStyle.color;
          context.textAlign = 'center';
          context.textBaseline = 'middle';
          context.font = `700 ${posterStyle.size * width / previewWidth}px ${posterStyle.font}, sans-serif`;
          context.fillText(heading.content || posterText, width / 2, height * 0.82, width * 0.85);
          context.globalAlpha = 1;
        }
        layers.filter((layer) => layer.kind === 'Graphic' && layer.visible).forEach((layer, index) => {
          context.globalAlpha = layer.opacity / 100;
          context.fillStyle = '#ffffff';
          context.beginPath();
          const x = width * (0.25 + (index % 4) * 0.16);
          const y = height * 0.2;
          const size = Math.min(width, height) * 0.035;
          if (layer.content === 'Circle') context.arc(x, y, size, 0, Math.PI * 2);
          else if (layer.content === 'Line') context.fillRect(x - size, y, size * 2, Math.max(2, size * 0.08));
          else context.rect(x - size, y - size, size * 2, size * 2);
          context.fill();
        });
        context.globalAlpha = 1;
      }
      const mime = format === 'jpg' ? 'image/jpeg' : `image/${format}`;
      const link = document.createElement('a');
      link.download = `bu-studio-edit-${outputScale}x.${format}`;
      link.href = canvas.toDataURL(mime, 0.94);
      link.click();
      setExportOpen(false);
      setNotice(`Image exported as ${format.toUpperCase()}.`);
    } catch (error) {
      setNotice(error instanceof Error ? `Export failed: ${error.message}` : 'Export failed. Try another image or a smaller size.');
    }
  };

  const activeLayer = layers.find((layer) => layer.id === selectedLayer);
  const imageLayer = layers.find((layer) => layer.kind === 'Image');
  const cutoutLayer = layers.find((layer) => layer.kind === 'Cutout');
  const visibleLayers = Boolean(cutout ? cutoutLayer?.visible : imageLayer?.visible);
  const showAdjustments = layers.some((layer) => layer.kind === 'Adjustment' && layer.visible);
  const ratioValue = ratioPreset === 'Original'
    ? (imageRef.current?.naturalWidth || 1) / (imageRef.current?.naturalHeight || 1)
    : ratioPreset === '1:1' ? 1 : ratioPreset === '4:5' ? 4 / 5 : ratioPreset === '16:9' ? 16 / 9 : ratioPreset === '9:16' ? 9 / 16 : canvasSize.width / canvasSize.height;
  const textLayers = layers.filter((layer) => layer.kind === 'Text' && layer.visible);
  const graphicLayers = layers.filter((layer) => layer.kind === 'Graphic' && layer.visible);

  return (
    <div className={`studio ${darkMode ? 'theme-dark' : ''}`}>
      <Header
        darkMode={darkMode}
        onThemeToggle={() => setDarkMode((current) => !current)}
        onUndo={() => stepHistory(-1)}
        onRedo={() => stepHistory(1)}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onExport={() => setExportOpen((current) => !current)}
        exportOpen={exportOpen}
        onExportFormat={exportImage}
        projectName={imageName.replace(/\.[^/.]+$/, '')}
      />
      <div className="workspace">
        <Sidebar activeTool={tool} onSelect={setTool} onUpload={() => fileInput.current?.click()} />
        <main className="editor">
          <div className="editor-toolbar">
            <div className="breadcrumb"><span>My projects</span><ChevronRight size={14} /><strong>{imageName.replace(/\.[^/.]+$/, '')}</strong><span className="saved-badge"><span /> All changes saved</span></div>
            <div className="toolbar-actions">
              <button className={`icon-button compare-toggle ${beforeAfter ? 'active' : ''}`} onClick={() => setBeforeAfter((current) => !current)} title="Toggle before and after comparison"><Blend size={16} /><span>Compare</span></button>
              <span className="toolbar-divider" />
              <button className="icon-button" onClick={() => setZoom((current) => Math.max(50, current - 10))} title="Zoom out"><Minus size={16} /></button>
              <button className="zoom-value" onClick={() => setZoom(100)}>{zoom}%</button>
              <button className="icon-button" onClick={() => setZoom((current) => Math.min(150, current + 10))} title="Zoom in"><Plus size={16} /></button>
              <button className="icon-button fit-button" onClick={() => setZoom(100)} title="Fit to screen"><Maximize2 size={15} /></button>
            </div>
          </div>
          <CanvasArea
            image={image}
            cutout={cutout}
            imageName={imageName}
            imageRef={imageRef}
            originalImageRef={originalImageRef}
            removingBackground={removingBackground}
            imageVisible={visibleLayers}
            imageOpacity={cutout ? cutoutLayer?.opacity ?? 100 : imageLayer?.opacity ?? 100}
            vignette={showAdjustments ? adjustments.vignette : 0}
            imageStyle={showAdjustments ? filterStyle : {}}
            beforeAfter={beforeAfter}
            comparison={comparison}
            setComparison={setComparison}
            zoom={zoom}
            tool={tool}
            posterText={posterText}
            posterStyle={posterStyle}
            textLayers={textLayers}
            graphicLayers={graphicLayers}
            onTextChange={changePosterText}
            onUpload={loadFile}
            fileInput={fileInput}
            onNotice={setNotice}
            backgroundOption={backgroundOption}
            backgroundImage={backgroundImage}
            aspectRatio={ratioValue}
            fitMode={ratioPreset === 'Original' ? 'contain' : 'cover'}
            rotation={rotation}
            flipHorizontal={flipHorizontal}
            imageScale={imageScale}
            brushMode={brushMode}
            brushSize={brushSize}
            onRefine={refineMask}
            onFinishRefinement={finishRefinement}
          />
          <div className="editor-footer">
            <div className="canvas-meta"><span><Frame size={14} /> {canvasSize.width} × {canvasSize.height} px</span><span className="meta-dot" /><span>RGB · 8 bit</span></div>
            <button className="shortcut-hint" onClick={() => setNotice('Tip: drag an image onto the canvas to upload it.')}><CircleHelp size={14} /> Quick tips</button>
          </div>
        </main>
        <aside className="inspector">
          <div className="inspector-top"><div><p className="eyebrow">YOUR WORKSPACE</p><h1>{toolNames[tool]}</h1></div><button className="icon-button" title="More options"><MoreHorizontal size={19} /></button></div>
          <div className="inspector-scroll">
            <ToolPanels
              tool={tool}
              adjustments={adjustments}
              updateAdjustment={updateAdjustment}
              preset={preset}
              applyPreset={applyPreset}
              onUpload={() => fileInput.current?.click()}
              cutout={cutout}
              removingBackground={removingBackground}
              removalProgress={removalProgress}
              onRemoveBackground={removeBackground}
              onResetCutout={resetCutout}
              backgroundOption={backgroundOption}
              onBackgroundChange={changeBackgroundOption}
              onBackgroundUpload={() => backgroundInput.current?.click()}
              brushSize={brushSize}
              onBrushSizeChange={setBrushSize}
              brushMode={brushMode}
              onBrushModeChange={setBrushMode}
              upscale={upscale}
              onApplyUpscale={applyUpscale}
              posterText={posterText}
              onTextChange={changePosterText}
              onAddText={() => addLayer('Text')}
              onAddGraphic={(shape) => addLayer('Graphic', shape)}
              canvasPreset={canvasPreset}
              onCanvasPreset={applyCanvasPreset}
              canvasSize={canvasSize}
              onCanvasSizeChange={updateCanvasSize}
              posterStyle={posterStyle}
              onPosterStyleChange={changePosterStyle}
              ratioPreset={ratioPreset}
              onRatioChange={changeRatio}
              rotation={rotation}
              onRotate={changeRotation}
              flipHorizontal={flipHorizontal}
              onFlip={changeFlip}
              imageScale={imageScale}
              onImageScale={changeImageScale}
              onNotice={setNotice}
            />
            <LayerPanel
              layers={layers}
              selectedLayer={selectedLayer}
              onSelect={setSelectedLayer}
              onToggle={toggleLayer}
              onOpacityChange={changeOpacity}
              onMove={moveLayer}
              onAddLayer={addLayer}
              activeLayer={activeLayer}
            />
          </div>
          <button className="help-card" onClick={() => setNotice('BU Studio help center is coming soon.')}>
            <div className="help-icon"><Sparkles size={16} /></div><div><strong>Need a little inspiration?</strong><span>Explore editing tips & tutorials</span></div><ArrowUpRight size={15} />
          </button>
        </aside>
      </div>
      <input ref={fileInput} className="hidden-input" type="file" accept="image/*" onChange={(event) => { loadFile(event.target.files?.[0]); event.target.value = ''; }} />
      <input ref={backgroundInput} className="hidden-input" type="file" accept="image/*" onChange={(event) => { loadBackgroundFile(event.target.files?.[0]); event.target.value = ''; }} />
      {notice && <div className="toast"><Check size={15} />{notice}<button onClick={() => setNotice('')} aria-label="Dismiss"><X size={14} /></button></div>}
    </div>
  );
}

export default App;
