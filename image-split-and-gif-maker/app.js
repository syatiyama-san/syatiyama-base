// app.js

(() => {
  const dropArea = document.getElementById('dropArea');
  const previewCanvas = document.getElementById('previewCanvas');
  const noImage = document.getElementById('noImage');
  const exportBtn = document.getElementById('exportBtn');
  const clearBtn = document.getElementById('clearBtn');
  const fileInfo = document.getElementById('fileInfo');
  const progressEl = document.getElementById('progress');

  const gifModeSelect = document.getElementById('gifMode');
  const gifFramesInput = document.getElementById('gifFrames');
  const gifDelayInput = document.getElementById('gifDelay');
  const gifLoopInput = document.getElementById('gifLoop');
  const overlayGifInput = document.getElementById('overlayGifInput');

  const modeSplitRadio = document.getElementById('modeSplit');
  const modeGifRadio = document.getElementById('modeGif');
  const splitOptions = document.getElementById('splitOptions');
  const gifOptions = document.getElementById('gifOptions');

  const zoomRange = document.getElementById('zoomRange');

  let currentFile = null;
  let currentImage = null;
  let overlayGifArrayBuffer = null;
  let overlayFrames = null;

  ['dragenter','dragover'].forEach(ev => {
    dropArea.addEventListener(ev, e => { e.preventDefault(); dropArea.style.borderColor = '#0b69ff'; }, false);
  });
  ['dragleave','drop'].forEach(ev => {
    dropArea.addEventListener(ev, e => { e.preventDefault(); dropArea.style.borderColor = '#ccc'; }, false);
  });
  dropArea.addEventListener('drop', e => {
    const f = e.dataTransfer.files && e.dataTransfer.files[0];
    if (f) loadFile(f);
  });

  dropArea.addEventListener('click', () => {
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.onchange = () => {
      if (inp.files && inp.files[0]) loadFile(inp.files[0]);
    };
    inp.click();
  });

  overlayGifInput.addEventListener('change', async (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) { overlayGifArrayBuffer = null; overlayFrames = null; return; }
    if (f.type !== 'image/gif') {
      alert('GIFファイルを選択してください');
      overlayGifInput.value = '';
      return;
    }
    progress('アップロードGIFを解析中...');
    overlayGifArrayBuffer = await f.arrayBuffer();
    try {
      const gif = gifuct.parseGIF(overlayGifArrayBuffer);
      const frames = gifuct.decompressFrames(gif, true);
      overlayFrames = frames;
      progress(`アップロードGIFのフレーム数: ${frames.length}`);
    } catch (err) {
      console.error(err);
      overlayFrames = null;
      alert('GIF解析に失敗しました');
      progress('待機中');
    }
  });

  function loadFile(file) {
    if (!file.type.startsWith('image/')) {
      alert('画像ファイルを選択してください');
      return;
    }
    currentFile = file;
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      currentImage = img;
      URL.revokeObjectURL(url);
      renderPreview();
      exportBtn.disabled = false;
      clearBtn.disabled = false;
      fileInfo.textContent = `${file.name} ・ ${img.width}×${img.height}px`;
      progress('画像読み込み完了');
    };
    img.onerror = () => {
      alert('画像の読み込みに失敗しました');
      URL.revokeObjectURL(url);
      progress('待機中');
    };
    img.src = url;
  }

  clearBtn.addEventListener('click', () => {
    currentFile = null;
    currentImage = null;
    overlayGifArrayBuffer = null;
    overlayFrames = null;
    previewCanvas.style.display = 'none';
    noImage.style.display = 'block';
    exportBtn.disabled = true;
    clearBtn.disabled = true;
    fileInfo.textContent = '読み込み待ち';
    overlayGifInput.value = '';
    progress('待機中');
  });

  [modeSplitRadio, modeGifRadio].forEach(r => r.addEventListener('change', () => {
    if (modeGifRadio.checked) {
      splitOptions.style.display = 'none';
      gifOptions.style.display = 'block';
    } else {
      splitOptions.style.display = 'block';
      gifOptions.style.display = 'none';
    }
  }));

  function renderPreview() {
    if (!currentImage) return;
    const targetRatio = 16/9;
    const maxPreviewW = 800;
    const maxPreviewH = 450;
    let canvasW = maxPreviewW;
    let canvasH = Math.round(canvasW / targetRatio);
    if (canvasH > maxPreviewH) {
      canvasH = maxPreviewH;
      canvasW = Math.round(canvasH * targetRatio);
    }
    previewCanvas.width = canvasW;
    previewCanvas.height = canvasH;
    const ctx = previewCanvas.getContext('2d');

    const bgColor = document.querySelector('input[name="bg"]:checked')?.value || '#ffffff';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0,0,canvasW,canvasH);

    const img = currentImage;
    const imgRatio = img.width / img.height;
    let drawW, drawH;
    const zoom = (parseInt(zoomRange.value,10) || 100) / 100;
    if (imgRatio > targetRatio) {
      drawW = canvasW * 0.95 * zoom;
      drawH = drawW / imgRatio;
    } else {
      drawH = canvasH * 0.95 * zoom;
      drawW = drawH * imgRatio;
    }
    const dx = (canvasW - drawW) / 2;
    const dy = (canvasH - drawH) / 2;
    ctx.drawImage(img, dx, dy, drawW, drawH);

    previewCanvas.style.display = 'block';
    noImage.style.display = 'none';
  }
  zoomRange.addEventListener('input', renderPreview);

  // Export handler
  exportBtn.addEventListener('click', async () => {
    if (!currentImage || !currentFile) return;
    exportBtn.disabled = true;
    progress('処理開始...');
    try {
      if (modeSplitRadio.checked) {
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

  // 4分割処理（16:9） - 既存の実装を踏襲
  async function doSplitExport() {
    progress('4分割処理中...');
    const targetRatio = 16/9;
    const img = currentImage;

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
    const fmt = document.querySelector('input[name="format"]:checked').value || 'png';
    const baseName = sanitizeFilename(currentFile.name.replace(/\.[^/.]+$/, ''));

    const tiles = [
      {sx:0, sy:0, name:`${baseName}-1`},
      {sx:tileW, sy:0, name:`${baseName}-2`},
      {sx:0, sy:tileH, name:`${baseName}-3`},
      {sx:tileW, sy:tileH, name:`${baseName}-4`}
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

  // GIF出力処理
  async function doGifExport() {
    progress('GIF生成準備...');
    const mode = gifModeSelect.value;
    const framesCount = Math.max(2, Math.min(60, parseInt(gifFramesInput.value,10) || 12));
    const delay = Math.max(20, parseInt(gifDelayInput.value,10) || 80);
    const loop = parseInt(gifLoopInput.value,10);
    const baseName = sanitizeFilename(currentFile.name.replace(/\.[^/.]+$/, ''));

    // Prepare master canvas sized to 16:9 based on original image (similar to split)
    const targetRatio = 16/9;
    const img = currentImage;
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

    // Draw background + centered image once; frames will be derived by transforms
    const bgColor = document.querySelector('input[name="bg"]:checked')?.value || '#ffffff';
    mctx.fillStyle = bgColor;
    mctx.fillRect(0,0,canvasW,canvasH);

    const imgRatio = img.width / img.height;
    let baseDrawW, baseDrawH;
    if (imgRatio > targetRatio) {
      baseDrawW = canvasW * 0.95;
      baseDrawH = baseDrawW / imgRatio;
    } else {
      baseDrawH = canvasH * 0.95;
      baseDrawW = baseDrawH * imgRatio;
    }
    const baseDx = Math.round((canvasW - baseDrawW) / 2);
    const baseDy = Math.round((canvasH - baseDrawH) / 2);

    // GIF encoder setup
    progress('GIFエンコーダ初期化...');
    const gif = new GIF({
      workers: 2,
      quality: 10,
      workerScript: '../libs/gif.worker.js'
    });

    gif.on('progress', p => {
      progress(`エンコード進捗 ${(p*100).toFixed(0)}%`);
    });

    const addFrameToGif = (canvas, delayMs) => {
      gif.addFrame(canvas, {delay: delayMs});
    };

    if (mode === 'fromImage') {
      progress('静止画からフレーム生成中...');
      // Generate frames by simple zoom-in/out loop
      for (let i=0;i<framesCount;i++) {
        const t = i / framesCount;
        // zoom oscillation between 1.0 and 1.08
        const zoom = 1 + 0.08 * Math.sin(t * Math.PI * 2);
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = canvasW;
        frameCanvas.height = canvasH;
        const fctx = frameCanvas.getContext('2d');
        fctx.fillStyle = bgColor;
        fctx.fillRect(0,0,canvasW,canvasH);

        const drawW = baseDrawW * zoom;
        const drawH = baseDrawH * zoom;
        const dx = Math.round((canvasW - drawW) / 2);
        const dy = Math.round((canvasH - drawH) / 2);
        fctx.drawImage(img, dx, dy, Math.round(drawW), Math.round(drawH));

        addFrameToGif(frameCanvas, delay);
      }
    } else if (mode === 'overlayGif') {
      if (!overlayFrames || overlayFrames.length === 0) {
        alert('先に重ねるGIFをアップロードしてください');
        progress('待機中');
        return;
      }
      progress('アップロードGIFフレームを合成中...');
      // overlayFrames contain raw RGBA patches; we will draw each overlay frame onto master and add to gif
      // Determine overlay frame count and map to requested framesCount
      const srcFrames = overlayFrames;
      const srcCount = srcFrames.length;
      // For each output frame, pick corresponding overlay frame (looping) and composite
      for (let i=0;i<framesCount;i++) {
        const srcIdx = i % srcCount;
        const src = srcFrames[srcIdx];
        // Create ImageData from src.patch (Uint8ClampedArray)
        const frameCanvas = document.createElement('canvas');
        frameCanvas.width = canvasW;
        frameCanvas.height = canvasH;
        const fctx = frameCanvas.getContext('2d');
        // draw background and base image
        fctx.fillStyle = bgColor;
        fctx.fillRect(0,0,canvasW,canvasH);
        fctx.drawImage(img, baseDx, baseDy, Math.round(baseDrawW), Math.round(baseDrawH));

        // Create temporary canvas for overlay frame (src.dims gives position and size)
        const dims = src.dims;
        const overlayCanvas = document.createElement('canvas');
        overlayCanvas.width = dims.width;
        overlayCanvas.height = dims.height;
        const octx = overlayCanvas.getContext('2d');

        // src.patch is an array of RGBA bytes
        const imageData = octx.createImageData(dims.width, dims.height);
        imageData.data.set(src.patch);
        octx.putImageData(imageData, 0, 0);

        // Scale overlay to fit master canvas proportionally (optional)
        // Here we center overlay on master
        const scale = Math.min(canvasW / dims.width, canvasH / dims.height, 1.0);
        const ow = Math.round(dims.width * scale);
        const oh = Math.round(dims.height * scale);
        const odx = Math.round((canvasW - ow) / 2);
        const ody = Math.round((canvasH - oh) / 2);

        fctx.drawImage(overlayCanvas, 0, 0, dims.width, dims.height, odx, ody, ow, oh);

        addFrameToGif(frameCanvas, delay);
      }
    } else {
      alert('未対応のGIFモードです');
      progress('待機中');
      return;
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

  // Helpers
  function sanitizeFilename(name) {
    return name.replace(/[\/\\?%*:|"<>]/g, '-').slice(0,120);
  }
  function sleep(ms){ return new Promise(r=>setTimeout(r,ms)); }
  function progress(text){ progressEl.textContent = `状態: ${text}`; }

  // Re-render preview when window resizes
  window.addEventListener('resize', () => { if (currentImage) renderPreview(); });

})();

