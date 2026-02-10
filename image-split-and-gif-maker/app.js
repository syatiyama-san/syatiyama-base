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
  const splitFileSlot = document.getElementById('splitFileSlot');
  const splitImageInput = document.getElementById('splitImageInput');
  const splitFileInfo = document.getElementById('splitFileInfo');
  const splitThumb = document.getElementById('splitThumb');
  const splitMeta = document.getElementById('splitMeta');
  const removeSplitBtn = document.getElementById('removeSplitBtn');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');

  const modeSplitRadio = document.getElementById('modeSplit');
  const modeGifRadio = document.getElementById('modeGif');
  const splitOptions = document.getElementById('splitOptions');
  const gifOptions = document.getElementById('gifOptions');
  const splitExportOptions = document.getElementById('splitExportOptions');
  const exportLabel = document.getElementById('exportLabel');

  const gifDelayInput = document.getElementById('gifDelay');
  const gifLoopInput = document.getElementById('gifLoop');
  const formatSelect = document.getElementById('format');

  const state = {
    mode: 'gif',
    layers: [],
    splitFile: null,
    splitImage: null,
    previewRunning: false,
    previewStart: 0,
    previewFrame: null,
    maxLayers: 50
  };

  const bindDropTarget = (target, highlightTarget, onDrop) => {
    ['dragenter','dragover'].forEach(ev => {
      target.addEventListener(ev, e => {
        e.preventDefault();
        highlightTarget.classList.add('dragover');
      }, false);
    });
    ['dragleave','drop'].forEach(ev => {
      target.addEventListener(ev, e => {
        e.preventDefault();
        highlightTarget.classList.remove('dragover');
      }, false);
    });
    target.addEventListener('drop', e => {
      const files = e.dataTransfer.files ? Array.from(e.dataTransfer.files) : [];
      if (files.length) onDrop(files);
    });
  };

  bindDropTarget(dropArea, previewViewport, (files) => {
    if (state.mode === 'gif') {
      addGifFiles(files);
    } else {
      if (files[0]) loadSplitFile(files[0]);
    }
  });
  bindDropTarget(previewViewport, previewViewport, (files) => {
    if (state.mode === 'gif') {
      addGifFiles(files);
    } else {
      if (files[0]) loadSplitFile(files[0]);
    }
  });
  bindDropTarget(gifFileSlot, gifFileSlot, addGifFiles);
  bindDropTarget(effectFileSlot, effectFileSlot, (files) => {
    if (files[0]) addEffectFile(files[0]);
  });
  bindDropTarget(splitFileSlot, splitFileSlot, (files) => {
    if (files[0]) loadSplitFile(files[0]);
  });

  dropArea.addEventListener('click', () => {
    if (state.mode === 'gif') {
      gifFilesInput.click();
    } else {
      splitImageInput.click();
    }
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

  splitFileSlot.addEventListener('click', () => splitImageInput.click());
  splitImageInput.addEventListener('change', () => {
    if (splitImageInput.files && splitImageInput.files[0]) loadSplitFile(splitImageInput.files[0]);
  });

  removeSplitBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    clearSplit();
  });

  removeEffectBtn.addEventListener('click', () => {
    removeEffectLayers();
  });

  [modeSplitRadio, modeGifRadio].forEach(r => r.addEventListener('change', () => {
    const nextMode = modeGifRadio.checked ? 'gif' : 'split';
    if (nextMode !== state.mode) {
      if (nextMode === 'gif') {
        clearSplit();
      } else {
        clearGifLayers();
      }
    }
    state.mode = nextMode;
    updateModeUI();
  }));

  document.querySelectorAll('input[name="bg"]').forEach(r => {
    r.addEventListener('change', () => renderPreviewFrame(performance.now()));
  });

  exportBtn.addEventListener('click', async () => {
    exportBtn.disabled = true;
    progress('処理開始...');
    try {
      if (state.mode === 'split') {
        await doSplitExport();
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
    if (state.mode === 'gif') {
      clearGifLayers();
      updateModeUI();
    }
  });

  async function addGifFiles(files) {
    const available = state.maxLayers - state.layers.length;
    if (available <= 0) {
      alert('50枚まで追加できます');
      return;
    }
    const targets = files.filter(f => f.type.startsWith('image/')).slice(0, available);
    if (!targets.length) return;
    progress('画像を読み込み中...');
    for (const file of targets) {
      const layer = await createLayerFromFile(file);
      if (layer) state.layers.push(layer);
    }
    progress('画像読み込み完了');
    renderLayerList();
    updateModeUI();
  }

  async function createLayerFromFile(file) {
    if (!file.type.startsWith('image/')) return null;
    if (file.type === 'image/gif' || file.name.toLowerCase().endsWith('.gif')) {
      const buffer = await file.arrayBuffer();
      return createGifLayerFromBuffer(file.name, buffer, 'gif');
    }
    const url = URL.createObjectURL(file);
    const img = await loadImage(url);
    return {
      id: crypto.randomUUID(),
      name: file.name,
      kind: 'image',
      img,
      width: img.width,
      height: img.height,
      thumbUrl: url,
      revoke: () => URL.revokeObjectURL(url)
    };
  }

  function createGifLayerFromBuffer(name, buffer, kind) {
    const gif = gifuct.parseGIF(buffer);
    const frames = gifuct.decompressFrames(gif, true);
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
      const buffer = await file.arrayBuffer();
      const layer = createGifLayerFromBuffer(file.name, buffer, 'effect');
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
      const res = await fetch(`assets/${name}`);
      if (!res.ok) throw new Error('load failed');
      const buffer = await res.arrayBuffer();
      const layer = createGifLayerFromBuffer(name, buffer, 'effect');
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

  async function loadSplitFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      state.splitFile = file;
      state.splitImage = img;
      splitMeta.textContent = `${file.name} ・ ${img.width}×${img.height}px`;
      splitFileInfo.style.display = 'flex';
      splitThumb.onload = () => URL.revokeObjectURL(url);
      splitThumb.src = url;
      updateModeUI();
      progress('画像読み込み完了');
    } catch (err) {
      URL.revokeObjectURL(url);
      alert('画像の読み込みに失敗しました');
      progress('待機中');
    }
  }

  function clearSplit() {
    splitImageInput.value = '';
    state.splitFile = null;
    state.splitImage = null;
    splitFileInfo.style.display = 'none';
    splitMeta.textContent = '';
    splitThumb.removeAttribute('src');
  }

  function clearGifLayers() {
    state.layers.forEach(layer => {
      if (layer.revoke) layer.revoke();
    });
    state.layers = [];
    renderLayerList();
  }

  function updateModeUI() {
    if (state.mode === 'gif') {
      splitOptions.style.display = 'none';
      gifOptions.style.display = 'block';
      splitExportOptions.style.display = 'none';
      exportLabel.style.display = 'none';
      gifPanel.style.display = 'block';
      dropTitle.textContent = 'GIF用の画像を追加';
    } else {
      splitOptions.style.display = 'block';
      gifOptions.style.display = 'none';
      splitExportOptions.style.display = 'block';
      exportLabel.style.display = 'block';
      gifPanel.style.display = 'none';
      dropTitle.textContent = '分割する画像を追加';
    }
    renderLayerList();
    updateExportState();
    renderPreviewFrame(performance.now());
    startPreviewLoop();
  }

  function updateExportState() {
    if (state.mode === 'gif') {
      exportBtn.disabled = state.layers.length === 0;
    } else {
      exportBtn.disabled = !state.splitImage;
    }
    if (state.mode === 'gif') {
      clearBtn.disabled = state.layers.length === 0;
    }
  }

  function renderPreviewFrame(now) {
    const rect = previewViewport.getBoundingClientRect();
    const canvasW = Math.max(1, Math.round(rect.width));
    const canvasH = Math.max(1, Math.round(rect.height));
    previewCanvas.width = canvasW;
    previewCanvas.height = canvasH;
    const ctx = previewCanvas.getContext('2d');
    ctx.clearRect(0, 0, canvasW, canvasH);

    if (state.mode === 'split') {
      if (!state.splitImage) {
        previewViewport.classList.remove('has-image');
        previewCanvas.style.display = 'none';
        noImage.style.display = 'flex';
        return;
      }
      renderSplitPreview(ctx, canvasW, canvasH);
    } else {
      if (!state.layers.length) {
        previewViewport.classList.remove('has-image');
        previewCanvas.style.display = 'none';
        noImage.style.display = 'flex';
        return;
      }
      renderGifPreview(ctx, canvasW, canvasH, now);
    }

    previewViewport.classList.add('has-image');
    previewCanvas.style.display = 'block';
    noImage.style.display = 'none';
  }

  function renderSplitPreview(ctx, canvasW, canvasH) {
    const bgColor = document.querySelector('input[name="bg"]:checked')?.value || '#ffffff';
    const master = document.createElement('canvas');
    master.width = canvasW;
    master.height = canvasH;
    const mctx = master.getContext('2d');
    mctx.fillStyle = bgColor;
    mctx.fillRect(0,0,canvasW,canvasH);

    const img = state.splitImage;
    const imgRatio = img.width / img.height;
    const targetRatio = 16/9;
    let drawW, drawH;
    if (imgRatio > targetRatio) {
      drawW = canvasW * 0.95;
      drawH = drawW / imgRatio;
    } else {
      drawH = canvasH * 0.95;
      drawW = drawH * imgRatio;
    }
    const dx = (canvasW - drawW) / 2;
    const dy = (canvasH - drawH) / 2;
    mctx.drawImage(img, dx, dy, drawW, drawH);

    const gap = Math.max(8, Math.round(canvasW * 0.015));
    const tileW = Math.floor((canvasW - gap) / 2);
    const tileH = Math.floor((canvasH - gap) / 2);
    const tiles = [
      {sx:0, sy:0, dx:0, dy:0},
      {sx:tileW, sy:0, dx:tileW + gap, dy:0},
      {sx:0, sy:tileH, dx:0, dy:tileH + gap},
      {sx:tileW, sy:tileH, dx:tileW + gap, dy:tileH + gap}
    ];

    ctx.fillStyle = '#f0f0f0';
    ctx.fillRect(0,0,canvasW,canvasH);
    tiles.forEach(t => {
      ctx.drawImage(master, t.sx, t.sy, tileW, tileH, t.dx, t.dy, tileW, tileH);
    });
  }

  function renderGifPreview(ctx, canvasW, canvasH, now) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0,0,canvasW,canvasH);
    const time = now - state.previewStart;
    state.layers.forEach(layer => {
      const frame = getLayerFrame(layer, time);
      drawLayerToCanvas(ctx, canvasW, canvasH, frame, layer);
    });
  }

  function drawLayerToCanvas(ctx, canvasW, canvasH, frame, layer) {
    const imgW = frame.width || layer.width || 1;
    const imgH = frame.height || layer.height || 1;
    const scale = Math.min(canvasW / imgW, canvasH / imgH) * 0.95;
    const drawW = imgW * scale;
    const drawH = imgH * scale;
    const dx = (canvasW - drawW) / 2;
    const dy = (canvasH - drawH) / 2;
    ctx.drawImage(frame.source, dx, dy, drawW, drawH);
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

  async function doSplitExport() {
    if (!state.splitImage || !state.splitFile) return;
    progress('4分割処理中...');
    const targetRatio = 16/9;
    const img = state.splitImage;

    let canvasW = img.width;
    let canvasH = Math.round(canvasW / targetRatio);
    if (canvasH < img.height) {
      canvasH = img.height;
      canvasW = Math.round(canvasH * targetRatio);
    }
    const MAX_PIX = 8000;
    if (canvasW > MAX_PIX || canvasH > MAX_PIX) {
      const scale = Math.min(MAX_PIX / canvasW, MAX_PIX / canvasH);
      canvasW = Math.round(canvasW * scale);
      canvasH = Math.round(canvasH * scale);
    }

    const master = document.createElement('canvas');
    master.width = canvasW;
    master.height = canvasH;
    const mctx = master.getContext('2d');
    const bgColor = document.querySelector('input[name="bg"]:checked').value || '#ffffff';
    mctx.fillStyle = bgColor;
    mctx.fillRect(0,0,canvasW,canvasH);

    const imgRatio = img.width / img.height;
    let drawW, drawH;
    if (imgRatio > targetRatio) {
      drawW = canvasW * 0.95;
      drawH = drawW / imgRatio;
    } else {
      drawH = canvasH * 0.95;
      drawW = drawH * imgRatio;
    }
    const dx = Math.round((canvasW - drawW) / 2);
    const dy = Math.round((canvasH - drawH) / 2);
    mctx.drawImage(img, dx, dy, Math.round(drawW), Math.round(drawH));

    const tileW = Math.floor(canvasW / 2);
    const tileH = Math.floor(canvasH / 2);
    const fmt = (formatSelect && formatSelect.value) ? formatSelect.value : 'png';
    const baseName = sanitizeFilename(state.splitFile.name.replace(/\.[^/.]+$/, ''));

    const tiles = [
      {sx:0, sy:0, name:`${baseName}_1`},
      {sx:tileW, sy:0, name:`${baseName}_2`},
      {sx:0, sy:tileH, name:`${baseName}_3`},
      {sx:tileW, sy:tileH, name:`${baseName}_4`}
    ];

    for (let i=0;i<tiles.length;i++) {
      const t = tiles[i];
      const tCanvas = document.createElement('canvas');
      tCanvas.width = tileW;
      tCanvas.height = tileH;
      const tctx = tCanvas.getContext('2d');
      tctx.drawImage(master, t.sx, t.sy, tileW, tileH, 0, 0, tileW, tileH);
      await canvasToFileAndDownload(tCanvas, fmt, t.name);
      await sleep(120);
    }
    progress('4分割ダウンロード完了');
  }

  async function doGifExport() {
    if (!state.layers.length) return;
    if (typeof GIF === 'undefined') {
      alert('GIFライブラリが見つかりません');
      return;
    }
    progress('GIF生成準備...');
    const delay = Math.max(20, parseInt(gifDelayInput.value,10) || 80);
    const loop = parseInt(gifLoopInput.value,10);
    const baseName = 'gif-output';

    const targetRatio = 16/9;
    const baseLayer = state.layers[0];
    const baseW = baseLayer.width || 1920;
    const baseH = baseLayer.height || 1080;
    let canvasW = baseW;
    let canvasH = Math.round(canvasW / targetRatio);
    if (canvasH < baseH) {
      canvasH = baseH;
      canvasW = Math.round(canvasH * targetRatio);
    }

    const maxDuration = Math.max(...state.layers.map(layer => layer.totalDuration || delay), delay * 2);
    const frameCount = Math.max(2, Math.ceil(maxDuration / delay));

    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: '../libs/gif.worker.js'
    });

    gif.on('progress', p => {
      progress(`エンコード進捗 ${(p*100).toFixed(0)}%`);
    });

    for (let i=0;i<frameCount;i++) {
      const t = i * delay;
      const frameCanvas = document.createElement('canvas');
      frameCanvas.width = canvasW;
      frameCanvas.height = canvasH;
      const fctx = frameCanvas.getContext('2d');
      fctx.fillStyle = '#ffffff';
      fctx.fillRect(0,0,canvasW,canvasH);
      state.layers.forEach(layer => {
        const frame = getLayerFrame(layer, t);
        drawLayerToCanvas(fctx, canvasW, canvasH, frame, layer);
      });
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

  function canvasToFileAndDownload(canvas, format, baseName) {
    return new Promise((resolve, reject) => {
      const mime = format === 'jpg' ? 'image/jpeg' : 'image/png';
      const quality = format === 'jpg' ? 0.92 : undefined;
      canvas.toBlob(blob => {
        if (!blob) { reject(new Error('Blob 生成失敗')); return; }
        const url = URL.createObjectURL(blob);
        triggerDownload(url, `${baseName}.${format === 'jpg' ? 'jpg' : 'png'}`);
        URL.revokeObjectURL(url);
        resolve();
      }, mime, quality);
    });
  }

  function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  }

  function sanitizeFilename(name) {
    return name.replace(/[\/\\?%*:|"<>]/g, '-').slice(0,120);
  }

  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
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

