// app-interactions.js

(function(){
    const canvas = window.APP && window.APP.canvas;
    const ctx = window.APP && window.APP.ctx;
    const state = window.APP && window.APP.state;
    const ui = window.APP && window.APP.ui;
    const utils = window.APP && window.APP.utils;

    if(!canvas || !state){
        console.error('app-interactions: required globals missing (canvas/state).');
        return;
    }

    const refs = (ui && ui.refs) ? ui.refs : {
        fontSizeEl: document.getElementById('fontSize'),
        fontSelect: document.getElementById('fontSelect'),
        fontColorEl: document.getElementById('fontColor'),
        subPicCropY: document.getElementById('subPicCropY'),
        subPicZoom: document.getElementById('subPicZoom'),
        subPicZoomVal: document.getElementById('subPicZoomVal'),
        subPicBorder: document.getElementById('subPicBorder'),
        bgSubPic: document.getElementById('bgSubPic'),
        bgSubPicAlpha: document.getElementById('bgSubPicAlpha'),
        bgSubPicAlphaVal: document.getElementById('bgSubPicAlphaVal'),
        bandColor: document.getElementById('bandColor'),
        bandHeight: document.getElementById('bandHeight'),
        text1El: document.getElementById('text1'),
        text2El: document.getElementById('text2'),
        text3El: document.getElementById('text3'),
        exportBtn: document.getElementById('exportBtn'),
        formatSel: document.getElementById('format'),
        wmPicOpacity: document.getElementById('wmPicOpacity'),
        resetMainPicPos: document.getElementById('resetMainPicPos'),
        resetSubPicPos: document.getElementById('resetSubPicPos'),
        resetBgPicPos: document.getElementById('resetBgPicPos'),
        resetWmPicPos: document.getElementById('resetWmPicPos'),
        sysPicInput: document.getElementById('fileSysPic') || document.getElementById('sysPicInput'),
        removeSysPicBtn: document.getElementById('removeSysPic') || document.getElementById('removeSysPicBtn'),
        resetSysPicPos: document.getElementById('resetSysPicPos') || document.getElementById('resetSysPicPosBtn'),
        slotSysPic: document.getElementById('slotSysPic'),
        infoSysPic: document.getElementById('infoSysPic'),
        thumbSysPic: document.getElementById('thumbSysPic'),
        metaSysPic: document.getElementById('metaSysPic')
    };

    state.images = state.images || {};
    state.images.sysPic = state.images.sysPic || {
        img: null,
        filename: null,
        thumb: null,
        info: {},
        x: 40,
        y: Math.round((state.height || 2000) - 200 - 40),
        scale: 1,
        z: 0
    };

    const textDefaultPos = [
        { x: 0.265, y: 0.825 },
        { x: 0.265, y: 0.885 },
        { x: 0.265, y: 0.945 }
    ];

    function resetTextsToDefaults(){
        for(let i = 0; i < state.texts.length; i++){
            if(textDefaultPos[i]){
                state.texts[i].x = Math.round(state.width * textDefaultPos[i].x);
                state.texts[i].y = Math.round(state.height * textDefaultPos[i].y);
            }
        }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    function canvasPointFromEvent(e){
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    canvas.addEventListener('mousedown', e=>{
        try {
            const p = canvasPointFromEvent(e);
            const size = parseInt((refs.fontSizeEl && refs.fontSizeEl.value) || 80,10) || 80;
            const font = (refs.fontSelect && refs.fontSelect.value) || 'Arial';
            const fontSpec = `${size}px "${font}"`;
            const lineHeight = Math.round(size * 1.15);
            const maxWidth = Math.max(200, state.width - 220 - 220);
            for(let i = state.texts.length - 1; i >= 0; i--){
                const t = state.texts[i];
                const block = utils.measureTextBlock(t.text, maxWidth, fontSpec, lineHeight);
                const w = block.width || maxWidth;
                const h = block.height;
                if(p.x >= t.x && p.x <= t.x + w && p.y >= t.y && p.y <= t.y + h){
                    state.dragging = { type:'text', index:i };
                    state.dragOffset.x = p.x - t.x; state.dragOffset.y = p.y - t.y;
                    return;
                }
            }
            const imgs = ['mainPic','subPic','bgPic','wmPic','sysPic'].sort((a,b)=> (state.images[b] && state.images[b].z||0)-(state.images[a] && state.images[a].z||0));
            for(const k of imgs){
                const obj = state.images[k];
                if(!obj || !obj.img) continue;
                if(k === 'subPic'){
                    const sizePx = obj.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 300;
                    if(p.x >= obj.x && p.x <= obj.x + sizePx && p.y >= obj.y && p.y <= obj.y + sizePx){
                        state.dragging = { type:'image', key:k };
                        state.dragOffset.x = p.x - obj.x; state.dragOffset.y = p.y - obj.y;
                        return;
                    }
                    continue;
                }
                let w, h;
                if(k === 'sysPic'){
                    const scale = (typeof obj.scale === 'number') ? obj.scale : 1;
                    w = (obj.img.width || 0) * scale;
                    h = (obj.img.height || 0) * scale;
                } else {
                    w = (obj.img.width || 0) * (obj.scale || 1);
                    h = (obj.img.height || 0) * (obj.scale || 1);
                }
                if(p.x >= obj.x && p.x <= obj.x + w && p.y >= obj.y && p.y <= obj.y + h){
                    state.dragging = { type:'image', key:k };
                    state.dragOffset.x = p.x - obj.x; state.dragOffset.y = p.y - obj.y;
                    return;
                }
            }
        } catch(err){
            console.error('mousedown handler error', err);
        }
    });

    canvas.addEventListener('mousemove', e=>{
        try {
            if(!state.dragging) return;
            const p = canvasPointFromEvent(e);
            if(state.dragging.type === 'text'){
                const t = state.texts[state.dragging.index];
                t.x = p.x - state.dragOffset.x; t.y = p.y - state.dragOffset.y;
            } else {
                const obj = state.images[state.dragging.key];
                obj.x = p.x - state.dragOffset.x; obj.y = p.y - state.dragOffset.y;
            }
            if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
        } catch(err){
            console.error('mousemove handler error', err);
        }
    });
    canvas.addEventListener('mouseup', ()=> state.dragging = null);
    canvas.addEventListener('mouseleave', ()=> state.dragging = null);

    canvas.addEventListener('wheel', e=>{
        try {
            e.preventDefault();
            const p = canvasPointFromEvent(e);
            const imgs = ['mainPic','subPic','bgPic','wmPic','sysPic'].sort((a,b)=> (state.images[b] && state.images[b].z||0)-(state.images[a] && state.images[a].z||0));
            for(const k of imgs){
                const obj = state.images[k];
                if(!obj || !obj.img) continue;
                if(k === 'subPic'){
                    const sizePx = obj.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 300;
                    if(p.x >= obj.x && p.x <= obj.x + sizePx && p.y >= obj.y && p.y <= obj.y + sizePx){
                        const delta = e.deltaY < 0 ? 1.06 : 0.94;
                        let newSize = Math.round(sizePx * delta);
                        if(window.APP && window.APP.subPicDefault){
                            newSize = Math.max(window.APP.subPicDefault.min, Math.min(window.APP.subPicDefault.max, newSize));
                        } else {
                            newSize = Math.max(10, Math.min(2000, newSize));
                        }
                        obj.sizePx = newSize; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); return;
                    }
                    continue;
                }
                let w, h;
                if(k === 'sysPic'){
                    const scale = (typeof obj.scale === 'number') ? obj.scale : 1;
                    w = (obj.img.width || 0) * scale;
                    h = (obj.img.height || 0) * scale;
                } else {
                    w = (obj.img.width || 0) * (obj.scale || 1);
                    h = (obj.img.height || 0) * (obj.scale || 1);
                }
                if(p.x >= obj.x && p.x <= obj.x + w && p.y >= obj.y && p.y <= obj.y + h){
                    const delta = e.deltaY < 0 ? 1.05 : 0.95;
                    obj.scale = Math.max(0.01, Math.min(40, (obj.scale || 1) * delta)); if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); return;
                }
            }
        } catch(err){
            console.error('wheel handler error', err);
        }
    }, { passive:false });

    async function detectTaintedImageCandidates() {
        const results = [];
        const keys = Object.keys(state.images || {});
        for (const k of keys) {
            const obj = state.images[k];
            if (!obj || !obj.img) { results.push({ key:k, present:false }); continue; }
            try {
                const tmp = document.createElement('canvas');
                tmp.width = Math.max(1, obj.img.width || 1);
                tmp.height = Math.max(1, obj.img.height || 1);
                const tctx = tmp.getContext('2d');
                tctx.drawImage(obj.img, 0, 0);
                tctx.getImageData(0, 0, 1, 1);
                results.push({ key: k, tainted: false, src: obj.img.src || null });
            } catch (err) {
                results.push({ key: k, tainted: true, src: obj.img && obj.img.src ? obj.img.src : null, error: err && err.message ? err.message : String(err) });
            }
        }
        return results;
    }

    function loadSysPicFromFile(file){
        if(!file) return;
        console.log('[sysPic] loadSysPicFromFile called:', file && file.name);
        const reader = new FileReader();
        reader.onload = function(ev){
            const img = new Image();
            img.onload = function(){
                try {
                    state.images.sysPic = state.images.sysPic || {};
                    state.images.sysPic.img = img;
                    state.images.sysPic.filename = file.name || 'sysPic';
                    state.images.sysPic.thumb = img.src;
                    state.images.sysPic.info = state.images.sysPic.info || {};
                    const margin = 40;
                    const targetW = Math.min(img.width, Math.round(state.width * 0.4));
                    const scale = img.width ? (targetW / img.width) : 1;
                    state.images.sysPic.scale = scale;
                    const w = Math.round(img.width * scale);
                    const h = Math.round(img.height * scale);
                    state.images.sysPic.x = margin;
                    state.images.sysPic.y = Math.round(state.height - h - margin);
                    state.images.sysPic.z = state.images.sysPic.z || 0;
                    if(refs.thumbSysPic) { try { refs.thumbSysPic.src = img.src; } catch(e){} }
                    if(refs.infoSysPic) { try { refs.infoSysPic.style.display = 'flex'; } catch(e){} }
                    if(refs.metaSysPic) { try { refs.metaSysPic.textContent = file.name || ''; } catch(e){} }
                    if(window.APP && window.APP.ui && typeof window.APP.ui.updateSlotUI === 'function'){
                        try { window.APP.ui.updateSlotUI('sysPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("sysPic") threw:', e); }
                    }
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    console.log('[sysPic] loaded and placed:', state.images.sysPic);
                } catch(err){
                    console.error('[sysPic] error in img.onload handler', err);
                }
            };
            img.onerror = function(e){
                console.error('sysPic image load error', e);
            };
            img.src = ev.target.result;
        };
        reader.onerror = function(e){
            console.error('FileReader error for sysPic', e);
        };
        reader.readAsDataURL(file);
    }
    window.loadSysPicFromFile = loadSysPicFromFile;

    function removeSysPic(){
        state.images = state.images || {};
        state.images.sysPic = state.images.sysPic || { info:{} };
        if(state.images && state.images.sysPic){
            state.images.sysPic.img = null;
            state.images.sysPic.filename = null;
            state.images.sysPic.thumb = null;
            state.images.sysPic.x = 40;
            state.images.sysPic.y = Math.round((state.height || 2000) - 200 - 40);
            state.images.sysPic.scale = 1;
            if(refs.thumbSysPic) { try { refs.thumbSysPic.src = ''; } catch(e){} }
            if(refs.infoSysPic) { try { refs.infoSysPic.style.display = 'none'; } catch(e){} }
            if(refs.metaSysPic) { try { refs.metaSysPic.textContent = ''; } catch(e){} }
            if(window.APP && window.APP.ui && typeof window.APP.ui.updateSlotUI === 'function'){
                try { window.APP.ui.updateSlotUI('sysPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("sysPic") threw:', e); }
            }
            if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
        }
    }
    window.removeSysPic = removeSysPic;

    function resetSysPicToDefault(){
        state.images = state.images || {};
        state.images.sysPic = state.images.sysPic || { info:{} };
        const sysPic = state.images.sysPic;
        if(!sysPic.img){
            const margin = 40;
            sysPic.x = margin;
            sysPic.y = Math.round(state.height - 200 - margin);
            sysPic.scale = 1;
            state.images.sysPic = sysPic;
            if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            return;
        }
        const img = sysPic.img;
        const margin = 40;
        const targetW = Math.min(img.width, Math.round(state.width * 0.4));
        const scale = img.width ? (targetW / img.width) : 1;
        sysPic.scale = scale;
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        sysPic.x = margin;
        sysPic.y = Math.round(state.height - h - margin);
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }
    window.resetSysPicToDefault = resetSysPicToDefault;

    (function setupExportHandler(){
        if(!refs.exportBtn) return;
        try {
            const original = refs.exportBtn;
            const clone = original.cloneNode(true);
            original.parentNode && original.parentNode.replaceChild(clone, original);
            refs.exportBtn = clone;
        } catch(e){
            // ignore
        }
        const btn = refs.exportBtn;
        let exporting = false;
        let lastTaintedNotice = 0;
        const taintedNoticeCooldown = 5000;
        btn.addEventListener('click', async function exportHandler(e){
            if(exporting){
                console.log('[export] already exporting, ignoring click');
                return;
            }
            exporting = true;
            btn.disabled = true;
            try {
                if(document.fonts && document.fonts.ready){
                    try { await document.fonts.ready; } catch(e){ /* ignore font readiness errors */ }
                }
                if(window.APP && typeof window.APP.draw === 'function'){
                    await window.APP.draw();
                }
                const fmt = (refs.formatSel && refs.formatSel.value) || 'image/png';
                if(fmt === 'gif' && window.APP && window.APP.ui && typeof window.APP.ui.exportCanvasImage === 'function'){
                    try { await window.APP.ui.exportCanvasImage(); } catch(e){ /* ignore */ }
                    exporting = false;
                    btn.disabled = false;
                    return;
                }
                const diag = await detectTaintedImageCandidates();
                const taintedEntries = diag.filter(d => d.tainted);
                if(taintedEntries.length > 0){
                    console.warn('[export] Detected tainted canvas(s). Attempting CORS reload for external images...');
                    const reloadPromises = taintedEntries.map(async (entry) => {
                        if(!entry.src) return;
                        try {
                            const img = new Image();
                            img.crossOrigin = 'anonymous';
                            await new Promise((resolve, reject) => {
                                img.onload = resolve;
                                img.onerror = reject;
                                img.src = entry.src;
                            });
                            if(entry.key === 'sysPic' && state.images.sysPic){
                                state.images.sysPic.img = img;
                                state.images.sysPic._isDefault = false;
                                state.images.sysPic._preventDefault = false;
                                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                            }
                        } catch(err){
                            console.warn(`[export] CORS reload failed for ${entry.key} (${entry.src}):`, err);
                        }
                    });
                    await Promise.allSettled(reloadPromises);
                    if(window.APP && typeof window.APP.draw === 'function') await window.APP.draw();
                }
                if(typeof canvas.toBlob === 'function'){
                    try {
                        await new Promise((resolve, reject) => {
                            canvas.toBlob(function(blob){
                                if(!blob) return reject(new Error('toBlob returned null'));
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = (fmt === 'image/jpeg') ? 'display.jpg' : 'display.png';
                                document.body.appendChild(a);
                                a.click();
                                a.remove();
                                setTimeout(()=> URL.revokeObjectURL(url), 2000);
                                resolve();
                            }, fmt === 'image/jpeg' ? 'image/jpeg' : 'image/png', fmt === 'image/jpeg' ? 0.92 : undefined);
                        });
                        console.log('[export] success via toBlob');
                        exporting = false;
                        btn.disabled = false;
                        return;
                    } catch(err) {
                        console.warn('[export] toBlob failed or returned null', err);
                    }
                }
                try {
                    const data = (fmt === 'image/jpeg') ? canvas.toDataURL('image/jpeg', 0.92) : canvas.toDataURL('image/png');
                    const a = document.createElement('a');
                    a.href = data;
                    a.download = (fmt === 'image/jpeg') ? 'display.jpg' : 'display.png';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    console.log('[export] success via toDataURL');
                    exporting = false;
                    btn.disabled = false;
                    return;
                } catch(errToData) {
                    console.error('[export] toDataURL failed', errToData);
                    const now = Date.now();
                    if(errToData && (errToData.name === 'SecurityError' || (errToData.message && errToData.message.indexOf('Tainted canvases') !== -1))){
                        if(now - lastTaintedNotice > taintedNoticeCooldown){
                            lastTaintedNotice = now;
                            alert('エクスポートに失敗しました（セキュリティ制約）。外部リソースやフォントが原因の可能性があります。コンソールを確認してください。');
                            console.warn('[export] Detected tainted canvas. Running diagnostics...');
                        } else {
                            console.log('[export] tainted canvas detected but notice suppressed by cooldown');
                        }
                    } else {
                        alert('エクスポートに失敗しました。コンソールを確認してください。');
                    }
                }
                console.log('[export] running per-image taint detection (diagnostic only)...');
                console.table(diag);
                console.error('[export] export failed after diagnostics. CORS reload attempted for tainted images.');
            } catch(err){
                console.error('[export] unexpected error', err);
                alert('エクスポート中に予期しないエラーが発生しました。コンソールを確認してください。');
            } finally {
                exporting = false;
                btn.disabled = false;
            }
        }, { once: false });
    })();

    function downloadDataURL(dataURL, filename){ const a = document.createElement('a'); a.href = dataURL; a.download = filename; document.body.appendChild(a); a.click(); a.remove(); }

    if(refs.subPicCropY) refs.subPicCropY.addEventListener('input', ()=>{ state.images.subPic.crop.cy = parseInt(refs.subPicCropY.value,10)/100; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.subPicZoom) refs.subPicZoom.addEventListener('input', ()=>{ const pct = parseInt(refs.subPicZoom.value,10); if(refs.subPicZoomVal) refs.subPicZoomVal.textContent = pct + '%'; state.images.subPic.zoom = pct/100; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.subPicBorder) refs.subPicBorder.addEventListener('input', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.resetSubPicPos) refs.resetSubPicPos.addEventListener('click', ()=>{ state.images.subPic.x = window.APP.subPicDefault.x; state.images.subPic.y = window.APP.subPicDefault.y; state.images.subPic.sizePx = window.APP.subPicDefault.sizePx; state.images.subPic.crop = {cx:0.5,cy:0.33}; state.images.subPic.zoom = 1.0; state.images.subPic.bgOpacity = 1.0; if(refs.subPicCropY) refs.subPicCropY.value = 33; if(refs.subPicZoom) refs.subPicZoom.value = 100; if(refs.subPicZoomVal) refs.subPicZoomVal.textContent='100%'; if(refs.bgSubPic) refs.bgSubPic.value = '#FFFF00'; if(refs.bgSubPicAlpha) refs.bgSubPicAlpha.value = 100; if(refs.bgSubPicAlphaVal) refs.bgSubPicAlphaVal.textContent = '100%'; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });

    if(refs.text1El) refs.text1El.addEventListener('input', ()=>{ state.texts[0].text = refs.text1El.value; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.text2El) refs.text2El.addEventListener('input', ()=>{ state.texts[1].text = refs.text2El.value; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.text3El) refs.text3El.addEventListener('input', ()=>{ state.texts[2].text = refs.text3El.value; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });

    if(refs.bgSubPic) refs.bgSubPic.addEventListener('input', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.bgSubPicAlpha) refs.bgSubPicAlpha.addEventListener('input', ()=>{ state.images.subPic.bgOpacity = parseInt(refs.bgSubPicAlpha.value,10)/100; if(refs.bgSubPicAlphaVal) refs.bgSubPicAlphaVal.textContent = refs.bgSubPicAlpha.value + '%'; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.bandColor) refs.bandColor.addEventListener('input', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.bandHeight) refs.bandHeight.addEventListener('input', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.fontSelect) refs.fontSelect.addEventListener('change', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.fontSizeEl) refs.fontSizeEl.addEventListener('input', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.fontColorEl) refs.fontColorEl.addEventListener('input', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });

    if(refs.wmPicOpacity) refs.wmPicOpacity.addEventListener('input', ()=>{ state.images.wmPic.opacity = parseInt(refs.wmPicOpacity.value,10)/100; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });

    if(refs.resetMainPicPos) refs.resetMainPicPos.addEventListener('click', ()=>{ state.images.mainPic.x = window.APP.refPos.mainPic.x; state.images.mainPic.y = window.APP.refPos.mainPic.y; if(typeof state.images.mainPic.initialScale==='number') state.images.mainPic.scale = state.images.mainPic.initialScale; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.resetBgPicPos) refs.resetBgPicPos.addEventListener('click', ()=>{ if(state.images.bgPic.img && window.APP && window.APP.ui && typeof window.APP.ui.fitBgPicToCanvas === 'function') window.APP.ui.fitBgPicToCanvas(state.images.bgPic.img); if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });

    if(refs.resetWmPicPos) refs.resetWmPicPos.addEventListener('click', ()=>{
        const wmPic = state.images.wmPic;
        const verticalOffset = 80;
        if(wmPic.img){
            const targetRatio = 0.5;
            const targetW = Math.round(state.width * targetRatio);
            const scale = wmPic.img.width ? (targetW / wmPic.img.width) : 1;
            wmPic.scale = scale;
            const w5 = wmPic.img.width * scale;
            const h5 = wmPic.img.height * scale;
            wmPic.x = Math.round((state.width - w5) / 2);
            wmPic.y = Math.round((state.height / 2) - (h5 / 2) + verticalOffset);
        } else {
            wmPic.x = Math.round(state.width / 2);
            wmPic.y = Math.round((state.height / 2) + verticalOffset);
            wmPic.scale = 1;
        }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    });

    function ensureSysPicUIBindings(){
        try {
            state.images = state.images || {};
            state.images.sysPic = state.images.sysPic || { img:null, filename:null, thumb:null, info:{}, x:40, y: Math.round((state.height || 2000) - 200 - 40), scale:1, z:0 };
            const slot = refs.slotSysPic || document.getElementById('slotSysPic');
            const input = refs.sysPicInput || document.getElementById('sysPicInput');
            const removeBtn = refs.removeSysPicBtn || document.getElementById('removeSysPicBtn');
            const resetBtn = refs.resetSysPicPos || document.getElementById('resetSysPicPos');
            const info = refs.infoSysPic || document.getElementById('infoSysPic');
            const thumb = refs.thumbSysPic || document.getElementById('thumbSysPic');
            const meta = refs.metaSysPic || document.getElementById('metaSysPic');
            if(input && !input._sysPicChangeBound){
                input.addEventListener('change', (ev)=>{
                    const f = ev.target.files && ev.target.files[0];
                    if(!f) return;
                    if(typeof loadSysPicFromFile === 'function'){
                        loadSysPicFromFile(f);
                    }
                    ev.target.value = '';
                });
                input._sysPicChangeBound = true;
            }
            if(removeBtn && !removeBtn._bound){
                removeBtn.addEventListener('click', ()=> removeSysPic());
                removeBtn._bound = true;
            }
            if(resetBtn && !resetBtn._bound){
                resetBtn.addEventListener('click', ()=> resetSysPicToDefault());
                resetBtn._bound = true;
            }
            const sampleBtn = document.querySelector('button[id^="resetPic"]') || document.querySelector('button');
            if(sampleBtn && removeBtn && resetBtn){
                removeBtn.className = sampleBtn.className;
                resetBtn.className = sampleBtn.className;
                if(input) input.className = (sampleBtn.className || '') + ' file-input';
            }
        } catch(err){
            console.warn('[sysPic] ensureSysPicUIBindings error', err);
        }
    }

    (function loadDefaultWatermark(){
        const defaultWmPath = 'assets/sign.png';
        const img = new Image();
        img.onload = function(){
            try {
                state.images.wmPic.img = img;
                state.images.wmPic.filename = 'sign.png';
                const targetRatio = 0.5;
                const targetW = Math.round(state.width * targetRatio);
                const scale = img.width ? (targetW / img.width) : 1;
                state.images.wmPic.scale = scale;
                const w5 = img.width * scale;
                const h5 = img.height * scale;
                const verticalOffset = 80;
                state.images.wmPic.x = Math.round((state.width - w5) / 2);
                state.images.wmPic.y = Math.round((state.height / 2) - (h5 / 2) + verticalOffset);
                state.images.wmPic.thumb = img.src;
                if(window.APP && window.APP.ui && typeof window.APP.ui.updateSlotUI === 'function'){
                    try { window.APP.ui.updateSlotUI('wmPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("wmPic") threw:', e); }
                }
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(err){
                console.error('applyImageToState error', err);
            }
        };
        img.onerror = function(e){
            console.error('Default watermark load failed for', defaultWmPath, e);
            try {
                state.images.wmPic.img = null;
                state.images.wmPic.thumb = null;
                state.images.wmPic.filename = null;
                if(window.APP && window.APP.ui && typeof window.APP.ui.updateSlotUI === 'function'){
                    try { window.APP.ui.updateSlotUI('wmPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("wmPic") threw:', e); }
                }
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(err){ console.error('fallback handling error', err); }
        };
        img.src = defaultWmPath;
    })();

    function setTextDefaultsToImage(imageKey, options){
        options = options || {};
        const anchor = options.anchor || 'below';
        const gapX = (typeof options.gapX === 'number') ? options.gapX : 20;
        const gapY = (typeof options.gapY === 'number') ? options.gapY : 12;
        const imgObj = state.images[imageKey];
        if(!imgObj || !imgObj.img) return;
        let imgX = imgObj.x || 0;
        let imgY = imgObj.y || 0;
        let imgW, imgH;
        if(imageKey === 'subPic'){
            imgW = imgObj.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 300;
            imgH = imgW;
        } else {
            const scale = imgObj.scale || 1;
            imgW = Math.round((imgObj.img.width || 0) * scale);
            imgH = Math.round((imgObj.img.height || 0) * scale);
        }
        let baseX = imgX;
        let baseY = imgY;
        if(anchor === 'top-left'){
            baseX = imgX + gapX;
            baseY = imgY + gapY;
        } else if(anchor === 'right'){
            baseX = imgX + imgW + gapX;
            baseY = imgY + gapY;
        } else {
            baseX = imgX + gapX;
            baseY = imgY + imgH + gapY;
        }
        const size = (ui && ui.refs && ui.refs.fontSizeEl) ? (parseInt(ui.refs.fontSizeEl.value,10) || 80) : 80;
        const lineHeight = Math.round(size * 1.15);
        const blockGap = Math.round(lineHeight * 0.6);
        for(let i = 0; i < state.texts.length; i++){
            state.texts[i].x = baseX;
            state.texts[i].y = baseY + i * (lineHeight + blockGap);
        }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    (function init(){
        try {
            if(refs.text1El) refs.text1El.value = state.texts[0].text;
            if(refs.text2El) refs.text2El.value = state.texts[1].text;
            if(refs.text3El) refs.text3El.value = state.texts[2].text;
            if(window.APP && window.APP.ui && typeof window.APP.ui.updateSlotUI === 'function'){
                try { window.APP.ui.updateSlotUI('mainPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("mainPic") threw:', e); }
                try { window.APP.ui.updateSlotUI('subPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("subPic") threw:', e); }
                try { window.APP.ui.updateSlotUI('bgPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("bgPic") threw:', e); }
                try { window.APP.ui.updateSlotUI('wmPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("wmPic") threw:', e); }
                try { window.APP.ui.updateSlotUI('sysPic'); } catch(e){ console.warn('[app-interactions] updateSlotUI("sysPic") threw:', e); }
            }
            if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
        } catch(err){
            console.error('init error', err);
        }
        resetTextsToDefaults();
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
        const resetTextPosBtn = document.getElementById('resetTextPosBtn');
        if(resetTextPosBtn){
            resetTextPosBtn.addEventListener('click', ()=>{ resetTextsToDefaults(); });
        }
        ensureSysPicUIBindings();
    })();
})();