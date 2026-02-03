// app-ui.js

(function(){
    const state = window.APP.state;
    const utils = window.APP.utils;

    function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }
    function safeRound(v){ return Math.round(v || 0); }

    const fileMainPic = document.getElementById('fileMainPic');
    const fileSubPic = document.getElementById('fileSubPic');
    const fileBgPic = document.getElementById('fileBgPic');
    const fileWmPic = document.getElementById('fileWmPic');
    const sysPicInput = document.getElementById('fileSysPic') || document.getElementById('sysPicInput');

    const slotMainPic = document.getElementById('slotMainPic');
    const slotSubPic = document.getElementById('slotSubPic');
    const slotBgPic = document.getElementById('slotBgPic');
    const slotWmPic = document.getElementById('slotWmPic');
    const slotSysPic = document.getElementById('slotSysPic');

    const resetMainPicPos = document.getElementById('resetMainPicPos');
    const resetSubPicPos = document.getElementById('resetSubPicPos');
    const resetBgPicPos = document.getElementById('resetBgPicPos');
    const resetWmPicPos = document.getElementById('resetWmPicPos');
    const resetSysPicPos = document.getElementById('resetSysPicPos') || document.getElementById('resetSysPicPosBtn');
    const removeSysPicBtn = document.getElementById('removeSysPic') || document.getElementById('removeSysPicBtn');

    const subPicCropY = document.getElementById('subPicCropY');
    const subPicZoom = document.getElementById('subPicZoom');
    const subPicZoomVal = document.getElementById('subPicZoomVal');
    const subPicBorder = document.getElementById('subPicBorder');
    const subPicBorderColor = document.getElementById('subPicBorderColor');
    const centerTopBtn = document.getElementById('centerTopBtn');

    const subPicCropX = document.getElementById('subPicCropX');

    const subPicShapeCircle = document.getElementById('subPicShapeCircle');
    const subPicShapeDiamond = document.getElementById('subPicShapeDiamond');
    const subPicShapeHeart = document.getElementById('subPicShapeHeart');

    const bandColor = document.getElementById('bandColor');
    const bandHeight = document.getElementById('bandHeight');
    const bandOrientHorizontal = document.getElementById('bandOrientHorizontal');
    const bandOrientVertical = document.getElementById('bandOrientVertical');

    const bgSubPic = document.getElementById('bgSubPic');
    const bgSubPicAlpha = document.getElementById('bgSubPicAlpha');
    const bgSubPicAlphaVal = document.getElementById('bgSubPicAlphaVal');

    const aspectLandscape = document.getElementById('aspectLandscape');
    const aspectSquare = document.getElementById('aspectSquare');
    const aspectPortrait = document.getElementById('aspectPortrait');

    const text1El = document.getElementById('text1');
    const text2El = document.getElementById('text2');
    const text3El = document.getElementById('text3');
    const fontSelect = document.getElementById('fontSelect');
    const fontSizeEl = document.getElementById('fontSize');
    const fontColorEl = document.getElementById('fontColor');

    const exportBtn = document.getElementById('exportBtn');
    const formatSel = document.getElementById('format');

    const infoMainPic = document.getElementById('infoMainPic');
    const infoSubPic = document.getElementById('infoSubPic');
    const infoBgPic = document.getElementById('infoBgPic');
    const infoWmPic = document.getElementById('infoWmPic');
    const infoSysPic = document.getElementById('infoSysPic');

    const thumbMainPic = document.getElementById('thumbMainPic');
    const thumbSubPic = document.getElementById('thumbSubPic');
    const thumbBgPic = document.getElementById('thumbBgPic');
    const thumbWmPic = document.getElementById('thumbWmPic');
    const thumbSysPic = document.getElementById('thumbSysPic');

    const metaMainPic = document.getElementById('metaMainPic');
    const metaSubPic = document.getElementById('metaSubPic');
    const metaBgPic = document.getElementById('metaBgPic');
    const metaWmPic = document.getElementById('metaWmPic');
    const metaSysPic = document.getElementById('metaSysPic');

    const removeMainPic = document.getElementById('removeMainPic');
    const removeSubPic = document.getElementById('removeSubPic');
    const removeBgPic = document.getElementById('removeBgPic');
    const removeWmPic = document.getElementById('removeWmPic');
    const removeSysPic = document.getElementById('removeSysPic') || document.getElementById('removeSysPicBtn') || removeSysPicBtn;

    const wmPicOpacity = document.getElementById('wmPicOpacity');

    const sysLogoCandidates = [
        './assets/sys.png',
        '/assets/sys.png',
        './asset/sys.png',
        '/asset/sys.png',
        'assets/sys.png',
        'asset/sys.png'
    ];
    const sysLogoFilename = 'sys.png';

    function computeSubPicSizePx(){
        return (state.images && state.images.subPic && state.images.subPic.sizePx) || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 200;
    }

    function clearWmPicState(inputEl){
        state.images = state.images || {};
        state.images.wmPic = { _preventDefault: true };
        try { if(inputEl && typeof inputEl.value !== 'undefined') inputEl.value = ''; } catch(e){ /* ignore */ }
    }

    function allowWmPicDefault(){
        state.images = state.images || {};
        state.images.wmPic = state.images.wmPic || {};
        state.images.wmPic._preventDefault = false;
    }

    function ensureDefaultSysPic(){
        try {
            state.images = state.images || {};
            state.images.sysPic = state.images.sysPic || {};
            if (state.images.sysPic.img && state.images.sysPic.filename && state.images.sysPic._isDefault !== true) {
                return;
            }
            if (state.images.sysPic._preventDefault) return;
            if (state.images.sysPic._isDefault) return;
            let idx = 0;
            function tryNext(){
                if (idx >= sysLogoCandidates.length) {
                    console.warn('Default system logo not found in any candidate paths.');
                    return;
                }
                const path = sysLogoCandidates[idx++];
                const img = new Image();
                img.crossOrigin = 'anonymous';
                img.onload = function(){
                    state.images = state.images || {};
                    state.images.sysPic = state.images.sysPic || {};
                    state.images.sysPic.img = img;
                    state.images.sysPic.filename = sysLogoFilename;
                    state.images.sysPic.thumb = null;
                    state.images.sysPic._isDefault = true;
                    state.images.sysPic._preventDefault = false;
                    const margin = 40;
                    const targetW = Math.min(img.width, Math.round(state.width * 0.4));
                    const scale = img.width ? (targetW / img.width) : 1;
                    state.images.sysPic.scale = scale;
                    const w = Math.round(img.width * scale);
                    const h = Math.round(img.height * scale);
                    state.images.sysPic.x = margin;
                    state.images.sysPic.y = Math.round(state.height - h - margin);
                    state.images.sysPic.z = 0;
                    try { updateSlotUI('sysPic'); } catch(e){ /* ignore */ }
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    try {
                        if (window.APP && window.APP.state && window.APP.state.dragging) {
                            window.APP.state.dragging = null;
                        }
                    } catch(e){ /* ignore */ }
                };
                img.onerror = function(){
                    tryNext();
                };
                img.src = path;
            }
            tryNext();
        } catch(e){
            console.warn('ensureDefaultSysPic error', e);
        }
    }

    function updateSubPicCropSliders(){
        try {
            state.images = state.images || {};
            const subPic = state.images.subPic || {};
            const sizePx = computeSubPicSizePx();
            if(subPicCropX){
                subPicCropX.min = 0;
                subPicCropX.max = 100;
                subPicCropX.step = 1;
                const curCx = (subPic.crop && typeof subPic.crop.cx === 'number') ? subPic.crop.cx : 0.5;
                const pct = Math.round(curCx * 100);
                subPicCropX.value = pct;
                subPicCropX.disabled = !(subPic && subPic.img);
            }
            if(subPicCropY){
                const minY = 0;
                const maxY = 100;
                subPicCropY.min = minY;
                subPicCropY.max = maxY;
                subPicCropY.step = 1;
                let curY;
                if (subPic.crop && typeof subPic.crop.cy === 'number') {
                    curY = Math.round(subPic.crop.cy * 100);
                } else {
                    curY = 33;
                }
                curY = Math.max(minY, Math.min(maxY, curY));
                subPicCropY.value = curY;
                subPicCropY.disabled = !(subPic && subPic.img);
                
                if (subPic && subPic.crop && subPic.img) {
                    if (typeof subPic.crop.cy === 'number') {
                        subPic.crop.cy = curY / 100;
                    }
                }
            }
            if (subPic && typeof subPic.borderWidth === 'number' && subPicBorder) {
                subPicBorder.value = subPic.borderWidth;
            }
            if (subPic && typeof subPic.borderColor === 'string' && subPicBorderColor) {
                subPicBorderColor.value = subPic.borderColor;
            }

            const hasImg = !!(subPic && subPic.img);
            if(subPicZoom){
                subPicZoom.disabled = !hasImg;
                if(!hasImg){
                    subPicZoom.classList.add('disabled');
                } else {
                    subPicZoom.classList.remove('disabled');
                }
            }
            if(subPicZoomVal){
                if(!hasImg){
                    subPicZoomVal.textContent = '—';
                } else {
                    subPicZoomVal.textContent = Math.round((subPic.zoom || 1.0) * 100) + '%';
                }
            }
        } catch(e){
            console.warn('updateSubPicCropSliders error', e);
        }
    }

    function updateSlidersFromState(){
        try { updateSubPicCropSliders(); } catch(e){ /* ignore */ }
        try {
            const subPic = (state.images && state.images.subPic) ? state.images.subPic : {};
            if(subPicZoom){
                const pct = Math.round((subPic.zoom || 1.0) * 100);
                subPicZoom.value = pct;
            }
            if(subPicZoomVal){
                subPicZoomVal.textContent = Math.round((subPic.zoom || 1.0) * 100) + '%';
            }
            if(subPicBorder && typeof subPic.borderWidth === 'number'){
                subPicBorder.value = subPic.borderWidth;
            }
            if(bgSubPic && typeof subPic.bgColor === 'string'){
                bgSubPic.value = subPic.bgColor;
            }
            if(bgSubPicAlpha){
                const pct = Math.round(((typeof subPic.bgOpacity === 'number') ? subPic.bgOpacity : 1.0) * 100);
                bgSubPicAlpha.value = pct;
                if(bgSubPicAlphaVal) bgSubPicAlphaVal.textContent = pct + '%';
            }
            const wmPic = (state.images && state.images.wmPic) ? state.images.wmPic : {};
            if(wmPicOpacity && typeof wmPic.opacity === 'number'){
                wmPicOpacity.value = Math.round(wmPic.opacity * 100);
            }
            if(bandHeight && state.ui && typeof state.ui.bandHeight === 'number'){
                bandHeight.value = state.ui.bandHeight;
            }
            if(bandColor && state.ui && typeof state.ui.bandColor === 'string'){
                bandColor.value = state.ui.bandColor;
            }
            if(fontSizeEl && state.ui && typeof state.ui.fontSize === 'number'){
                fontSizeEl.value = state.ui.fontSize;
            }
            if(fontColorEl && state.ui && typeof state.ui.fontColor === 'string'){
                fontColorEl.value = state.ui.fontColor;
            }
            // テキスト要素の値を復元
            if(text1El && state.texts && state.texts[0]){
                text1El.value = state.texts[0].text || '';
            }
            if(text2El && state.texts && state.texts[1]){
                text2El.value = state.texts[1].text || '';
            }
            if(text3El && state.texts && state.texts[2]){
                text3El.value = state.texts[2].text || '';
            }
        } catch(e){
            console.warn('updateSlidersFromState error', e);
        }
    }

    if(subPicCropX && !subPicCropX._bound){
        subPicCropX.addEventListener('input', function(){
            try {
                state.images = state.images || {};
                state.images.subPic = state.images.subPic || {};
                const v = parseInt(subPicCropX.value, 10) || 50;
                const cx = Math.max(0, Math.min(100, v)) / 100;
                state.images.subPic.crop = state.images.subPic.crop || {};
                state.images.subPic.crop.cx = cx;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('subPicCropX input error', e);
            }
        });
        subPicCropX._bound = true;
    }

    if(subPicCropY && !subPicCropY._boundByThis){
        subPicCropY.addEventListener('input', function(){
            try {
                state.images = state.images || {};
                state.images.subPic = state.images.subPic || {};
                const y = parseInt(subPicCropY.value, 10) || 0;
                state.images.subPic.crop = state.images.subPic.crop || {};
                state.images.subPic.crop.cy = y / 100;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('subPicCropY input error', e);
            }
        });
        subPicCropY._boundByThis = true;
    }

    function setSubPicShape(shape){
        state.images = state.images || {};
        state.images.subPic = state.images.subPic || {};
        state.images.subPic.crop = state.images.subPic.crop || {};
        state.images.subPic.crop.shape = (shape === 'diamond' || shape === 'heart') ? shape : 'circle';
        if (state.images.subPic.crop.shape === 'diamond') {
            if (subPicShapeDiamond) subPicShapeDiamond.checked = true;
            if (subPicShapeCircle) subPicShapeCircle.checked = false;
            if (subPicShapeHeart) subPicShapeHeart.checked = false;
        } else if (state.images.subPic.crop.shape === 'heart') {
            if (subPicShapeHeart) subPicShapeHeart.checked = true;
            if (subPicShapeCircle) subPicShapeCircle.checked = false;
            if (subPicShapeDiamond) subPicShapeDiamond.checked = false;
        } else {
            if (subPicShapeCircle) subPicShapeCircle.checked = true;
            if (subPicShapeDiamond) subPicShapeDiamond.checked = false;
            if (subPicShapeHeart) subPicShapeHeart.checked = false;
        }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    if(subPicShapeCircle && !subPicShapeCircle._bound){
        subPicShapeCircle.addEventListener('change', function(){
            if(this.checked) setSubPicShape('circle');
        });
        subPicShapeCircle._bound = true;
    }
    if(subPicShapeDiamond && !subPicShapeDiamond._bound){
        subPicShapeDiamond.addEventListener('change', function(){
            if(this.checked) setSubPicShape('diamond');
        });
        subPicShapeDiamond._bound = true;
    }
    if(subPicShapeHeart && !subPicShapeHeart._bound){
        subPicShapeHeart.addEventListener('change', function(){
            if(this.checked) setSubPicShape('heart');
        });
        subPicShapeHeart._bound = true;
    }

    if(subPicBorder && !subPicBorder._bound){
        subPicBorder.addEventListener('input', function(){
            try {
                state.images = state.images || {};
                state.images.subPic = state.images.subPic || {};
                const w = Math.max(0, Math.min(100, parseInt(subPicBorder.value,10) || 0));
                state.images.subPic.borderWidth = w;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('subPicBorder input error', e);
            }
        });
        subPicBorder._bound = true;
    }

    if(subPicBorderColor && !subPicBorderColor._bound){
        subPicBorderColor.addEventListener('input', function(){
            try {
                state.images = state.images || {};
                state.images.subPic = state.images.subPic || {};
                const c = (subPicBorderColor.value || '#000000').toString();
                state.images.subPic.borderColor = c;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('subPicBorderColor input error', e);
            }
        });
        subPicBorderColor._bound = true;
    }

    if(bandHeight && !bandHeight._bound){
        bandHeight.addEventListener('input', function(){
            try {
                state.ui = state.ui || {};
                const h = Math.max(0, Math.min(300, parseInt(bandHeight.value,10) || 0));
                state.ui.bandHeight = h;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('bandHeight input error', e);
            }
        });
        bandHeight.addEventListener('change', function(){
            if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
        });
        bandHeight._bound = true;
    }

    if(bgSubPic && !bgSubPic._bound){
        bgSubPic.addEventListener('input', function(){
            try {
                state.images = state.images || {};
                state.images.subPic = state.images.subPic || {};
                const c = (bgSubPic.value || '#FFFF00').toString();
                state.images.subPic.bgColor = c;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('bgSubPic input error', e);
            }
        });
        bgSubPic.addEventListener('change', function(){
            if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
        });
        bgSubPic._bound = true;
    }

    if(bandColor && !bandColor._bound){
        bandColor.addEventListener('input', function(){
            try {
                state.ui = state.ui || {};
                state.ui.bandColor = bandColor.value;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('bandColor input error', e);
            }
        });
        bandColor.addEventListener('change', function(){
            if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
        });
        bandColor._bound = true;
    }

    if(fontColorEl && !fontColorEl._bound){
        fontColorEl.addEventListener('input', function(){
            try {
                state.ui = state.ui || {};
                state.ui.fontColor = fontColorEl.value;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(e){
                console.warn('fontColorEl input error', e);
            }
        });
        fontColorEl.addEventListener('change', function(){
            if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
        });
        fontColorEl._bound = true;
    }

    function setBandOrientation(orient){
        state.ui = state.ui || {};
        state.ui.bandOrientation = (orient === 'vertical') ? 'vertical' : 'horizontal';
        if(state.ui.bandOrientation === 'vertical'){
            if(bandOrientVertical) bandOrientVertical.checked = true;
            if(bandOrientHorizontal) bandOrientHorizontal.checked = false;
        } else {
            if(bandOrientHorizontal) bandOrientHorizontal.checked = true;
            if(bandOrientVertical) bandOrientVertical.checked = false;
        }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    if(bandOrientHorizontal && !bandOrientHorizontal._bound){
        bandOrientHorizontal.addEventListener('change', function(){
            if(this.checked) setBandOrientation('horizontal');
        });
        bandOrientHorizontal._bound = true;
    }
    if(bandOrientVertical && !bandOrientVertical._bound){
        bandOrientVertical.addEventListener('change', function(){
            if(this.checked) setBandOrientation('vertical');
        });
        bandOrientVertical._bound = true;
    }

    function syncHistoryForImageKeys(keys){
        if(!window.APP || !window.APP.history || !window.APP.state) return;
        const history = window.APP.history;
        const currentImages = window.APP.state.images || {};
        const syncOne = (stack)=>{
            if(!Array.isArray(stack)) return;
            stack.forEach(entry=>{
                if(!entry || !entry.images) return;
                keys.forEach(k=>{
                    const cur = currentImages[k] || {};
                    const cloned = JSON.parse(JSON.stringify(cur));
                    if(cloned && Object.prototype.hasOwnProperty.call(cloned, 'img')) cloned.img = null;
                    entry.images[k] = cloned;
                });
            });
        };
        syncOne(history.undoStack);
        syncOne(history.redoStack);
        history.updateHistoryUI();
    }

    function setupSlot(slotEl, inputEl, key, infoEl, thumbEl, metaEl, removeBtn){
        if(!slotEl || !inputEl) return;
        if(!slotEl._clickBound){
            slotPicClickBind(slotEl, inputEl);
        }
        if(!inputEl._changeBound){
            inputEl.addEventListener('change', e=>{
                const f = e.target.files && e.target.files[0];
                if(!f) return;
                if(key === 'wmPic') {
                    clearWmPicState(inputEl);
                    allowWmPicDefault();
                }
                utils.loadImageFromFile(f, (img, dataURL)=>{
                    state.images = state.images || {};
                    state.images[key] = state.images[key] || {};
                    state.images[key].img = img;
                    state.images[key].filename = f.name;
                    state.images[key].thumb = dataURL;
                    if (key === 'sysPic') {
                        state.images.sysPic._isDefault = false;
                        state.images.sysPic._preventDefault = false;
                    }
                    if(key === 'bgPic') {
                        fitBgPicToCanvas(img);
                    } else if(key === 'mainPic') {
                        const targetW = state.width / 2.2;
                        const computedScale = Math.min(Math.max(0.1, targetW / img.width), 5);
                        state.images.mainPic.scale = computedScale;
                        state.images.mainPic.initialScale = computedScale;
                        state.images.mainPic.x = window.APP.refPos && window.APP.refPos.mainPic ? window.APP.refPos.mainPic.x : (state.width/2 - (img.width*computedScale)/2);
                        state.images.mainPic.y = window.APP.refPos && window.APP.refPos.mainPic ? window.APP.refPos.mainPic.y : (state.height/2 - (img.height*computedScale)/2);
                    } else if(key === 'subPic') {
                        state.images.subPic.sizePx = state.images.subPic.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 200;
                        state.images.subPic.crop = state.images.subPic.crop || {};
                        
                        if(typeof state.images.subPic.x !== 'number') {
                            state.images.subPic.x = Math.round(state.width * 0.05);
                        }
                        if(typeof state.images.subPic.y !== 'number') {
                            state.images.subPic.y = Math.round(state.height * 0.08);
                        }
                        
                        if(typeof state.images.subPic.crop.cx !== 'number') {
                            state.images.subPic.crop.cx = 0.5;
                        }
                        if(typeof state.images.subPic.crop.cy !== 'number') {
                            state.images.subPic.crop.cy = 0.33;
                        }
                        
                        if(typeof state.images.subPic.crop.shape !== 'string') state.images.subPic.crop.shape = 'circle';
                        if(typeof state.images.subPic.borderWidth !== 'number') state.images.subPic.borderWidth = (subPicBorder ? parseInt(subPicBorder.value,10) || 0 : 0);
                        if(typeof state.images.subPic.borderColor !== 'string') state.images.subPic.borderColor = (subPicBorderColor ? subPicBorderColor.value || '#000000' : '#000000');
                        try { updateSubPicCropSliders(); } catch(e){ /* ignore */ }
                    } else if(key === 'wmPic') {
                         const canvasW = Math.max(1, state.width || 2000);
                        const canvasH = Math.max(1, state.height || 2000);
                        const targetW = Math.round(canvasW * 0.5);
                        const scale = img.width ? (targetW / img.width) : 1;
                        const w5 = safeRound(img.width * scale);
                        const h5 = safeRound(img.height * scale);
                        const centerX = safeRound((canvasW - w5) / 2);
                        const centerY = safeRound((canvasH - h5) / 2);
                        const verticalOffset = 80;
                        const x = clamp(centerX, 0, Math.max(0, canvasW - w5));
                        const y = clamp(centerY + verticalOffset, 0, Math.max(0, canvasH - h5));
                        state.images.wmPic = {
                             img: img,
                             filename: f.name,
                             thumb: dataURL,
                             scale: scale,
                             x: x,
                             y: y,
                             defaultPlacement: { scale: scale, x: x, y: y },
                             _preventDefault: false
                         };
                    }
                    updateSlotUI(key);
                    syncHistoryForImageKeys([key]);
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    try { if(inputEl && typeof inputEl.value !== 'undefined') inputEl.value = ''; } catch(e){ /* ignore */ }
                });
            });
            inputEl._changeBound = true;
        }
        if(!slotEl._dragBound){
            slotEl.addEventListener('dragover', e=>{ e.preventDefault(); slotEl.classList.add('dragover'); });
            slotEl.addEventListener('dragleave', e=>{ e.preventDefault(); slotEl.classList.remove('dragover'); });
            slotEl.addEventListener('drop', e=>{
                e.preventDefault(); slotEl.classList.remove('dragover');
                const dt = e.dataTransfer; if(!dt || !dt.files || dt.files.length===0) return;
                const file = dt.files[0];
                if(key === 'wmPic') {
                    clearWmPicState(inputEl);
                    allowWmPicDefault();
                }
                utils.loadImageFromFile(file, (img, dataURL)=>{
                    state.images = state.images || {};
                    state.images[key] = state.images[key] || {};
                    state.images[key].img = img;
                    state.images[key].filename = file.name;
                    state.images[key].thumb = dataURL;
                    if (key === 'sysPic') {
                        state.images.sysPic._isDefault = false;
                        state.images.sysPic._preventDefault = false;
                    }
                    if(key === 'bgPic') {
                        fitBgPicToCanvas(img);
                    } else if(key === 'mainPic') {
                        const targetW = state.width / 2.2;
                        const computedScale = Math.min(Math.max(0.1, targetW / img.width), 5);
                        state.images.mainPic.scale = computedScale;
                        state.images.mainPic.initialScale = computedScale;
                        state.images.mainPic.x = window.APP.refPos && window.APP.refPos.mainPic ? window.APP.refPos.mainPic.x : (state.width/2 - (img.width*computedScale)/2);
                        state.images.mainPic.y = window.APP.refPos && window.APP.refPos.mainPic ? window.APP.refPos.mainPic.y : (state.height/2 - (img.height*computedScale)/2);
                    } else if(key === 'subPic') {
                        state.images.subPic.sizePx = state.images.subPic.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 200;
                        state.images.subPic.crop = state.images.subPic.crop || {};
                        if(typeof state.images.subPic.crop.cx !== 'number') state.images.subPic.crop.cx = 0.5;
                        if(typeof state.images.subPic.crop.cy !== 'number') state.images.subPic.crop.cy = (typeof state.images.subPic.y === 'number') ? state.images.subPic.y : 0;
                        if(typeof state.images.subPic.crop.shape !== 'string') state.images.subPic.crop.shape = 'circle';
                        if(typeof state.images.subPic.borderWidth !== 'number') state.images.subPic.borderWidth = (subPicBorder ? parseInt(subPicBorder.value,10) || 0 : 0);
                        if(typeof state.images.subPic.borderColor !== 'string') state.images.subPic.borderColor = (subPicBorderColor ? subPicBorderColor.value || '#000000' : '#000000');
                        try { updateSubPicCropSliders(); } catch(e){ /* ignore */ }
                    } else if(key === 'wmPic') {
                        const canvasW = Math.max(1, state.width || 2000);
                        const canvasH = Math.max(1, state.height || 2000);
                        const targetW = Math.round(canvasW * 0.5);
                        const scale = img.width ? (targetW / img.width) : 1;
                        const w5 = safeRound(img.width * scale);
                        const h5 = safeRound(img.height * scale);
                        const centerX = safeRound((canvasW - w5) / 2);
                        const centerY = safeRound((canvasH - h5) / 2);
                        const verticalOffset = 80;
                        const x = clamp(centerX, 0, Math.max(0, canvasW - w5));
                        const y = clamp(centerY + verticalOffset, 0, Math.max(0, canvasH - h5));
                        state.images.wmPic = {
                            img: img,
                            filename: file.name,
                            thumb: dataURL,
                            scale: scale,
                            x: x,
                            y: y,
                            defaultPlacement: { scale: scale, x: x, y: y },
                            _preventDefault: false
                        };
                  }
                    updateSlotUI(key);
                    syncHistoryForImageKeys([key]);
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    try { if(inputEl && typeof inputEl.value !== 'undefined') inputEl.value = ''; } catch(e){ /* ignore */ }
                });
            });
            slotEl._dragBound = true;
        }
        if(removeBtn && !removeBtn._bound){
            removeBtn.addEventListener('click', ev=>{
                ev.stopPropagation();
                if(key === 'wmPic' && window.APP && typeof window.APP.removeWmPic === 'function'){
                    try { inputEl.value = ''; } catch(e){}
                    state.images = state.images || {};
                    state.images.wmPic = state.images.wmPic || {};
                    state.images.wmPic._preventDefault = true;
                    try { window.APP.removeWmPic(); } catch(e){ /* ignore */ }
                    clearWmPicState(inputEl);
                    updateSlotUI(key);
                    syncHistoryForImageKeys([key]);
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    return;
                }
                if (key === 'sysPic') {
                    try { inputEl.value = ''; } catch(e){}
                    state.images.sysPic = {};
                    state.images.sysPic._preventDefault = true;
                    updateSlotUI('sysPic');
                    syncHistoryForImageKeys(['sysPic']);
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    return;
                }
                state.images[key] = {};
                try { inputEl.value = ''; } catch(e){}
                if(key === 'subPic'){
                    try { updateSlidersFromState(); } catch(e){ /* ignore */ }
                }
                updateSlotUI(key);
                syncHistoryForImageKeys([key]);
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            removeBtn._bound = true;
        }
    }

    function slotPicClickBind(slotEl, inputEl){
        slotEl.addEventListener('click', ()=> {
            try { inputEl.click(); } catch(e){ /* ignore */ }
        });
        slotEl._clickBound = true;
    }

    function updateSlotUI(key){
        const map = {
            mainPic:{info:infoMainPic,thumb:thumbMainPic,meta:metaMainPic},
            subPic:{info:infoSubPic,thumb:thumbSubPic,meta:metaSubPic},
            bgPic:{info:infoBgPic,thumb:thumbBgPic,meta:metaBgPic},
            wmPic:{info:infoWmPic,thumb:thumbWmPic,meta:metaWmPic},
            sysPic:{info:infoSysPic,thumb:thumbSysPic,meta:metaSysPic}
        };
        const ui = map[key];
        if(!ui) return;
        const entry = state.images && state.images[key];
        if(entry && entry.filename && entry.thumb){
            if(ui.info) ui.info.style.display='flex';
            if(ui.thumb) ui.thumb.src = entry.thumb;
            if(ui.meta) {
                if (key === 'wmPic') {
                    const isDefault = entry._isDefault || entry.filename === 'sign.png';
                    ui.meta.textContent = isDefault 
                        ? `${entry.filename} (default)` 
                        : entry.filename;
                } else {
                    ui.meta.textContent = entry.filename;
                }
            }
        } else if (key === 'sysPic' && entry && entry.img && !entry._preventDefault) {
            if(ui.info) ui.info.style.display='flex';
            if(ui.thumb){
                try {
                    ui.thumb.src = entry.thumb || (entry.img && entry.img.src) || '';
                } catch(e){ ui.thumb.src = ''; }
            }
            if(ui.meta) ui.meta.textContent = (entry.filename === sysLogoFilename) ? `${sysLogoFilename} (default)` : (entry.filename || sysLogoFilename);
        } else {
            if(ui.info) ui.info.style.display = 'none';
            if(ui.thumb) ui.thumb.src = '';
            if(ui.meta) ui.meta.textContent = '';
        }
    }

    function fitBgPicToCanvas(img){
        const sx = state.width / img.width, sy = state.height / img.height;
        const scale = Math.max(sx, sy);
        state.images.bgPic = state.images.bgPic || {};
        state.images.bgPic.scale = scale;
        state.images.bgPic.x = (state.width - img.width * scale) / 2;
        state.images.bgPic.y = (state.height - img.height * scale) / 2;
    }

    function exportCanvasImage(){
        var gif = window.APP && window.APP.gif;
        if(!gif){
            var workerPath = '../libs/gif.worker.js';
            gif = new GIF({ workers: 2, quality: 10, workerScript: workerPath });
            if(!window.APP) window.APP = {};
            window.APP.gif = gif;
            window.gif = gif;
        }
        try {
            const uiRefs = window.APP && window.APP.ui && window.APP.ui.refs;
            const format = (uiRefs && uiRefs.formatSel) ? (uiRefs.formatSel.value || 'png') : (formatSel && formatSel.value) || 'png';
            const quality = 0.92;
            const canvas = (window.APP && (window.APP.canvasEl || window.APP.canvas)) || document.querySelector('canvas');
            if(!canvas){
                console.warn('exportCanvasImage: canvas not found');
                return;
            }
            if(format === 'gif'){
                if(typeof GIF === 'undefined'){
                    console.error('exportCanvasImage: GIF library not found. Include gif.js and gif.worker.js.');
                    return;
                }
                function cloneCanvas(src){
                    const c = document.createElement('canvas');
                    c.width = src.width;
                    c.height = src.height;
                    const ctx = c.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(src, 0, 0);
                    return c;
                }
                const origW = canvas.width, origH = canvas.height;
                const targetW = state.width || canvas.width;
                const targetH = state.height || canvas.height;
                if(origW !== targetW || origH !== targetH){
                    canvas.width = targetW;
                    canvas.height = targetH;
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                }
                const frameA = cloneCanvas(canvas);
                const frameB = cloneCanvas(canvas);
                const delayMs = 400;
                gif.addFrame(frameA, {delay: delayMs, copy: true});
                gif.addFrame(frameB, {delay: delayMs, copy: true});
                gif.on('finished', function(blob){
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'display.gif';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    URL.revokeObjectURL(url);
                    if(origW !== targetW || origH !== targetH){
                        canvas.width = origW;
                        canvas.height = origH;
                        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    }
                    gif.running = false;
                });
                gif.on('error', function(err){
                    console.error('GIF generation error', err);
                    if(origW !== targetW || origH !== targetH){
                        canvas.width = origW;
                        canvas.height = origH;
                        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    }
                    gif.running = false;
                });
                if (gif.running) {
                    console.warn('GIF is already running, waiting for completion...');
                    return;
                }
                gif.render();
                return;
            }
            const origW = canvas.width, origH = canvas.height;
            const targetW = state.width || canvas.width;
            const targetH = state.height || canvas.height;
            if(origW !== targetW || origH !== targetH){
                canvas.width = targetW;
                canvas.height = targetH;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            }
            const mime = (format === 'jpeg' || format === 'jpg') ? 'image/jpeg' : (format === 'webp' ? 'image/webp' : 'image/png');
            canvas.toBlob(function(blob){
                if(!blob){
                    console.error('exportCanvasImage: toBlob returned null');
                    canvas.width = origW; canvas.height = origH;
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    return;
                }
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                const ext = (mime === 'image/png') ? 'png' : (mime === 'image/jpeg' ? 'jpg' : 'webp');
                a.download = `output.${ext}`;
                document.body.appendChild(a);
                a.click();
                a.remove();
                URL.revokeObjectURL(url);
                if(origW !== targetW || origH !== targetH){
                    canvas.width = origW;
                    canvas.height = origH;
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                }
            }, mime, quality);
        } catch(e){
            console.error('exportCanvasImage error', e);
        }
    }

    if(typeof exportBtn !== 'undefined' && exportBtn && !exportBtn._boundToExport){
        exportBtn.addEventListener('click', function(ev){
            ev.preventDefault();
            exportCanvasImage();
        });
        exportBtn._boundToExport = true;
    }

    (function(){
        function resetWmPicToDefault(){
            try {
                state.images = state.images || {};
                state.images.wmPic = state.images.wmPic || {};
                if(state.images.wmPic.defaultPlacement && typeof state.images.wmPic.defaultPlacement === 'object'){
                    const def = state.images.wmPic.defaultPlacement;
                    const canvasW = Math.max(1, state.width || 2000);
                    const canvasH = Math.max(1, state.height || 2000);
                    const imgW = state.images.wmPic.img ? safeRound((state.images.wmPic.img.width || 0) * (def.scale || 1)) : 0;
                    const imgH = state.images.wmPic.img ? safeRound((state.images.wmPic.img.height || 0) * (def.scale || 1)) : 0;
                    state.images.wmPic.scale = def.scale;
                    state.images.wmPic.x = clamp(def.x, 0, Math.max(0, canvasW - imgW));
                    state.images.wmPic.y = clamp(def.y, 0, Math.max(0, canvasH - imgH));
                } else {
                    const canvasW = Math.max(1, state.width || 2000);
                    const canvasH = Math.max(1, state.height || 2000);
                    const def = (window.APP && typeof window.APP.getDefaultWmPicPlacement === 'function')
                        ? window.APP.getDefaultWmPicPlacement(state.images.wmPic && state.images.wmPic.img)
                        : (function(){
                            const img = state.images.wmPic && state.images.wmPic.img;
                            if(!img) return { scale:1, x: safeRound((canvasW - 1)/2), y: safeRound((canvasH - 1)/2) };
                            const targetW = Math.round(canvasW * 0.5);
                            const scale = img.width ? (targetW / img.width) : 1;
                            const w5 = safeRound(img.width * scale);
                            const h5 = safeRound(img.height * scale);
                            const x = clamp(safeRound((canvasW - w5) / 2), 0, Math.max(0, canvasW - w5));
                            const y = clamp(safeRound((canvasH - h5) / 2), 0, Math.max(0, canvasH - h5));
                            return { scale: scale, x: x, y: y };
                        })();
                    state.images.wmPic.defaultPlacement = { scale: def.scale, x: def.x, y: def.y };
                    state.images.wmPic.scale = def.scale;
                    state.images.wmPic.x = def.x;
                    state.images.wmPic.y = def.y;
                }
                if(window.APP && window.APP.ui && typeof window.APP.ui.updateSlotUI === 'function'){
                    try { window.APP.ui.updateSlotUI('wmPic'); } catch(e){ /* ignore */ }
                }
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch(err){
                console.error('resetWmPicToDefault error', err);
            }
        }
        try {
            const btn = (window.APP && window.APP.ui && window.APP.ui.refs && window.APP.ui.refs.resetWmPicPos) ? window.APP.ui.refs.resetWmPicPos : resetWmPicPos;
            if(btn && !btn._boundToResetWmPic){
                btn.addEventListener('click', function(ev){
                    ev.preventDefault();
                    resetWmPicToDefault();
                });
                btn._boundToResetWmPic = true;
            }
        } catch(e){
            console.warn('resetWmPic button bind failed', e);
        }
        window.APP.resetWmPicToDefault = resetWmPicToDefault;
    })();

    (function(){
        var opacityInput = document.getElementById('wmPicOpacity');
        if(!opacityInput) return;
        var defaultVal = parseInt(opacityInput.getAttribute('value') || opacityInput.value || 50, 10);
        var valEl = document.getElementById('wmPicOpacityVal');
        if(!valEl){
            valEl = document.createElement('div');
            valEl.id = 'wmPicOpacityVal';
            valEl.className = 'val';
            valEl.textContent = defaultVal + '%';
            if(opacityInput.parentNode){
                opacityInput.parentNode.insertBefore(valEl, opacityInput.nextSibling);
            } else {
                opacityInput.insertAdjacentElement('afterend', valEl);
            }
        }
        function updateOpacityDisplay(v){
            if(valEl) valEl.textContent = v + '%';
        }
        function applyOpacityToWm(v){
            if(window.APP && window.APP.watermarkElement){
                window.APP.watermarkElement.style.opacity = (v / 100).toString();
            } else if(typeof updateWatermarkOpacity === 'function'){
                updateWatermarkOpacity(v / 100);
            }
        }
        function onInputChange(e){
            var v = parseInt(e.target.value, 10);
            updateOpacityDisplay(v);
            applyOpacityToWm(v);
        }
        opacityInput.addEventListener('input', onInputChange);
        opacityInput.addEventListener('change', onInputChange);
        var btn = (window.APP && window.APP.ui && window.APP.ui.refs && window.APP.ui.refs.resetWmPicPos) ? window.APP.ui.refs.resetWmPicPos : document.getElementById('resetWmPicPos');
        if(btn && !btn._boundToOpacityReset){
            btn.addEventListener('click', function(){
                opacityInput.value = defaultVal;
                var ev = new Event('input', { bubbles: true });
                opacityInput.dispatchEvent(ev);
            });
            btn._boundToOpacityReset = true;
        }
    })();

    if (typeof resetSubPicPos !== 'undefined' && resetSubPicPos && !resetSubPicPos._boundToResetSubPic) {
        resetSubPicPos.addEventListener('click', function(ev){
            ev.preventDefault();
            try {
                state.images = state.images || {};
                state.images.subPic = state.images.subPic || {};
                state.images.subPic.crop = state.images.subPic.crop || {};
                state.images.subPic.crop.cx = 0.5;
                state.images.subPic.crop.cy = (typeof state.images.subPic.y === 'number') ? state.images.subPic.y : 0;
                if (typeof setSubPicShape === 'function') {
                    setSubPicShape('circle');
                } else {
                    state.images.subPic.crop.shape = 'circle';
                    if (subPicShapeCircle) subPicShapeCircle.checked = true;
                    if (subPicShapeDiamond) subPicShapeDiamond.checked = false;
                }
                state.images.subPic.borderWidth = 2;
                state.images.subPic.borderColor = '#000000';
                if (subPicBorder) subPicBorder.value = 2;
                if (subPicBorderColor) subPicBorderColor.value = '#000000';
                try { updateSubPicCropSliders(); } catch(e){ /* ignore */ }
                if (window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            } catch (err) {
                console.warn('resetSubPicPos handler error', err);
            }
        });
        resetSubPicPos._boundToResetSubPic = true;
    }

    window.APP.ui = window.APP.ui || {};
    window.APP.ui.setupSlot = setupSlot;
    window.APP.ui.updateSlotUI = updateSlotUI;
    window.APP.ui.fitBgPicToCanvas = fitBgPicToCanvas;
    window.APP.ui.refs = {
        fileMainPic,fileSubPic,fileBgPic,fileWmPic,sysPicInput,
        slotMainPic,slotSubPic,slotBgPic,slotWmPic,slotSysPic,
        resetMainPicPos,resetSubPicPos,resetBgPicPos,resetWmPicPos,resetSysPicPos,
        subPicCropY,subPicZoom,subPicZoomVal,subPicBorder,subPicBorderColor,centerTopBtn,
        subPicCropX,
        subPicShapeCircle, subPicShapeDiamond,
        bandColor, bandHeight, bandOrientHorizontal, bandOrientVertical,
        bgSubPic, bgSubPicAlpha, bgSubPicAlphaVal,
        text1El,text2El,text3El,fontSelect,fontSizeEl,fontColorEl,
        exportBtn,formatSel,
        wmPicOpacity
    };
    window.APP.ui.exportCanvasImage = exportCanvasImage;

    setupSlot(slotMainPic, fileMainPic, 'mainPic', infoMainPic, thumbMainPic, metaMainPic, removeMainPic);
    setupSlot(slotSubPic, fileSubPic, 'subPic', infoSubPic, thumbSubPic, metaSubPic, removeSubPic);
    setupSlot(slotBgPic, fileBgPic, 'bgPic', infoBgPic, thumbBgPic, metaBgPic, removeBgPic);
    setupSlot(slotWmPic, fileWmPic, 'wmPic', infoWmPic, thumbWmPic, metaWmPic, removeWmPic);
    setupSlot(slotSysPic, sysPicInput, 'sysPic', infoSysPic, thumbSysPic, metaSysPic, removeSysPic);

    if(utils && typeof utils.populateFontSelect === 'function'){
        utils.populateFontSelect(fontSelect);
    }

    state.ui = state.ui || {};
    if(typeof state.ui.bandOrientation !== 'string') state.ui.bandOrientation = 'horizontal';
    try { setBandOrientation(state.ui.bandOrientation); } catch(e){ /* ignore */ }

    try { ensureDefaultSysPic(); } catch(e){ /* ignore */ }

    try { updateSubPicCropSliders(); } catch(e){ /* ignore */ }

    function setAspectRatio(ratio) {
        const ratios = {
            landscape: { width: 1920, height: 1080 },
            square: { width: 2000, height: 2000 },
            portrait: { width: 1748, height: 2480 }
        };
        const newRatio = ratios[ratio];
        if (!newRatio) return;

        const oldRatio = { width: state.width, height: state.height };
        
        const canvas = window.APP.canvas || document.getElementById('mainCanvas');
        if (canvas) {
            canvas.width = newRatio.width;
            canvas.height = newRatio.height;
        }
        
        state.width = newRatio.width;
        state.height = newRatio.height;
        state.aspectRatio = newRatio;
        
        const viewport = document.querySelector('.squareViewport');
        if (viewport) {
            const canvasW = canvas.width;
            const canvasH = canvas.height;
            
            viewport.style.aspectRatio = `${canvasW} / ${canvasH}`;
            
            let maxWidth, maxHeight;
            
            if (ratio === 'landscape') {
                const shortSide = Math.min(canvasW, canvasH);
                const scale = 600 / shortSide;
                maxWidth = Math.round(canvasW * scale);
                maxHeight = Math.round(canvasH * scale);
            } else if (ratio === 'portrait') {
                const longSide = Math.max(canvasW, canvasH);
                const scale = 600 / longSide;
                maxWidth = Math.round(canvasW * scale);
                maxHeight = Math.round(canvasH * scale);
            } else {
                const longSide = Math.max(canvasW, canvasH);
                const scale = 600 / longSide;
                maxWidth = Math.round(canvasW * scale);
                maxHeight = Math.round(canvasH * scale);
            }
            
            viewport.style.maxWidth = `${maxWidth}px`;
            viewport.style.maxHeight = `${maxHeight}px`;
        }
        
        scaleImagesToNewRatio(oldRatio, newRatio);
        
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    function convertToRelativePosition(img, canvasW, canvasH) {
        if (img && img.x !== undefined && img.y !== undefined) {
            img._relativeX = img.x / canvasW;
            img._relativeY = img.y / canvasH;
        }
    }

    function convertToAbsolutePosition(img, canvasW, canvasH) {
        if (img && img._relativeX !== undefined && img._relativeY !== undefined) {
            img.x = Math.round(img._relativeX * canvasW);
            img.y = Math.round(img._relativeY * canvasH);
        }
    }

    function scaleImagesToNewRatio(oldRatio, newRatio) {
        const scaleX = newRatio.width / oldRatio.width;
        const scaleY = newRatio.height / oldRatio.height;
        
        Object.keys(state.images).forEach(key => {
            const img = state.images[key];
            if (img && img.x !== undefined) {
                if (img._relativeX === undefined || img._relativeY === undefined) {
                    convertToRelativePosition(img, oldRatio.width, oldRatio.height);
                }
                convertToAbsolutePosition(img, newRatio.width, newRatio.height);
                
                if (img.scale !== undefined) {
                }
                if (img.sizePx !== undefined) {
                    if (key === 'subPic') {
                        if (img._relativeSizePx === undefined) {
                            img._relativeSizePx = img.sizePx / oldRatio.width;
                        }
                        img.sizePx = Math.round(img._relativeSizePx * newRatio.width);
                    } else {
                        img.sizePx = Math.round(img.sizePx * Math.min(scaleX, scaleY));
                    }
                }
            }
        });
        
        if (state.texts && Array.isArray(state.texts)) {
            state.texts.forEach(text => {
                if (text && text.x !== undefined) {
                    if (text._relativeX === undefined || text._relativeY === undefined) {
                        text._relativeX = text.x / oldRatio.width;
                        text._relativeY = text.y / oldRatio.height;
                    }
                    text.x = Math.round(text._relativeX * newRatio.width);
                    text.y = Math.round(text._relativeY * newRatio.height);
                }
            });
        }
        
        if (state.images.sysPic && state.images.sysPic.img) {
            const ratio = (newRatio.width === 1920 && newRatio.height === 1080) ? 'landscape' : 
                         (newRatio.width === 1748 && newRatio.height === 2480) ? 'portrait' : 'square';
            
            const margin = 40;
            const targetW = Math.min(state.images.sysPic.img.width, Math.round(state.width * (ratio === 'landscape' ? 0.3 : 0.4)));
            const scale = state.images.sysPic.img.width ? (targetW / state.images.sysPic.img.width) : 1;
            state.images.sysPic.scale = scale;
            const w = Math.round(state.images.sysPic.img.width * scale);
            const h = Math.round(state.images.sysPic.img.height * scale);
            state.images.sysPic.x = margin;
            state.images.sysPic.y = Math.round(state.height - h - margin);
        }
        
        if (state.texts && Array.isArray(state.texts)) {
            const ratio = (newRatio.width === 1748 && newRatio.height === 2480) ? 'portrait' : 
                         (newRatio.width === 1920 && newRatio.height === 1080) ? 'landscape' : 'square';
            
            state.texts.forEach(text => {
                if (text && text.x !== undefined) {
                    if (ratio === 'portrait') {
                        const margin = 40;
                        const sysPicWidth = state.images.sysPic && state.images.sysPic.img ? 
                            Math.round(state.images.sysPic.img.width * (state.images.sysPic.scale || 1)) : 0;
                        const minTextX = margin + sysPicWidth + 20;
                        text.x = Math.max(minTextX, text.x);
                    } else if (ratio === 'landscape') {
                        const margin = 40;
                        const sysPicWidth = state.images.sysPic && state.images.sysPic.img ? 
                            Math.round(state.images.sysPic.img.width * (state.images.sysPic.scale || 1)) : 0;
                        const textHeight = 80;
                        const spacing = 20;
                        
                        const textX = margin + sysPicWidth + 30;
                        
                        const sysPicY = state.images.sysPic && state.images.sysPic.y ? state.images.sysPic.y : (state.height - margin - 100);
                        
                        if (text.index === 0) {
                            text.x = textX;
                            text.y = sysPicY;
                        } else if (text.index === 1) {
                            text.x = textX;
                            text.y = sysPicY + textHeight + spacing;
                        } else if (text.index === 2) {
                            text.x = textX;
                            text.y = sysPicY + (textHeight + spacing) * 2;
                        }
                    }
                }
            });
        }
        
        if (state.images.wmPic && state.images.wmPic.img) {
            const ratio = (newRatio.width === 1920 && newRatio.height === 1080) ? 'landscape' : 
                         (newRatio.width === 1748 && newRatio.height === 2480) ? 'portrait' : 'square';
            
            if (ratio === 'landscape') {
                const canvasW = Math.max(1, state.width || 2000);
                const targetW = Math.round(canvasW * 0.35);
                const scale = state.images.wmPic.img.width ? (targetW / state.images.wmPic.img.width) : 1;
                state.images.wmPic.scale = scale;
                const w5 = safeRound(state.images.wmPic.img.width * scale);
                const h5 = safeRound(state.images.wmPic.img.height * scale);
                const centerX = safeRound((state.width - w5) / 2);
                const centerY = safeRound((state.height - h5) / 2);
                const verticalOffset = 80;
                const x = clamp(centerX, 0, Math.max(0, state.width - w5));
                const y = clamp(centerY + verticalOffset, 0, Math.max(0, state.height - h5));
                state.images.wmPic.x = x;
                state.images.wmPic.y = y;
            }
        }
    }

    if (aspectLandscape && !aspectLandscape._bound) {
        aspectLandscape.addEventListener('change', function() {
            if (this.checked) setAspectRatio('landscape');
        });
        aspectLandscape._bound = true;
    }
    if (aspectSquare && !aspectSquare._bound) {
        aspectSquare.addEventListener('change', function() {
            if (this.checked) setAspectRatio('square');
        });
        aspectSquare._bound = true;
    }
    if (aspectPortrait && !aspectPortrait._bound) {
        aspectPortrait.addEventListener('change', function() {
            if (this.checked) setAspectRatio('portrait');
        });
        aspectPortrait._bound = true;
    }

    // アンドゥ・リドゥボタンのイベント設定
    const undoBtn = document.getElementById('undoBtn');
    const redoBtn = document.getElementById('redoBtn');
    if (undoBtn) {
        undoBtn.addEventListener('click', function() {
            if (window.APP && window.APP.history && window.APP.history.canUndo()) {
                const previousState = window.APP.history.undo();
                if (previousState) {
                    // img オブジェクトを保持しながら状態を復元
                    const savedImages = {};
                    ['mainPic', 'subPic', 'bgPic', 'wmPic', 'sysPic', 'overlayAsset'].forEach(key => {
                        if (window.APP.state.images[key] && window.APP.state.images[key].img) {
                            savedImages[key] = window.APP.state.images[key].img;
                        }
                    });
                    Object.assign(window.APP.state, previousState);
                    // bandOrientationは履歴外であるため削除
                    if (window.APP.state.ui) {
                        delete window.APP.state.ui.bandOrientation;
                    }
                    Object.keys(savedImages).forEach(key => {
                        if (window.APP.state.images[key]) {
                            window.APP.state.images[key].img = savedImages[key];
                        }
                    });
                    try { updateSlidersFromState(); } catch(e){ /* ignore */ }
                    if (typeof window.APP.draw === 'function') window.APP.draw();
                }
            }
        });
    }
    if (redoBtn) {
        redoBtn.addEventListener('click', function() {
            if (window.APP && window.APP.history && window.APP.history.canRedo()) {
                const nextState = window.APP.history.redo();
                if (nextState) {
                    // img オブジェクトを保持しながら状態を復元
                    const savedImages = {};
                    ['mainPic', 'subPic', 'bgPic', 'wmPic', 'sysPic', 'overlayAsset'].forEach(key => {
                        if (window.APP.state.images[key] && window.APP.state.images[key].img) {
                            savedImages[key] = window.APP.state.images[key].img;
                        }
                    });
                    Object.assign(window.APP.state, nextState);
                    // bandOrientationは履歴外であるため削除
                    if (window.APP.state.ui) {
                        delete window.APP.state.ui.bandOrientation;
                    }
                    Object.keys(savedImages).forEach(key => {
                        if (window.APP.state.images[key]) {
                            window.APP.state.images[key].img = savedImages[key];
                        }
                    });
                    try { updateSlidersFromState(); } catch(e){ /* ignore */ }
                    if (typeof window.APP.draw === 'function') window.APP.draw();
                }
            }
        });
    }

    window.APP.ui.setAspectRatio = setAspectRatio;
    window.APP.ui.scaleImagesToNewRatio = scaleImagesToNewRatio;

    // 初期化完了時に履歴スタックをクリア（初期化中の draw 呼び出しによる履歴を除外）
    if (window.APP && window.APP.history) {
        window.APP.history.undoStack = [];
        window.APP.history.redoStack = [];
        window.APP.history.updateHistoryUI();
    }

    window.addEventListener('resize', function(){
        try { updateSubPicCropSliders(); } catch(e){ /* ignore */ }
    });

})();