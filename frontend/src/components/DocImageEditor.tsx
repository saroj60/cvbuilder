import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import { RotateCcw, RotateCw, Crop, X, Check, RefreshCw, ZoomIn, ZoomOut } from 'lucide-react';

interface DocImageEditorProps {
  imageBase64: string;
  editedBase64?: string;
  label: string;
  onApply: (edited: string) => void;
  onClose: () => void;
}

interface CropRect { x: number; y: number; w: number; h: number; }

export function DocImageEditor({ imageBase64, editedBase64, label, onApply, onClose }: DocImageEditorProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [rotation, setRotation] = useState(0);
  const [padTop, setPadTop] = useState(0);
  const [padRight, setPadRight] = useState(0);
  const [padBottom, setPadBottom] = useState(0);
  const [padLeft, setPadLeft] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [cropMode, setCropMode] = useState(false);
  const [cropRect, setCropRect] = useState<CropRect | null>(null);
  const [appliedCrop, setAppliedCrop] = useState<CropRect | null>(null);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [displayScale, setDisplayScale] = useState(1);

  const draw = useCallback((
    _rotation = rotation, _padTop = padTop, _padRight = padRight, _padBottom = padBottom,
    _padLeft = padLeft, _zoom = zoom, _cropRect = cropRect, _appliedCrop = appliedCrop, _cropMode = cropMode
  ) => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const container = containerRef.current;
    const maxW = container ? container.clientWidth - 16 : 600;
    const maxH = 380;

    const rad = (_rotation * Math.PI) / 180;
    const cosA = Math.abs(Math.cos(rad));
    const sinA = Math.abs(Math.sin(rad));
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const rotW = srcW * cosA + srcH * sinA;
    const rotH = srcW * sinA + srcH * cosA;

    const fullW = (rotW + _padLeft + _padRight) * _zoom;
    const fullH = (rotH + _padTop + _padBottom) * _zoom;

    const finalUnscaledW = _appliedCrop ? _appliedCrop.w : fullW;
    const finalUnscaledH = _appliedCrop ? _appliedCrop.h : fullH;

    const scaleX = maxW / Math.max(finalUnscaledW, 1);
    const scaleY = maxH / Math.max(finalUnscaledH, 1);
    const scale = Math.min(scaleX, scaleY, 1);
    setDisplayScale(scale);

    canvas.width = Math.max(1, Math.round(finalUnscaledW * scale));
    canvas.height = Math.max(1, Math.round(finalUnscaledH * scale));

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.save();
    ctx.scale(scale, scale);
    
    if (_appliedCrop) {
      ctx.translate(-_appliedCrop.x, -_appliedCrop.y);
    }
    
    ctx.translate((_padLeft + rotW / 2) * _zoom, (_padTop + rotH / 2) * _zoom);
    ctx.rotate(rad);
    ctx.drawImage(img, (-srcW / 2) * _zoom, (-srcH / 2) * _zoom, srcW * _zoom, srcH * _zoom);
    ctx.restore();

    if (_cropMode && _cropRect) {
      ctx.save();
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, 0, canvas.width, _cropRect.y);
      ctx.fillRect(0, _cropRect.y, _cropRect.x, _cropRect.h);
      ctx.fillRect(_cropRect.x + _cropRect.w, _cropRect.y, canvas.width - (_cropRect.x + _cropRect.w), _cropRect.h);
      ctx.fillRect(0, _cropRect.y + _cropRect.h, canvas.width, canvas.height - (_cropRect.y + _cropRect.h));
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 3]);
      ctx.strokeRect(_cropRect.x, _cropRect.y, _cropRect.w, _cropRect.h);
      const hs = 8;
      ctx.setLineDash([]);
      const corners = [[_cropRect.x, _cropRect.y],[_cropRect.x + _cropRect.w - hs, _cropRect.y],[_cropRect.x, _cropRect.y + _cropRect.h - hs],[_cropRect.x + _cropRect.w - hs, _cropRect.y + _cropRect.h - hs]];
      for (const [cx, cy] of corners) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(cx, cy, hs, hs);
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(cx, cy, hs, hs);
      }
      ctx.restore();
    }
  }, [rotation, padTop, padRight, padBottom, padLeft, zoom, cropRect, appliedCrop, cropMode]);

  useEffect(() => {
    const img = new Image();
    img.onload = () => { imgRef.current = img; draw(); };
    img.src = editedBase64 || imageBase64;
  }, []);

  useEffect(() => { draw(); }, [rotation, padTop, padRight, padBottom, padLeft, zoom, cropRect, appliedCrop, cropMode]);

  const getCanvasPos = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!cropMode) return;
    const pos = getCanvasPos(e);
    setDragStart(pos); setDragging(true);
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 });
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!dragging || !dragStart || !cropMode) return;
    const pos = getCanvasPos(e);
    setCropRect({ x: Math.min(pos.x, dragStart.x), y: Math.min(pos.y, dragStart.y), w: Math.abs(pos.x - dragStart.x), h: Math.abs(pos.y - dragStart.y) });
  };
  const onMouseUp = () => setDragging(false);

  const applyCrop = () => {
    if (!cropRect || cropRect.w < 10 || cropRect.h < 10) return;
    setAppliedCrop({
      x: cropRect.x / displayScale,
      y: cropRect.y / displayScale,
      w: cropRect.w / displayScale,
      h: cropRect.h / displayScale
    });
    setCropRect(null); setCropMode(false);
  };
  const resetCrop = () => { setAppliedCrop(null); setCropRect(null); };

  const rotate = (deg: number) => setRotation(prev => {
    let next = prev + deg;
    if (next > 180) next -= 360;
    if (next < -180) next += 360;
    return next;
  });

  const resetAll = () => {
    setRotation(0); setPadTop(0); setPadRight(0); setPadBottom(0); setPadLeft(0);
    setZoom(1); setAppliedCrop(null); setCropRect(null); setCropMode(false);
    const img = new Image();
    img.onload = () => { imgRef.current = img; draw(); };
    img.src = imageBase64;
  };

  const handleApply = () => {
    const img = imgRef.current;
    if (!img) return;
    const rad = (rotation * Math.PI) / 180;
    const cosA = Math.abs(Math.cos(rad)); const sinA = Math.abs(Math.sin(rad));
    const srcW = img.naturalWidth;
    const srcH = img.naturalHeight;
    const rotW = srcW * cosA + srcH * sinA; const rotH = srcW * sinA + srcH * cosA;
    const fullW = (rotW + padLeft + padRight) * zoom; 
    const fullH = (rotH + padTop + padBottom) * zoom;
    const finalW = appliedCrop ? appliedCrop.w : fullW;
    const finalH = appliedCrop ? appliedCrop.h : fullH;
    
    const offscreen = document.createElement('canvas');
    offscreen.width = Math.max(1, Math.round(finalW)); 
    offscreen.height = Math.max(1, Math.round(finalH));
    const ctx = offscreen.getContext('2d')!;
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, offscreen.width, offscreen.height);
    
    ctx.save(); 
    if (appliedCrop) {
      ctx.translate(-appliedCrop.x, -appliedCrop.y);
    }
    ctx.translate((padLeft + rotW / 2) * zoom, (padTop + rotH / 2) * zoom); 
    ctx.rotate(rad);
    ctx.drawImage(img, (-srcW / 2) * zoom, (-srcH / 2) * zoom, srcW * zoom, srcH * zoom);
    ctx.restore();
    
    onApply(offscreen.toDataURL('image/jpeg', 0.92));
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-card border rounded-2xl shadow-2xl w-full max-w-3xl max-h-[95vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/40 shrink-0">
          <div>
            <h2 className="font-bold text-sm">Edit Document Image</h2>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-8 w-8 p-0"><X className="h-4 w-4" /></Button>
        </div>

        <div ref={containerRef} className="flex-1 flex items-center justify-center overflow-auto p-4 min-h-0" style={{ background: '#1a1a2e', minHeight: 180 }}>
          <canvas ref={canvasRef}
            className={`rounded shadow-lg ${cropMode ? 'cursor-crosshair' : 'cursor-default'}`}
            onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={onMouseUp} onMouseLeave={onMouseUp}
          />
        </div>

        <div className="shrink-0 border-t bg-card px-5 py-4 space-y-4 overflow-y-auto" style={{ maxHeight: '46vh' }}>
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wide flex items-center gap-1">
                <Crop className="h-3 w-3" /> Crop
              </label>
              <div className="flex flex-wrap gap-1.5">
                <Button size="sm" variant={cropMode ? 'primary' : 'outline'} className="h-8 text-xs px-3"
                  onClick={() => { setCropMode(v => !v); setCropRect(null); }}>
                  {cropMode ? 'Drawing…' : 'Select Area'}
                </Button>
                {cropMode && cropRect && cropRect.w > 10 && (
                  <Button size="sm" className="h-8 text-xs px-2 bg-emerald-600 hover:bg-emerald-700 text-white" onClick={applyCrop}>
                    <Check className="h-3 w-3 mr-1" /> Apply
                  </Button>
                )}
                {appliedCrop && (
                  <Button size="sm" variant="outline" className="h-8 text-xs px-2 text-destructive border-destructive/40" onClick={resetCrop}>
                    Reset Crop
                  </Button>
                )}
              </div>
              {cropMode && <p className="text-[10px] text-blue-500">Drag on the image to select crop area.</p>}
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wide flex items-center gap-1">
                <RotateCw className="h-3 w-3" /> Rotate ({rotation}deg)
              </label>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => rotate(-90)}><RotateCcw className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => rotate(90)}><RotateCw className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setRotation(0)}>Reset</Button>
              </div>
              <input type="range" min={-180} max={180} value={rotation}
                onChange={(e) => setRotation(Number(e.target.value))}
                className="w-full h-1.5 accent-primary cursor-pointer" />
              <div className="flex justify-between text-[9px] text-muted-foreground"><span>-180</span><span>0</span><span>+180</span></div>
            </div>

            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wide flex items-center gap-1">
                <ZoomIn className="h-3 w-3" /> Scale ({Math.round(zoom * 100)}%)
              </label>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setZoom(v => Math.max(0.2, +(v - 0.1).toFixed(1)))}><ZoomOut className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" className="h-8 w-8 p-0" onClick={() => setZoom(v => Math.min(3, +(v + 0.1).toFixed(1)))}><ZoomIn className="h-3.5 w-3.5" /></Button>
                <Button size="sm" variant="outline" className="h-8 px-2 text-xs" onClick={() => setZoom(1)}>100%</Button>
              </div>
              <input type="range" min={20} max={300} value={Math.round(zoom * 100)}
                onChange={(e) => setZoom(Number(e.target.value) / 100)}
                className="w-full h-1.5 accent-primary cursor-pointer" />
              <div className="flex justify-between text-[9px] text-muted-foreground"><span>20%</span><span>100%</span><span>300%</span></div>
            </div>
          </div>

          <div className="space-y-2 pt-1 border-t">
            <label className="text-[11px] font-bold uppercase text-muted-foreground tracking-wide">White Spacing / Padding (px)</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {([
                { label: 'Top', val: padTop, set: setPadTop },
                { label: 'Right', val: padRight, set: setPadRight },
                { label: 'Bottom', val: padBottom, set: setPadBottom },
                { label: 'Left', val: padLeft, set: setPadLeft },
              ] as { label: string; val: number; set: (v: number) => void }[]).map(({ label: l, val, set }) => (
                <div key={l} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-muted-foreground">{l}</span>
                    <span className="text-[10px] font-bold text-primary">{val}px</span>
                  </div>
                  <input type="range" min={0} max={200} value={val}
                    onChange={(e) => set(Number(e.target.value))}
                    className="w-full h-1.5 accent-primary cursor-pointer" />
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between border-t pt-3">
            <Button variant="outline" size="sm" onClick={resetAll} className="gap-1.5 text-xs h-9">
              <RefreshCw className="h-3.5 w-3.5" /> Reset All
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onClose} className="h-9 text-xs">Cancel</Button>
              <Button size="sm" onClick={handleApply} className="h-9 text-xs gap-1.5 px-5">
                <Check className="h-3.5 w-3.5" /> Apply Changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}