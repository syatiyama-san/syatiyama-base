// app-template-io.js

(function(){
    const state = window.APP && window.APP.state;
    const refs = window.APP && window.APP.ui && window.APP.ui.refs;

    const importZone = document.getElementById('templateImportZone');
    const importInput = document.getElementById('templateImportInput');
    const exportBtn = document.getElementById('templateExportBtn');

    if(!state || !refs || !importZone || !importInput || !exportBtn) return;

    function cloneStateForTemplate(currentState){
        const cloned = JSON.parse(JSON.stringify(currentState));
        if (cloned && cloned.images) {
            Object.keys(cloned.images).forEach(key => {
                if (cloned.images[key] && Object.prototype.hasOwnProperty.call(cloned.images[key], 'img')) {
                    cloned.images[key].img = null;
                }
            });
        }
        if (cloned) {
            delete cloned.hovering;
            delete cloned.dragging;
            delete cloned.dragOffset;
        }
        return cloned;
    }

    function gatherImageSources(){
        const images = state.images || {};
        const out = {};
        Object.keys(images).forEach(key => {
            const entry = images[key] || {};
            const src = entry.thumb || (entry.img && entry.img.src) || null;
            out[key] = {
                src,
                filename: entry.filename || null,
                thumb: entry.thumb || null
            };
        });
        return out;
    }

    function downloadJSON(obj, filename){
        const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    function getAspectRatioKey(){
        const landscape = document.getElementById('aspectLandscape');
        const square = document.getElementById('aspectSquare');
        const portrait = document.getElementById('aspectPortrait');
        if(landscape && landscape.checked) return 'landscape';
        if(portrait && portrait.checked) return 'portrait';
        return 'square';
    }

    function applyAspectRatioKey(key){
        const landscape = document.getElementById('aspectLandscape');
        const square = document.getElementById('aspectSquare');
        const portrait = document.getElementById('aspectPortrait');
        if(landscape) landscape.checked = key === 'landscape';
        if(square) square.checked = key === 'square';
        if(portrait) portrait.checked = key === 'portrait';
        if(window.APP && window.APP.ui && typeof window.APP.ui.setAspectRatio === 'function'){
            window.APP.ui.setAspectRatio(key || 'square');
        } else {
            const ratios = {
                landscape: { width: 1920, height: 1080 },
                square: { width: 2000, height: 2000 },
                portrait: { width: 1748, height: 2480 }
            };
            const target = ratios[key] || ratios.square;
            applyCanvasSize(target.width, target.height);
            state.aspectRatio = target;
        }
    }

    function applyCanvasSize(width, height){
        const canvas = window.APP.canvas || document.getElementById('mainCanvas');
        if(!canvas || !width || !height) return;
        canvas.width = width;
        canvas.height = height;
        state.width = width;
        state.height = height;
        const viewport = document.querySelector('.squareViewport');
        if (viewport) {
            viewport.style.aspectRatio = `${width} / ${height}`;
            const longSide = Math.max(width, height);
            const scale = 600 / longSide;
            const maxWidth = Math.round(width * scale);
            const maxHeight = Math.round(height * scale);
            viewport.style.maxWidth = `${maxWidth}px`;
            viewport.style.maxHeight = `${maxHeight}px`;
        }
    }

    function syncUIFromState(){
        if(refs.bandColor && state.ui && typeof state.ui.bandColor === 'string') refs.bandColor.value = state.ui.bandColor;
        if(refs.bandHeight && state.ui && typeof state.ui.bandHeight === 'number') refs.bandHeight.value = state.ui.bandHeight;
        if(refs.bandOrientHorizontal && refs.bandOrientVertical && state.ui && typeof state.ui.bandOrientation === 'string'){
            const orient = state.ui.bandOrientation === 'vertical' ? 'vertical' : 'horizontal';
            refs.bandOrientHorizontal.checked = (orient === 'horizontal');
            refs.bandOrientVertical.checked = (orient === 'vertical');
        }
        const subPic = state.images && state.images.subPic;
        if(refs.bgSubPic && subPic && typeof subPic.bgColor === 'string') refs.bgSubPic.value = subPic.bgColor;
        if(refs.bgSubPicAlpha && subPic && typeof subPic.bgOpacity === 'number') {
            const pct = Math.round(subPic.bgOpacity * 100);
            refs.bgSubPicAlpha.value = pct;
            if(refs.bgSubPicAlphaVal) refs.bgSubPicAlphaVal.textContent = pct + '%';
        }

        const texts = state.texts || [];
        if(refs.text1El && texts[0]) refs.text1El.value = texts[0].text || '';
        if(refs.text2El && texts[1]) refs.text2El.value = texts[1].text || '';
        if(refs.text3El && texts[2]) refs.text3El.value = texts[2].text || '';

        if(refs.text1X && texts[0]) refs.text1X.value = Math.round(texts[0].x || 0);
        if(refs.text1Y && texts[0]) refs.text1Y.value = Math.round(texts[0].y || 0);
        if(refs.text2X && texts[1]) refs.text2X.value = Math.round(texts[1].x || 0);
        if(refs.text2Y && texts[1]) refs.text2Y.value = Math.round(texts[1].y || 0);
        if(refs.text3X && texts[2]) refs.text3X.value = Math.round(texts[2].x || 0);
        if(refs.text3Y && texts[2]) refs.text3Y.value = Math.round(texts[2].y || 0);

        function syncTextStyle(t, controls){
            if(!t || !controls) return;
            if(controls.fontSelect && t.fontFamily) controls.fontSelect.value = t.fontFamily;
            if(controls.fontSize && typeof t.fontSize === 'number') controls.fontSize.value = t.fontSize;
            if(controls.fontColor && t.fontColor) controls.fontColor.value = t.fontColor;
            if(controls.orientH && controls.orientV){
                const orient = t.textOrientation === 'vertical' ? 'vertical' : 'horizontal';
                controls.orientH.checked = orient === 'horizontal';
                controls.orientV.checked = orient === 'vertical';
            }
        }

        syncTextStyle(texts[0], {
            fontSelect: refs.text1FontSelect,
            fontSize: refs.text1FontSize,
            fontColor: refs.text1FontColor,
            orientH: refs.text1OrientHorizontal,
            orientV: refs.text1OrientVertical
        });
        syncTextStyle(texts[1], {
            fontSelect: refs.text2FontSelect,
            fontSize: refs.text2FontSize,
            fontColor: refs.text2FontColor,
            orientH: refs.text2OrientHorizontal,
            orientV: refs.text2OrientVertical
        });
        syncTextStyle(texts[2], {
            fontSelect: refs.text3FontSelect,
            fontSize: refs.text3FontSize,
            fontColor: refs.text3FontColor,
            orientH: refs.text3OrientHorizontal,
            orientV: refs.text3OrientVertical
        });

        const imgPos = [
            ['mainPic', refs.mainPicX, refs.mainPicY],
            ['subPic', refs.subPicX, refs.subPicY],
            ['bgPic', refs.bgPicX, refs.bgPicY],
            ['wmPic', refs.wmPicX, refs.wmPicY],
            ['sysPic', refs.sysPicX, refs.sysPicY]
        ];
        imgPos.forEach(([key, xEl, yEl])=>{
            const img = state.images && state.images[key];
            if(!img) return;
            if(xEl) xEl.value = Math.round(img.x || 0);
            if(yEl) yEl.value = Math.round(img.y || 0);
        });
    }

    function loadImagesFromSources(imageSources){
        if(!imageSources) return;
        const keys = Object.keys(imageSources);
        keys.forEach(key => {
            const src = imageSources[key] && imageSources[key].src;
            if(!src) {
                if(state.images && state.images[key]) state.images[key].img = null;
                return;
            }
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function(){
                state.images = state.images || {};
                state.images[key] = state.images[key] || {};
                state.images[key].img = img;
                state.images[key].thumb = imageSources[key].thumb || state.images[key].thumb || null;
                state.images[key].filename = imageSources[key].filename || state.images[key].filename || null;
                if(window.APP && window.APP.ui && typeof window.APP.ui.updateSlotUI === 'function'){
                    try { window.APP.ui.updateSlotUI(key); } catch(e){ }
                }
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            };
            img.onerror = function(){
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            };
            img.src = src;
        });
    }

    function importTemplateObject(obj){
        if(!obj || !obj.state) return;
        const snapshot = obj.state;
        const imageSources = obj.imageSources || {};
        const aspectRatioKey = obj.aspectRatioKey || null;

        if(snapshot.width && snapshot.height){
            applyCanvasSize(snapshot.width, snapshot.height);
        }

        const savedImages = {};
        ['mainPic','subPic','bgPic','wmPic','sysPic','overlayAsset'].forEach(key => {
            if(state.images && state.images[key] && state.images[key].img) {
                savedImages[key] = state.images[key].img;
            }
        });

        Object.assign(state, snapshot);
        state.images = state.images || {};

        Object.keys(savedImages).forEach(key => {
            if(state.images[key]) state.images[key].img = savedImages[key];
        });

        loadImagesFromSources(imageSources);
        if(aspectRatioKey) applyAspectRatioKey(aspectRatioKey);
        syncUIFromState();
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    function handleImportFile(file){
        if(!file) return;
        const reader = new FileReader();
        reader.onload = function(e){
            try {
                const obj = JSON.parse(e.target.result);
                importTemplateObject(obj);
            } catch(err){
                alert('テンプレートの読み込みに失敗しました。');
            }
        };
        reader.readAsText(file);
    }

    if(!importZone._bound){
        importZone.addEventListener('click', ()=>{
            try { importInput.click(); } catch(e){}
        });
        importZone.addEventListener('dragover', e=>{
            e.preventDefault();
            importZone.classList.add('dragover');
        });
        importZone.addEventListener('dragleave', ()=>{
            importZone.classList.remove('dragover');
        });
        importZone.addEventListener('drop', e=>{
            e.preventDefault();
            importZone.classList.remove('dragover');
            const f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
            handleImportFile(f);
        });
        importZone._bound = true;
    }

    if(!importInput._bound){
        importInput.addEventListener('change', e=>{
            const f = e.target.files && e.target.files[0];
            handleImportFile(f);
            try { importInput.value = ''; } catch(e){}
        });
        importInput._bound = true;
    }

    if(!exportBtn._bound){
        exportBtn.addEventListener('click', ()=>{
            const payload = {
                version: 1,
                state: cloneStateForTemplate(state),
                imageSources: gatherImageSources(),
                aspectRatioKey: getAspectRatioKey()
            };
            downloadJSON(payload, 'display-template.json');
        });
        exportBtn._bound = true;
    }
})();
