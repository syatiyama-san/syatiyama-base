(() => {
  const previewViewport = document.getElementById('previewViewport');
  const dropArea = document.getElementById('dropArea');
  const dropTitle = document.getElementById('dropTitle');
  const previewCanvas = document.getElementById('previewCanvas');
  const noImage = document.getElementById('noImage');
  const gifFileSlot = document.getElementById('gifFileSlot');
  const gifFilesInput = document.getElementById('gifFilesInput');
  const layerList = document.getElementById('layerList');
  const gifLimit = document.getElementById('gifLimit');
  const effectAssetSelect = document.getElementById('effectAssetSelect');
  const addEffectAssetBtn = document.getElementById('addEffectAssetBtn');
  const effectFileSlot = document.getElementById('effectFileSlot');
  const effectGifInput = document.getElementById('effectGifInput');
  const removeEffectBtn = document.getElementById('removeEffectBtn');
  const gifPanel = document.getElementById('gifPanel');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const exportFormat = document.getElementById('exportFormat');
  const scrollTopBtn = document.getElementById('scrollTopBtn');
  const sidebar = document.querySelector('.sidebar');

  const gifOptions = document.getElementById('gifOptions');

  const gifDelayInput = document.getElementById('gifDelay');
  const gifDelayValue = document.getElementById('gifDelayValue');
  const gifLoopInput = document.getElementById('gifLoop');
  const qualityInput = document.getElementById('qualityLevel');
  const sizeWidthInput = document.getElementById('sizeWidth');
  const sizeHeightInput = document.getElementById('sizeHeight');

  const state = {
    layers: [],
    previewRunning: false,
    previewStart: 0,
    previewFrame: null,
    previewRenderCanvas: null,
    maxLayers: 100
  };

  let webpAnimModulePromise = null;
  let gifuctLibPromise = null;

  function getWebpAnimModule() {
    if (!webpAnimModulePromise) {
      if (typeof WebPAnimModule !== 'function') {
        return Promise.reject(new Error('WebPAnimModule not loaded'));
      }
      webpAnimModulePromise = WebPAnimModule({
        locateFile: (path) => `../libs/${path}`
      });
    }
    return webpAnimModulePromise;
  }

  function normalizeGifuct(lib) {
    if (!lib) return null;
    if (lib.parseGIF && lib.decompressFrames) return lib;
    if (typeof lib === 'function' && lib.prototype && lib.prototype.decompressFrames) {
      return {
        parseGIF: (buffer) => new lib(buffer),
        decompressFrames: (gif, buildImagePatches) => gif.decompressFrames(buildImagePatches)
      };
    }
    if (lib.GIF && typeof lib.GIF === 'function' && lib.GIF.prototype && lib.GIF.prototype.decompressFrames) {
      return {
        parseGIF: (buffer) => new lib.GIF(buffer),
        decompressFrames: (gif, buildImagePatches) => gif.decompressFrames(buildImagePatches)
      };
    }
    return null;
  }

  function loadGifuct() {
    const local = normalizeGifuct(window.gifuct || window.GIF);
    if (local) return Promise.resolve(local);
    if (gifuctLibPromise) return gifuctLibPromise;
    gifuctLibPromise = new Promise((resolve, reject) => {
      const loadFrom = (src, fallback) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => {
          const normalized = normalizeGifuct(window.gifuct || window.GIF);
          if (normalized) resolve(normalized);
          else reject(new Error('gifuct not available'));
        };
        script.onerror = () => {
          if (fallback) fallback();
          else reject(new Error('gifuct load failed'));
        };
        document.head.appendChild(script);
      };
      loadFrom('../libs/gifuct.min.js', () => {
        loadFrom('https://unpkg.com/gifuct-js/dist/gifuct.min.js');
      });
    });
    return gifuctLibPromise;
  }

  const bindDropTarget = (target, highlightTarget, onDrop) => {
    ['dragenter','dragover'].forEach(ev => {
      target.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        highlightTarget.classList.add('dragover');
      }, false);
    });
    ['dragleave','drop'].forEach(ev => {
      target.addEventListener(ev, e => {
        e.preventDefault();
        e.stopPropagation();
        highlightTarget.classList.remove('dragover');
      }, false);
    });
    target.addEventListener('drop', e => {
      e.stopPropagation();
      const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
      if (files.length) onDrop(files);
    });
  };

  bindDropTarget(dropArea, previewViewport, addGifFiles);
  bindDropTarget(previewViewport, previewViewport, addGifFiles);
  bindDropTarget(gifFileSlot, gifFileSlot, addGifFiles);
  bindDropTarget(effectFileSlot, effectFileSlot, (files) => {
    if (files[0]) addEffectFile(files[0]);
  });

  dropArea.addEventListener('click', () => {
    gifFilesInput.click();
  });
  gifFileSlot.addEventListener('click', () => gifFilesInput.click());
  gifFilesInput.addEventListener('change', () => {
    if (gifFilesInput.files && gifFilesInput.files.length) {
      addGifFiles(Array.from(gifFilesInput.files));
      gifFilesInput.value = '';
    }
  });

  effectFileSlot.addEventListener('click', () => effectGifInput.click());
  effectGifInput.addEventListener('change', () => {
    if (effectGifInput.files && effectGifInput.files[0]) addEffectFile(effectGifInput.files[0]);
    effectGifInput.value = '';
  });

  addEffectAssetBtn.addEventListener('click', () => {
    const name = effectAssetSelect.value;
    if (!name) return;
    addEffectFromAsset(name);
  });

  removeEffectBtn.addEventListener('click', () => {
    removeEffectLayers();
  });

  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    progress('処理開始...');
    try {
      const fmt = exportFormat ? exportFormat.value : 'gif';
      if (fmt === 'apng') {
        await doApngExport();
      } else if (fmt === 'webp') {
        await doWebpExport();
      } else {
        await doGifExport();
      }
    } catch (err) {
      console.error(err);
      alert('処理中にエラーが発生しました');
    } finally {
      exportBtn.disabled = false;
      progress('待機中');
    }
  });

  clearBtn.addEventListener('click', () => {
    clearGifLayers();
    updateModeUI();
  });

  gifDelayInput.addEventListener('input', () => {
    gifDelayValue.textContent = gifDelayInput.value;
    renderPreviewFrame(performance.now());
  });

  const onSizeInput = () => {
    renderPreviewFrame(performance.now());
  };
  if (sizeWidthInput) sizeWidthInput.addEventListener('input', onSizeInput);
  if (sizeHeightInput) sizeHeightInput.addEventListener('input', onSizeInput);

  scrollTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if (layerList) layerList.scrollTo({ top: 0, behavior: 'smooth' });
    if (sidebar) sidebar.scrollTo({ top: 0, behavior: 'smooth' });
  });

  async function addGifFiles(files) {
    const available = state.maxLayers - state.layers.length;
    if (available <= 0) {
      alert('100枚まで追加できます');
      return;
    }
    const targets = files.filter(f => f.type.startsWith('image/')).slice(0, available);
    if (!targets.length) return;
    progress('画像を読み込み中...');
    let remaining = available;
    for (const file of targets) {
      const layers = await createLayersFromFile(file);
      if (!layers.length) continue;
      const toAdd = layers.slice(0, remaining);
      state.layers.push(...toAdd);
      remaining = state.maxLayers - state.layers.length;
      if (remaining <= 0) break;
    }
    progress('画像読み込み完了');
    renderLayerList();
    updateModeUI();
  }

  async function createLayersFromFile(file) {
    if (!file.type.startsWith('image/')) return null;
    const lower = file.name.toLowerCase();
    if (file.type === 'image/gif' || lower.endsWith('.gif')) {
      let gifuctLib;
      try {
        gifuctLib = await loadGifuct();
      } catch (err) {
        alert('GIFの分解ライブラリが読み込めませんでした。libsにgifuct.min.jsを置くか、ネット接続を確認してください');
        return [];
      }
      const buffer = await file.arrayBuffer();
      const frames = createGifFramesFromBuffer(buffer, gifuctLib);
      return createImageLayersFromFrames(file.name, frames, false);
    }

    if (file.type === 'image/png' || lower.endsWith('.png') || file.type === 'image/webp' || lower.endsWith('.webp')) {
      const frames = await tryDecodeAnimatedFrames(file);
      if (frames && frames.length) {
        return createImageLayersFromFrames(file.name, frames, true);
      }
      if (!('ImageDecoder' in window)) {
        alert('APNG/WebPの分解はこのブラウザに対応していません。静止画像として追加します。');
      }
    }

    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    return [{
      id: crypto.randomUUID(),
      name: file.name,
      kind: 'image',
      img,
      width: img.width,
      height: img.height,
      thumbUrl: url,
      revoke: () => URL.revokeObjectURL(url)
    }];
  }

  function createGifFramesFromBuffer(buffer, gifuctLib) {
    const gif = gifuctLib.parseGIF(buffer);
    const frames = gifuctLib.decompressFrames(gif, true);
    return frames.map(frame => {
      const c = document.createElement('canvas');
      c.width = frame.dims.width;
      c.height = frame.dims.height;
      const ctx = c.getContext('2d');
      const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
      imageData.data.set(frame.patch);
      ctx.putImageData(imageData, 0, 0);
      const delay = Math.max(20, (frame.delay || 8) * 10);
      return { canvas: c, delay, width: frame.dims.width, height: frame.dims.height };
    });
  }

  function normalizeDurationMs(rawDuration) {
    if (!rawDuration) return 0;
    if (rawDuration < 1) return Math.round(rawDuration * 1000);
    if (rawDuration < 1000) return Math.round(rawDuration);
    if (rawDuration < 1000000) return Math.round(rawDuration / 1000);
    return Math.round(rawDuration / 1000000);
  }

  async function getWebpDurationsFromDemux(buffer, expectedCount) {
    let mod;
    try {
      mod = await getWebpAnimModule();
    } catch (err) {
      return null;
    }
    const bytes = new Uint8Array(buffer);
    if (!bytes.length) return null;
    const getCount = mod.cwrap('aw_webp_get_frame_count', 'number', ['number','number']);
    const getDurations = mod.cwrap('aw_webp_get_frame_durations', 'number', ['number','number','number','number']);
    let inPtr = 0;
    let outPtr = 0;
    try {
      inPtr = mod._malloc(bytes.length);
      mod.HEAPU8.set(bytes, inPtr);
      const count = getCount(inPtr, bytes.length);
      const outCount = count;
      if (!outCount) return null;
      outPtr = mod._malloc(outCount * 4);
      const got = getDurations(inPtr, bytes.length, outPtr, outCount);
      const safeCount = Math.max(0, Math.min(got, outCount));
      const result = new Int32Array(mod.HEAP32.buffer, outPtr, safeCount);
      const durations = Array.from(result).map(v => Math.max(20, v || 0));
      if (expectedCount && durations.length > expectedCount) {
        return durations.slice(0, expectedCount);
      }
      return durations.length ? durations : null;
    } catch (err) {
      console.warn('webp demux failed', err);
      return null;
    } finally {
      if (outPtr) mod._free(outPtr);
      if (inPtr) mod._free(inPtr);
    }
  }

  async function getWebpFrameCountFromDemux(buffer) {
    let mod;
    try {
      mod = await getWebpAnimModule();
    } catch (err) {
      return 0;
    }
    const bytes = new Uint8Array(buffer);
    if (!bytes.length) return 0;
    const getCount = mod.cwrap('aw_webp_get_frame_count', 'number', ['number','number']);
    let inPtr = 0;
    try {
      inPtr = mod._malloc(bytes.length);
      mod.HEAPU8.set(bytes, inPtr);
      return getCount(inPtr, bytes.length) || 0;
    } catch (err) {
      console.warn('webp demux count failed', err);
      return 0;
    } finally {
      if (inPtr) mod._free(inPtr);
    }
  }

  async function tryDecodeAnimatedFrames(file) {
    if (!('ImageDecoder' in window)) return null;
    const buffer = await file.arrayBuffer();
    const demuxCount = file.type === 'image/webp' ? await getWebpFrameCountFromDemux(buffer) : 0;
    let decoder;
    try {
      decoder = new ImageDecoder({ data: buffer, type: file.type });
    } catch (err) {
      return null;
    }
    await decoder.tracks.ready;
    const track = decoder.tracks.selectedTrack;
    let count = track ? track.frameCount : 0;
    if (file.type === 'image/webp' && demuxCount) {
      count = Math.max(count, demuxCount);
    }
    if (!count || count <= 1) {
      decoder.close();
      return null;
    }
    const frames = [];
    for (let i = 0; i < count; i++) {
      let result;
      try {
        result = await decoder.decode({ frameIndex: i });
      } catch (err) {
        if (file.type === 'image/webp') {
          console.warn('webp decode failed', { index: i, error: err });
          break;
        }
        throw err;
      }
      const image = result.image;
      const c = document.createElement('canvas');
      c.width = image.displayWidth || image.codedWidth;
      c.height = image.displayHeight || image.codedHeight;
      const ctx = c.getContext('2d');
      ctx.drawImage(image, 0, 0);
      image.close();
      const rawDuration = result.duration || 0;
      const durationMs = normalizeDurationMs(rawDuration);
      frames.push({
        canvas: c,
        delay: durationMs ? Math.max(20, durationMs) : 0,
        width: c.width,
        height: c.height
      });
    }
    if (file.type === 'image/webp') {
      const nonZero = frames.map(f => f.delay).filter(v => v > 0);
      if (nonZero.length && nonZero.length < frames.length) {
        const avg = Math.round(nonZero.reduce((sum, v) => sum + v, 0) / nonZero.length);
        frames.forEach(frame => {
          if (!frame.delay) frame.delay = Math.max(20, avg);
        });
      } else if (!nonZero.length) {
        const demuxDurations = await getWebpDurationsFromDemux(buffer, frames.length);
        if (demuxDurations && demuxDurations.length) {
          frames.forEach((frame, index) => {
            const d = demuxDurations[index] || demuxDurations[demuxDurations.length - 1];
            frame.delay = Math.max(20, d || 0);
          });
        } else {
          const trackDuration = normalizeDurationMs(track?.repetitionDuration || 0);
          const fallbackDelay = Math.max(20, parseInt(gifDelayInput.value,10) || 42);
          const perFrame = trackDuration ? Math.max(20, Math.round(trackDuration / count)) : fallbackDelay;
          frames.forEach(frame => {
            frame.delay = perFrame;
          });
        }
      }
    }
    decoder.close();
    return frames;
  }

  function createImageLayersFromFrames(name, frames, useFrameDelay) {
    const base = name.replace(/\.[^/.]+$/, '');
    return frames.map((frame, index) => {
      const thumbUrl = frame.canvas.toDataURL('image/png');
      return {
        id: crypto.randomUUID(),
        name: `${base} #${index + 1}`,
        kind: 'image',
        img: frame.canvas,
        width: frame.width,
        height: frame.height,
        frameDelay: useFrameDelay ? (frame.delay || 0) : 0,
        thumbUrl,
        revoke: null
      };
    });
  }

  function createGifLayerFromBuffer(name, buffer, kind, gifuctLib) {
    const gif = gifuctLib.parseGIF(buffer);
    const frames = gifuctLib.decompressFrames(gif, true);
    const meta = gif.lsd || {};
    const width = meta.width || (frames[0] && frames[0].dims.width) || 1;
    const height = meta.height || (frames[0] && frames[0].dims.height) || 1;
    const processed = frames.map(frame => {
      const c = document.createElement('canvas');
      c.width = frame.dims.width;
      c.height = frame.dims.height;
      const ctx = c.getContext('2d');
      const imageData = ctx.createImageData(frame.dims.width, frame.dims.height);
      imageData.data.set(frame.patch);
      ctx.putImageData(imageData, 0, 0);
      const delay = Math.max(20, (frame.delay || 8) * 10);
      return { canvas: c, delay, width: frame.dims.width, height: frame.dims.height };
    });
    const totalDuration = processed.reduce((sum, f) => sum + f.delay, 0);
    const thumbUrl = processed[0].canvas.toDataURL('image/png');
    return {
      id: crypto.randomUUID(),
      name,
      kind,
      frames: processed,
      totalDuration,
      width,
      height,
      thumbUrl,
      revoke: null
    };
  }

  async function addEffectFile(file) {
    if (!file || file.type !== 'image/gif') {
      alert('GIFファイルを選択してください');
      return;
    }
    progress('エフェクトGIFを読み込み中...');
    try {
      const gifuctLib = await loadGifuct();
      const buffer = await file.arrayBuffer();
      const layer = createGifLayerFromBuffer(file.name, buffer, 'effect', gifuctLib);
      setEffectLayer(layer);
      renderLayerList();
      updateModeUI();
      progress('エフェクトGIF読み込み完了');
    } catch (err) {
      console.error(err);
      alert('エフェクトGIFの読み込みに失敗しました');
      progress('待機中');
    }
  }

  async function addEffectFromAsset(name) {
    progress('エフェクトGIFを読み込み中...');
    try {
      const gifuctLib = await loadGifuct();
      const res = await fetch(`assets/${name}`);
      if (!res.ok) throw new Error('load failed');
      const buffer = await res.arrayBuffer();
      const layer = createGifLayerFromBuffer(name, buffer, 'effect', gifuctLib);
      setEffectLayer(layer);
      renderLayerList();
      updateModeUI();
      progress('エフェクトGIF読み込み完了');
    } catch (err) {
      console.error(err);
      alert('エフェクトGIFの読み込みに失敗しました');
      progress('待機中');
    }
  }

  function renderLayerList() {
    layerList.innerHTML = '';
    state.layers.forEach((layer, index) => {
      const item = document.createElement('div');
      item.className = 'layerItem';
      item.draggable = true;
      item.dataset.index = String(index);

      const handle = document.createElement('div');
      handle.className = 'layerHandle';
      handle.textContent = '≡';

      const thumb = document.createElement('img');
      thumb.className = 'thumb';
      thumb.src = layer.thumbUrl || '';

      const title = document.createElement('div');
      title.className = 'layerTitle';
      title.textContent = layer.name;

      const type = document.createElement('div');
      type.className = 'layerType';
      type.textContent = layer.kind === 'effect' ? 'FX' : (layer.kind === 'gif' ? 'GIF' : 'IMG');

      const remove = document.createElement('button');
      remove.className = 'layerRemove';
      remove.textContent = '削除';
      remove.addEventListener('click', (e) => {
        e.stopPropagation();
        removeLayer(index);
      });

      item.appendChild(handle);
      item.appendChild(thumb);
      item.appendChild(title);
      item.appendChild(type);
      item.appendChild(remove);

      item.addEventListener('dragstart', onLayerDragStart);
      item.addEventListener('dragover', onLayerDragOver);
      item.addEventListener('drop', onLayerDrop);
      item.addEventListener('dragend', onLayerDragEnd);

      layerList.appendChild(item);
    });
    gifLimit.textContent = `${state.layers.length} / ${state.maxLayers}`;
  }

  let dragIndex = null;

  function onLayerDragStart(e) {
    dragIndex = Number(e.currentTarget.dataset.index);
    e.currentTarget.classList.add('dragging');
    e.dataTransfer.effectAllowed = 'move';
  }

  function onLayerDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  }

  function onLayerDrop(e) {
    e.preventDefault();
    const targetIndex = Number(e.currentTarget.dataset.index);
    if (dragIndex === null || targetIndex === dragIndex) return;
    const [moved] = state.layers.splice(dragIndex, 1);
    state.layers.splice(targetIndex, 0, moved);
    dragIndex = null;
    renderLayerList();
    renderPreviewFrame(performance.now());
  }

  function onLayerDragEnd(e) {
    e.currentTarget.classList.remove('dragging');
    dragIndex = null;
  }

  function removeLayer(index) {
    const removed = state.layers.splice(index, 1)[0];
    if (removed && removed.revoke) removed.revoke();
    renderLayerList();
    updateModeUI();
  }

  function removeEffectLayers() {
    state.layers = state.layers.filter(layer => layer.kind !== 'effect');
    renderLayerList();
    updateModeUI();
  }

  function setEffectLayer(layer) {
    state.layers = state.layers.filter(existing => existing.kind !== 'effect');
    state.layers.push(layer);
  }

  function clearGifLayers() {
    state.layers.forEach(layer => {
      if (layer.revoke) layer.revoke();
    });
    state.layers = [];
    renderLayerList();
  }

  function updateModeUI() {
    gifOptions.style.display = 'block';
    gifPanel.style.display = 'block';
    dropTitle.textContent = 'アニメ用の画像を追加';
    renderLayerList();
    updateExportState();
    renderPreviewFrame(performance.now());
    startPreviewLoop();
  }

  function updateExportState() {
    exportBtn.disabled = state.layers.length === 0;
    clearBtn.disabled = state.layers.length === 0;
  }

  function renderPreviewFrame(now) {
    const rect = previewViewport.getBoundingClientRect();
    const canvasW = Math.max(1, Math.round(rect.width));
    const canvasH = Math.max(1, Math.round(rect.height));
    previewCanvas.width = canvasW;
    previewCanvas.height = canvasH;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasW, canvasH);

    if (!state.layers.length) {
      previewViewport.classList.remove('has-image');
      previewCanvas.style.display = 'none';
      noImage.style.display = 'flex';
      return;
    }
    renderGifPreview(ctx, canvasW, canvasH, now);

    previewViewport.classList.add('has-image');
    previewCanvas.style.display = 'block';
    noImage.style.display = 'none';
  }

  function renderGifPreview(ctx, canvasW, canvasH, now) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvasW,canvasH);
    const time = now - state.previewStart;
    const delay = Math.max(20, parseInt(gifDelayInput.value,10) || 42);
    const plan = getFramePlan(delay);
    const baseLayers = getBaseLayers();
    const index = plan.mode === 'sequence' ? getSequenceIndexForTime(baseLayers, time, delay) : 0;
    const targetSize = getTargetCanvasSize();
    const renderCanvas = getPreviewRenderCanvas(targetSize.canvasW, targetSize.canvasH);
    const rctx = renderCanvas.getContext('2d');
    renderCompositeToCanvas(rctx, targetSize.canvasW, targetSize.canvasH, time, index);

    const scale = Math.min(canvasW / targetSize.canvasW, canvasH / targetSize.canvasH) * 0.95;
    const drawW = targetSize.canvasW * scale;
    const drawH = targetSize.canvasH * scale;
    const dx = (canvasW - drawW) / 2;
    const dy = (canvasH - drawH) / 2;
    ctx.drawImage(renderCanvas, dx, dy, drawW, drawH);
  }

  function drawLayerToCanvas(ctx, canvasW, canvasH, frame, layer, mode) {
    const imgW = frame.width || layer.width || 1;
    const imgH = frame.height || layer.height || 1;
    const scale = mode === 'crop' ? 1 : Math.min(canvasW / imgW, canvasH / imgH) * 0.95;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (canvasW - drawW) / 2;
    const dy = (canvasH - drawH) / 2;
    ctx.drawImage(frame.source, dx, dy, drawW, drawH);
  }

  function renderCompositeToCanvas(ctx, canvasW, canvasH, time, sequenceIndex) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvasW,canvasH);
    const baseLayers = getBaseLayers();
    if (baseLayers.length) {
      const index = (sequenceIndex === null || sequenceIndex === undefined) ? 0 : (sequenceIndex % baseLayers.length);
      const baseLayer = baseLayers.length > 1 ? baseLayers[index] : baseLayers[0];
      const frame = getLayerFrame(baseLayer, time);
      drawLayerToCanvas(ctx, canvasW, canvasH, frame, baseLayer, 'crop');
    }
    const effectLayer = getEffectLayer();
    if (effectLayer) {
      const effectFrame = getLayerFrame(effectLayer, time);
      drawLayerToCanvas(ctx, canvasW, canvasH, effectFrame, effectLayer, 'crop');
    }
  }

  function getSequenceIndexForTime(layers, time, fallbackDelay) {
    if (layers.length <= 1) return 0;
    const delays = layers.map(layer => Math.max(20, layer.frameDelay || fallbackDelay));
    const total = delays.reduce((sum, d) => sum + d, 0);
    if (!total) return 0;
    let t = time % total;
    for (let i = 0; i < delays.length; i++) {
      t -= delays[i];
      if (t < 0) return i;
    }
    return 0;
  }

  function getLayerFrame(layer, time) {
    if (layer.kind === 'image') {
      return { source: layer.img, width: layer.width, height: layer.height };
    }
    const duration = layer.totalDuration || 0;
    if (!duration) {
      const frame = layer.frames[0];
      return { source: frame.canvas, width: frame.width, height: frame.height };
    }
    const t = time % duration;
    let acc = 0;
    for (const frame of layer.frames) {
      acc += frame.delay;
      if (t <= acc) {
        return { source: frame.canvas, width: frame.width, height: frame.height };
      }
    }
    const last = layer.frames[layer.frames.length - 1];
    return { source: last.canvas, width: last.width, height: last.height };
  }

  function startPreviewLoop() {
    if (state.previewRunning) return;
    state.previewRunning = true;
    state.previewStart = performance.now();
    const loop = (now) => {
      if (!state.previewRunning) return;
      renderPreviewFrame(now);
      state.previewFrame = requestAnimationFrame(loop);
    };
    state.previewFrame = requestAnimationFrame(loop);
  }

  async function doGifExport() {
    if (!state.layers.length) return;
    const GifEncoder = (typeof window.GIFEncoder === 'function' && window.GIFEncoder.prototype?.on)
      ? window.GIFEncoder
      : (typeof window.GIF === 'function' && window.GIF.prototype?.on ? window.GIF : null);
    if (!GifEncoder) {
      alert('GIFライブラリが見つかりません');
      return;
    }
    progress('GIF生成準備...');
    const delay = Math.max(20, parseInt(gifDelayInput.value,10) || 42);
    const loop = parseInt(gifLoopInput.value,10);
    const baseName = 'animation';

    const { canvasW, canvasH } = getExportCanvasSize();
    const plan = getFramePlan(delay);
    const frameCount = plan.count;
    const qualitySettings = getQualitySettings();

    const gif = new GifEncoder({
      workers: 2,
      quality: qualitySettings.gifQuality,
      workerScript: '../libs/gif.worker.js'
    });

    gif.on('progress', p => {
      progress(`エンコード進捗 ${(p*100).toFixed(0)}%`);
    });

    for (let i=0;i<frameCount;i++) {
      const t = i * delay;
      const frameCanvas = renderFrameCanvas(canvasW, canvasH, t, plan.mode === 'sequence' ? i : null);
      gif.addFrame(frameCanvas, {delay: delay});
    }

    gif.on('finished', blob => {
      const url = URL.createObjectURL(blob);
      triggerDownload(url, `${baseName}.gif`);
      URL.revokeObjectURL(url);
      progress('GIF生成完了');
    });

    gif.options.repeat = (isNaN(loop) ? 0 : loop);
    progress('エンコード開始...');
    gif.render();
  }

  async function doApngExport() {
    if (!state.layers.length) return;
    if (typeof UPNG === 'undefined') {
      alert('UPNG.jsが見つかりません');
      return;
    }
    progress('APNG生成準備...');
    const delay = Math.max(20, parseInt(gifDelayInput.value,10) || 42);
    const baseName = 'animation';
    const { canvasW, canvasH } = getExportCanvasSize();
    const plan = getFramePlan(delay);
    const frameCount = plan.count;
    const qualitySettings = getQualitySettings();
    const frames = [];
    const delays = [];

    for (let i=0;i<frameCount;i++) {
      const t = i * delay;
      const frameCanvas = renderFrameCanvas(canvasW, canvasH, t, plan.mode === 'sequence' ? i : null);
      const ctx = frameCanvas.getContext('2d');
      const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
      frames.push(imageData.data.buffer);
      delays.push(delay);
    }

    const apng = UPNG.encode(frames, canvasW, canvasH, qualitySettings.apngColors, delays);
    const blob = new Blob([apng], {type:'image/png'});
    const url = URL.createObjectURL(blob);
    triggerDownload(url, `${baseName}.png`);
    URL.revokeObjectURL(url);
    progress('APNG生成完了');
  }

  async function doWebpExport() {
    if (!state.layers.length) return;
    progress('WebP生成準備...');
    const { canvasW, canvasH } = getExportCanvasSize();
    const delay = Math.max(20, parseInt(gifDelayInput.value,10) || 42);
    const plan = getFramePlan(delay);
    const frameCount = plan.count;
    const qualitySettings = getQualitySettings();
    if (frameCount <= 1) {
      const frameCanvas = renderFrameCanvas(canvasW, canvasH, 0, plan.mode === 'sequence' ? 0 : null);
      await new Promise((resolve, reject) => {
        frameCanvas.toBlob(blob => {
          if (!blob) { reject(new Error('Blob 生成失敗')); return; }
          const url = URL.createObjectURL(blob);
          triggerDownload(url, 'animation.webp');
          URL.revokeObjectURL(url);
          resolve();
        }, 'image/webp');
      });
      progress('WebP生成完了');
      return;
    }

    const loop = parseInt(gifLoopInput.value,10);
    const loopCount = Number.isFinite(loop) ? loop : 0;
    let mod;
    try {
      mod = await getWebpAnimModule();
    } catch (err) {
      console.error(err);
      alert('WebPアニメ用モジュールが見つかりません');
      return;
    }

    const create = mod.cwrap('aw_create', 'number', ['number','number','number','number','number','number']);
    const addFrame = mod.cwrap('aw_add_frame', 'number', ['number','number','number']);
    const finalize = mod.cwrap('aw_finalize', 'number', ['number','number']);
    const getPtr = mod.cwrap('aw_get_data_ptr', 'number', ['number']);
    const getSize = mod.cwrap('aw_get_data_size', 'number', ['number']);
    const destroy = mod.cwrap('aw_destroy', null, ['number']);

    const lossless = qualitySettings.webpLossless;
    const quality = qualitySettings.webpQuality;
    const handle = create(canvasW, canvasH, loopCount, 0xffffffff, lossless, quality);
    if (!handle) {
      alert('WebPエンコーダの初期化に失敗しました');
      return;
    }

    try {
      for (let i=0;i<frameCount;i++) {
        const t = i * delay;
        const frameCanvas = renderFrameCanvas(canvasW, canvasH, t, plan.mode === 'sequence' ? i : null);
        const ctx = frameCanvas.getContext('2d');
        const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
        applyFrameUniqMarker(imageData, i, !lossless);
        const size = canvasW * canvasH * 4;
        const ptr = mod._malloc(size);
        mod.HEAPU8.set(imageData.data, ptr);
        const ok = addFrame(handle, ptr, t);
        mod._free(ptr);
        if (!ok) throw new Error('add frame failed');
        progress(`エンコード進捗 ${Math.round(((i + 1) / frameCount) * 100)}%`);
      }
      const endTs = frameCount * delay;
      const ok = finalize(handle, endTs);
      if (!ok) throw new Error('assemble failed');
      const outPtr = getPtr(handle);
      const outSize = getSize(handle);
      if (!outPtr || !outSize) throw new Error('data empty');
      const outData = new Uint8Array(mod.HEAPU8.subarray(outPtr, outPtr + outSize));
      const blob = new Blob([outData], { type: 'image/webp' });
      const url = URL.createObjectURL(blob);
      triggerDownload(url, 'animation.webp');
      URL.revokeObjectURL(url);
      progress('WebP生成完了');
    } finally {
      destroy(handle);
    }
  }

  function getExportCanvasSize() {
    const target = getTargetCanvasSize();
    return { canvasW: target.canvasW, canvasH: target.canvasH };
  }

  function getFramePlan(delay) {
    const baseLayers = getBaseLayers();
    if (baseLayers.length > 1) {
      return { mode: 'sequence', count: baseLayers.length };
    }
    const maxDuration = Math.max(...state.layers.map(layer => layer.totalDuration || delay), delay * 2);
    return { mode: 'animate', count: Math.max(2, Math.ceil(maxDuration / delay)) };
  }

  function getBaseLayers() {
    return state.layers.filter(layer => layer.kind !== 'effect');
  }

  function getEffectLayer() {
    return state.layers.find(layer => layer.kind === 'effect') || null;
  }

  function renderFrameCanvas(canvasW, canvasH, time, sequenceIndex) {
    const frameCanvas = document.createElement('canvas');
    frameCanvas.width = canvasW;
    frameCanvas.height = canvasH;
    const fctx = frameCanvas.getContext('2d');
    renderCompositeToCanvas(fctx, canvasW, canvasH, time, sequenceIndex);
    return frameCanvas;
  }

  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function applyFrameUniqMarker(imageData, index, strong) {
    const data = imageData.data;
    const last = data.length - 4;
    if (strong) {
      data[last] = (index * 53) % 256;
      data[last + 1] = (index * 97) % 256;
      data[last + 2] = (index * 151) % 256;
      data[last + 3] = 255;
      return;
    }
    // Flip only LSBs to keep the change visually imperceptible.
    data[last] = (data[last] & 0xFE) | (index & 1);
    data[last + 1] = (data[last + 1] & 0xFE) | ((index >> 1) & 1);
    data[last + 2] = (data[last + 2] & 0xFE) | ((index >> 2) & 1);
    data[last + 3] = 255;
  }

  function getQualitySettings() {
    const level = Math.max(1, Math.min(3, parseInt(qualityInput?.value, 10) || 2));
    const gifQualityMap = [20, 10, 5];
    const webpQualityMap = [55, 80, 95];
    const apngColorsMap = [32, 128, 0];
    return {
      level,
      gifQuality: gifQualityMap[level - 1],
      webpQuality: webpQualityMap[level - 1],
      webpLossless: level === 3,
      apngColors: apngColorsMap[level - 1]
    };
  }

  function getTargetCanvasSize() {
    const customW = Number.isFinite(sizeWidthInput?.valueAsNumber) ? sizeWidthInput.valueAsNumber : 0;
    const customH = Number.isFinite(sizeHeightInput?.valueAsNumber) ? sizeHeightInput.valueAsNumber : 0;
    const auto = getMaxLayerSize();
    if (customW > 0 || customH > 0) {
      return {
        canvasW: customW > 0 ? customW : auto.canvasW,
        canvasH: customH > 0 ? customH : auto.canvasH,
        mode: 'custom'
      };
    }
    return { canvasW: auto.canvasW, canvasH: auto.canvasH, mode: 'auto' };
  }

  function getMaxLayerSize() {
    let maxW = 0;
    let maxH = 0;
    state.layers.forEach(layer => {
      const w = layer.width || 0;
      const h = layer.height || 0;
      if (w > maxW) maxW = w;
      if (h > maxH) maxH = h;
    });
    if (!maxW || !maxH) {
      return { canvasW: 1920, canvasH: 1080 };
    }
    return { canvasW: maxW, canvasH: maxH };
  }

  function getPreviewRenderCanvas(canvasW, canvasH) {
    if (!state.previewRenderCanvas) {
      state.previewRenderCanvas = document.createElement('canvas');
    }
    if (state.previewRenderCanvas.width !== canvasW || state.previewRenderCanvas.height !== canvasH) {
      state.previewRenderCanvas.width = canvasW;
      state.previewRenderCanvas.height = canvasH;
    }
    return state.previewRenderCanvas;
  }

  function progress(){ }

  function loadImage(src) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }
  async function loadEffectAssets() {
    effectAssetSelect.innerHTML = '';
    const emptyOpt = document.createElement('option');
    emptyOpt.value = '';
    emptyOpt.textContent = 'assetsから選択';
    effectAssetSelect.appendChild(emptyOpt);
    try {
      const res = await fetch('assets/manifest.json');
      if (!res.ok) throw new Error('no manifest');
      const list = await res.json();
      if (Array.isArray(list)) {
        list.forEach(name => {
          const opt = document.createElement('option');
          opt.value = name;
          opt.textContent = name;
          effectAssetSelect.appendChild(opt);
        });
      }
    } catch (err) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'assets未設定';
      effectAssetSelect.appendChild(opt);
    }
  }
  loadEffectAssets();
  updateModeUI();
  startPreviewLoop();
})();
