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
        text1FontSelect: document.getElementById('text1FontSelect'),
        text1FontSize: document.getElementById('text1FontSize'),
        text1FontColor: document.getElementById('text1FontColor'),
        text1OrientHorizontal: document.getElementById('text1OrientHorizontal'),
        text1OrientVertical: document.getElementById('text1OrientVertical'),
        text2FontSelect: document.getElementById('text2FontSelect'),
        text2FontSize: document.getElementById('text2FontSize'),
        text2FontColor: document.getElementById('text2FontColor'),
        text2OrientHorizontal: document.getElementById('text2OrientHorizontal'),
        text2OrientVertical: document.getElementById('text2OrientVertical'),
        text3FontSelect: document.getElementById('text3FontSelect'),
        text3FontSize: document.getElementById('text3FontSize'),
        text3FontColor: document.getElementById('text3FontColor'),
        text3OrientHorizontal: document.getElementById('text3OrientHorizontal'),
        text3OrientVertical: document.getElementById('text3OrientVertical'),
        subPicCropX: document.getElementById('subPicCropX'),
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
        text1X: document.getElementById('text1X'),
        text1Y: document.getElementById('text1Y'),
        text2X: document.getElementById('text2X'),
        text2Y: document.getElementById('text2Y'),
        text3X: document.getElementById('text3X'),
        text3Y: document.getElementById('text3Y'),
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
        mainPicX: document.getElementById('mainPicX'),
        mainPicY: document.getElementById('mainPicY'),
        mainPicZ: document.getElementById('mainPicZ'),
        subPicX: document.getElementById('subPicX'),
        subPicY: document.getElementById('subPicY'),
        subPicZ: document.getElementById('subPicZ'),
        bgPicX: document.getElementById('bgPicX'),
        bgPicY: document.getElementById('bgPicY'),
        bgPicZ: document.getElementById('bgPicZ'),
        wmPicX: document.getElementById('wmPicX'),
        wmPicY: document.getElementById('wmPicY'),
        wmPicZ: document.getElementById('wmPicZ'),
        sysPicX: document.getElementById('sysPicX'),
        sysPicY: document.getElementById('sysPicY'),
        sysPicZ: document.getElementById('sysPicZ'),
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

    function resetSingleTextToDefault(idx){
        if(!state.texts || !state.texts[idx] || !textDefaultPos[idx]) return;
        state.texts[idx].x = Math.round(state.width * textDefaultPos[idx].x);
        state.texts[idx].y = Math.round(state.height * textDefaultPos[idx].y);
        state.texts[idx].textOrientation = 'horizontal';
        const defaultSize = (idx === 0 && refs.text1FontSize && refs.text1FontSize.defaultValue) ? parseInt(refs.text1FontSize.defaultValue,10)
            : (idx === 1 && refs.text2FontSize && refs.text2FontSize.defaultValue) ? parseInt(refs.text2FontSize.defaultValue,10)
            : (idx === 2 && refs.text3FontSize && refs.text3FontSize.defaultValue) ? parseInt(refs.text3FontSize.defaultValue,10)
            : 60;
        const safeDefaultSize = Number.isNaN(defaultSize) ? 60 : defaultSize;
        const clampedDefaultSize = Math.max(20, safeDefaultSize);
        state.texts[idx].fontSize = clampedDefaultSize;
        if(idx === 0){
            if(refs.text1OrientHorizontal) refs.text1OrientHorizontal.checked = true;
            if(refs.text1OrientVertical) refs.text1OrientVertical.checked = false;
            if(refs.text1FontSize) refs.text1FontSize.value = clampedDefaultSize;
        }
        if(idx === 1){
            if(refs.text2OrientHorizontal) refs.text2OrientHorizontal.checked = true;
            if(refs.text2OrientVertical) refs.text2OrientVertical.checked = false;
            if(refs.text2FontSize) refs.text2FontSize.value = clampedDefaultSize;
        }
        if(idx === 2){
            if(refs.text3OrientHorizontal) refs.text3OrientHorizontal.checked = true;
            if(refs.text3OrientVertical) refs.text3OrientVertical.checked = false;
            if(refs.text3FontSize) refs.text3FontSize.value = clampedDefaultSize;
        }
        if(idx === 0){ if(refs.text1X) refs.text1X.value = Math.round(state.texts[idx].x || 0); if(refs.text1Y) refs.text1Y.value = Math.round(state.texts[idx].y || 0); }
        if(idx === 1){ if(refs.text2X) refs.text2X.value = Math.round(state.texts[idx].x || 0); if(refs.text2Y) refs.text2Y.value = Math.round(state.texts[idx].y || 0); }
        if(idx === 2){ if(refs.text3X) refs.text3X.value = Math.round(state.texts[idx].x || 0); if(refs.text3Y) refs.text3Y.value = Math.round(state.texts[idx].y || 0); }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    function normalizeTextStyle(t){
        if(!t) return;
        if(typeof t.fontSize !== 'number') t.fontSize = (state.ui && typeof state.ui.fontSize === 'number') ? state.ui.fontSize : 60;
        if(typeof t.fontFamily !== 'string') t.fontFamily = (state.ui && typeof state.ui.fontFamily === 'string') ? state.ui.fontFamily : 'Arial';
        if(typeof t.fontColor !== 'string') t.fontColor = (state.ui && typeof state.ui.fontColor === 'string') ? state.ui.fontColor : '#000000';
        if(typeof t.textOrientation !== 'string') t.textOrientation = (state.ui && typeof state.ui.textOrientation === 'string') ? state.ui.textOrientation : 'horizontal';
    }

    function getTextStyle(idx){
        const t = (state.texts && state.texts[idx]) ? state.texts[idx] : null;
        if(t) normalizeTextStyle(t);
        const fontSize = (t && typeof t.fontSize === 'number') ? t.fontSize : 60;
        const fontFamily = (t && typeof t.fontFamily === 'string') ? t.fontFamily : 'Arial';
        const textOrientation = (t && t.textOrientation === 'vertical') ? 'vertical' : 'horizontal';
        const fontSpec = `${fontSize}px "${fontFamily}"`;
        const lineHeight = Math.round(fontSize * 1.15);
        return { fontSize, fontFamily, textOrientation, fontSpec, lineHeight };
    }

    function resetTextsToDefaults(){
        for(let i = 0; i < state.texts.length; i++){
            if(textDefaultPos[i]){
                state.texts[i].x = Math.round(state.width * textDefaultPos[i].x);
                state.texts[i].y = Math.round(state.height * textDefaultPos[i].y);
            }
        }
        for(let i = 0; i < state.texts.length; i++){
            state.texts[i].textOrientation = 'horizontal';
        }
        const defaultSize1Raw = (refs.text1FontSize && refs.text1FontSize.defaultValue) ? parseInt(refs.text1FontSize.defaultValue,10) : 60;
        const defaultSize2Raw = (refs.text2FontSize && refs.text2FontSize.defaultValue) ? parseInt(refs.text2FontSize.defaultValue,10) : 60;
        const defaultSize3Raw = (refs.text3FontSize && refs.text3FontSize.defaultValue) ? parseInt(refs.text3FontSize.defaultValue,10) : 60;
        const defaultSize1 = Math.max(20, Number.isNaN(defaultSize1Raw) ? 60 : defaultSize1Raw);
        const defaultSize2 = Math.max(20, Number.isNaN(defaultSize2Raw) ? 60 : defaultSize2Raw);
        const defaultSize3 = Math.max(20, Number.isNaN(defaultSize3Raw) ? 60 : defaultSize3Raw);
        if(state.texts[0]) state.texts[0].fontSize = defaultSize1;
        if(state.texts[1]) state.texts[1].fontSize = defaultSize2;
        if(state.texts[2]) state.texts[2].fontSize = defaultSize3;
        if(refs.text1OrientHorizontal) refs.text1OrientHorizontal.checked = true;
        if(refs.text1OrientVertical) refs.text1OrientVertical.checked = false;
        if(refs.text2OrientHorizontal) refs.text2OrientHorizontal.checked = true;
        if(refs.text2OrientVertical) refs.text2OrientVertical.checked = false;
        if(refs.text3OrientHorizontal) refs.text3OrientHorizontal.checked = true;
        if(refs.text3OrientVertical) refs.text3OrientVertical.checked = false;
        if(refs.text1FontSize) refs.text1FontSize.value = defaultSize1;
        if(refs.text2FontSize) refs.text2FontSize.value = defaultSize2;
        if(refs.text3FontSize) refs.text3FontSize.value = defaultSize3;
        if(refs.text1X) refs.text1X.value = Math.round(state.texts[0].x || 0);
        if(refs.text1Y) refs.text1Y.value = Math.round(state.texts[0].y || 0);
        if(refs.text2X) refs.text2X.value = Math.round(state.texts[1].x || 0);
        if(refs.text2Y) refs.text2Y.value = Math.round(state.texts[1].y || 0);
        if(refs.text3X) refs.text3X.value = Math.round(state.texts[2].x || 0);
        if(refs.text3Y) refs.text3Y.value = Math.round(state.texts[2].y || 0);
        state.ui = state.ui || {};
        const defaultBandColor = (refs.bandColor && refs.bandColor.defaultValue) ? refs.bandColor.defaultValue : '#ffffff';
        const defaultBandHeight = (refs.bandHeight && refs.bandHeight.defaultValue) ? parseInt(refs.bandHeight.defaultValue, 10) : 1000;
        state.ui.bandColor = defaultBandColor;
        state.ui.bandHeight = Number.isNaN(defaultBandHeight) ? 1000 : defaultBandHeight;
        state.ui.bandOrientation = 'horizontal';
        if(refs.bandColor) refs.bandColor.value = defaultBandColor;
        if(refs.bandHeight) refs.bandHeight.value = state.ui.bandHeight;
        if(refs.bandOrientHorizontal) refs.bandOrientHorizontal.checked = true;
        if(refs.bandOrientVertical) refs.bandOrientVertical.checked = false;
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    function canvasPointFromEvent(e){
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    function canvasPointFromTouch(touch){
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY };
    }

    function startDragAtPoint(p){
        const maxWidth = Math.max(200, state.width - 220 - 220);
        for(let i = state.texts.length - 1; i >= 0; i--){
            const t = state.texts[i];
            const style = getTextStyle(i);
            const fontSpec = style.fontSpec;
            const lineHeight = style.lineHeight;
            const textOrient = style.textOrientation;
            let w = 0; let h = 0;
            if(textOrient === 'vertical'){
                const cols = String(t.text || '').split('\n');
                let maxRows = 0;
                for(const col of cols){
                    const len = Array.from(col).length;
                    if(len > maxRows) maxRows = len;
                }
                w = Math.max(1, cols.length) * lineHeight;
                h = Math.max(1, maxRows) * lineHeight;
            } else {
                const block = utils.measureTextBlock(t.text, maxWidth, fontSpec, lineHeight);
                w = block.width || maxWidth;
                h = block.height;
            }
            const hitX = (textOrient === 'vertical') ? (t.x - (w - lineHeight)) : t.x;
            if(p.x >= hitX && p.x <= hitX + w && p.y >= t.y && p.y <= t.y + h){
                if(window.APP && window.APP.history && typeof window.APP.history.cloneStateForHistory === 'function'){
                    state._dragSnapshot = window.APP.history.cloneStateForHistory(window.APP.state);
                }
                state.dragging = { type:'text', index:i };
                state.dragOffset.x = p.x - t.x; state.dragOffset.y = p.y - t.y;
                return true;
            }
        }
        const imgs = ['mainPic','subPic','bgPic','wmPic','sysPic'].sort((a,b)=> (state.images[b] && state.images[b].z||0)-(state.images[a] && state.images[a].z||0));
        for(const k of imgs){
            const obj = state.images[k];
            if(!obj || !obj.img) continue;
            if(k === 'subPic'){
                const crop = obj.crop || {};
                const shape = (crop && typeof crop.shape === 'string') ? crop.shape : 'circle';
                let hitWidth, hitHeight, hitX, hitY;
                const sizePx = obj.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 300;
                if(shape === 'rectangle'){
                    hitWidth = obj.rectangleWidth || 1200;
                    hitHeight = obj.rectangleHeight || 1200;
                    hitX = obj.x + (sizePx - hitWidth) / 2;
                    hitY = obj.y + (sizePx - hitHeight) / 2;
                } else {
                    hitWidth = sizePx;
                    hitHeight = sizePx;
                    hitX = obj.x;
                    hitY = obj.y;
                }
                if(p.x >= hitX && p.x <= hitX + hitWidth && p.y >= hitY && p.y <= hitY + hitHeight){
                    if(window.APP && window.APP.history && typeof window.APP.history.cloneStateForHistory === 'function'){
                        state._dragSnapshot = window.APP.history.cloneStateForHistory(window.APP.state);
                    }
                    state.dragging = { type:'image', key:k };
                    state.dragOffset.x = p.x - obj.x; state.dragOffset.y = p.y - obj.y;
                    return true;
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
                if(window.APP && window.APP.history && typeof window.APP.history.cloneStateForHistory === 'function'){
                    state._dragSnapshot = window.APP.history.cloneStateForHistory(window.APP.state);
                }
                state.dragging = { type:'image', key:k };
                state.dragOffset.x = p.x - obj.x; state.dragOffset.y = p.y - obj.y;
                return true;
            }
        }
        return false;
    }

    function moveDragToPoint(p){
        if(!state.dragging) return;
        if(state.dragging.type === 'text'){
            const t = state.texts[state.dragging.index];
            t.x = p.x - state.dragOffset.x; t.y = p.y - state.dragOffset.y;
            if(state.dragging.index === 0){ if(refs.text1X) refs.text1X.value = Math.round(t.x); if(refs.text1Y) refs.text1Y.value = Math.round(t.y); }
            if(state.dragging.index === 1){ if(refs.text2X) refs.text2X.value = Math.round(t.x); if(refs.text2Y) refs.text2Y.value = Math.round(t.y); }
            if(state.dragging.index === 2){ if(refs.text3X) refs.text3X.value = Math.round(t.x); if(refs.text3Y) refs.text3Y.value = Math.round(t.y); }
        } else {
            const obj = state.images[state.dragging.key];
            obj.x = p.x - state.dragOffset.x; obj.y = p.y - state.dragOffset.y;
            setPosInputs(state.dragging.key);
        }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    function endDrag(){
        if(state.dragging && state._dragSnapshot && window.APP && window.APP.history && typeof window.APP.history.saveSnapshot === 'function'){
            window.APP.history.saveSnapshot(state._dragSnapshot);
        }
        state._dragSnapshot = null;
        state.dragging = null;
    }

    function applyZoomAtPoint(p, delta, deltaSub){
        const maxWidth = Math.max(200, state.width - 220 - 220);
        for(let i = state.texts.length - 1; i >= 0; i--){
            const t = state.texts[i];
            const style = getTextStyle(i);
            const fontSpec = style.fontSpec;
            const lineHeight = style.lineHeight;
            const textOrient = style.textOrientation;
            let w = 0; let h = 0;
            if(textOrient === 'vertical'){
                const cols = String(t.text || '').split('\n');
                let maxRows = 0;
                for(const col of cols){
                    const len = Array.from(col).length;
                    if(len > maxRows) maxRows = len;
                }
                w = Math.max(1, cols.length) * lineHeight;
                h = Math.max(1, maxRows) * lineHeight;
            } else {
                const block = utils.measureTextBlock(t.text, maxWidth, fontSpec, lineHeight);
                w = block.width || maxWidth;
                h = block.height;
            }
            const hitX = (textOrient === 'vertical') ? (t.x - (w - lineHeight)) : t.x;
            if(p.x >= hitX && p.x <= hitX + w && p.y >= t.y && p.y <= t.y + h){
                const curSize = (typeof t.fontSize === 'number') ? t.fontSize : 60;
                const newSize = Math.max(20, Math.min(300, Math.round(curSize * delta)));
                t.fontSize = newSize;
                if(i === 0 && refs.text1FontSize) refs.text1FontSize.value = newSize;
                if(i === 1 && refs.text2FontSize) refs.text2FontSize.value = newSize;
                if(i === 2 && refs.text3FontSize) refs.text3FontSize.value = newSize;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                return true;
            }
        }
        const imgs = ['mainPic','subPic','bgPic','wmPic','sysPic'].sort((a,b)=> (state.images[b] && state.images[b].z||0)-(state.images[a] && state.images[a].z||0));
        for(const k of imgs){
            const obj = state.images[k];
            if(!obj || !obj.img) continue;
            if(k === 'subPic'){
                const crop = obj.crop || {};
                const shape = (crop && typeof crop.shape === 'string') ? crop.shape : 'circle';
                let hitWidth, hitHeight, hitX, hitY;
                const sizePx = obj.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 300;
                if(shape === 'rectangle'){
                    hitWidth = obj.rectangleWidth || 1200;
                    hitHeight = obj.rectangleHeight || 1200;
                    hitX = obj.x + (sizePx - hitWidth) / 2;
                    hitY = obj.y + (sizePx - hitHeight) / 2;
                } else {
                    hitWidth = sizePx;
                    hitHeight = sizePx;
                    hitX = obj.x;
                    hitY = obj.y;
                }
                if(p.x >= hitX && p.x <= hitX + hitWidth && p.y >= hitY && p.y <= hitY + hitHeight){
                    const useDelta = (typeof deltaSub === 'number') ? deltaSub : delta;
                    if(shape === 'rectangle'){
                        const currentWidth = obj.rectangleWidth || 1200;
                        const currentHeight = obj.rectangleHeight || 1200;
                        let newHeight = Math.round(currentHeight * useDelta);
                        let newWidth = Math.round(currentWidth * useDelta);
                        const heightRatio = newHeight < 400 ? 400 / newHeight : (newHeight > 2500 ? 2500 / newHeight : 1);
                        const widthRatio = newWidth < 400 ? 400 / newWidth : (newWidth > 2020 ? 2020 / newWidth : 1);
                        const limitRatio = Math.min(heightRatio, widthRatio);
                        newHeight = Math.round(newHeight * limitRatio);
                        newWidth = Math.round(newWidth * limitRatio);
                        obj.rectangleHeight = newHeight;
                        obj.rectangleWidth = newWidth;
                        if(refs.subPicZ) refs.subPicZ.value = Math.round((newWidth / 1200) * 100);
                    } else {
                        let newSize = Math.round(hitWidth * useDelta);
                        if(window.APP && window.APP.subPicDefault){
                            newSize = Math.max(window.APP.subPicDefault.min, Math.min(window.APP.subPicDefault.max, newSize));
                        } else {
                            newSize = Math.max(10, Math.min(2000, newSize));
                        }
                        obj.sizePx = newSize;
                        const baseSize = (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) ? window.APP.subPicDefault.sizePx : 1200;
                        if(refs.subPicZ) refs.subPicZ.value = Math.round((newSize / baseSize) * 100);
                    }
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    return true;
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
                obj.scale = Math.max(0.01, Math.min(40, (obj.scale || 1) * delta));
                if(k === 'mainPic' && refs.mainPicZ) refs.mainPicZ.value = Math.round(obj.scale * 100);
                if(k === 'bgPic' && refs.bgPicZ) refs.bgPicZ.value = Math.round(obj.scale * 100);
                if(k === 'wmPic' && refs.wmPicZ) refs.wmPicZ.value = Math.round(obj.scale * 100);
                if(k === 'sysPic' && refs.sysPicZ) refs.sysPicZ.value = Math.round(obj.scale * 100);
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                return true;
            }
        }
        return false;
    }

    canvas.addEventListener('mousedown', e=>{
        try {
            const p = canvasPointFromEvent(e);
            startDragAtPoint(p);
        } catch(err){
            console.error('mousedown handler error', err);
        }
    });

    canvas.addEventListener('mousemove', e=>{
        try {
            if(!state.dragging) return;
            const p = canvasPointFromEvent(e);
            moveDragToPoint(p);
        } catch(err){
            console.error('mousemove handler error', err);
        }
    });
    canvas.addEventListener('mouseup', ()=> {
        endDrag();
    });
    canvas.addEventListener('mouseleave', ()=> {
        endDrag();
    });

    canvas.addEventListener('wheel', e=>{
        try {
            e.preventDefault();
            if(!state._wheelSnapshot && window.APP && window.APP.history && typeof window.APP.history.cloneStateForHistory === 'function'){
                state._wheelSnapshot = window.APP.history.cloneStateForHistory(window.APP.state);
            }
            if(state._wheelCommitTimer){
                clearTimeout(state._wheelCommitTimer);
            }
            state._wheelCommitTimer = setTimeout(()=>{
                if(state._wheelSnapshot && window.APP && window.APP.history && typeof window.APP.history.saveSnapshot === 'function'){
                    window.APP.history.saveSnapshot(state._wheelSnapshot);
                }
                state._wheelSnapshot = null;
                state._wheelCommitTimer = null;
            }, 200);
            const p = canvasPointFromEvent(e);
            const delta = e.deltaY < 0 ? 1.05 : 0.95;
            const deltaSub = e.deltaY < 0 ? 1.06 : 0.94;
            applyZoomAtPoint(p, delta, deltaSub);
        } catch(err){
            console.error('wheel handler error', err);
        }
    }, { passive:false });

    let touchMode = null;
    let pinchLastDist = 0;
    canvas.addEventListener('touchstart', e=>{
        try {
            if(e.touches.length === 1){
                touchMode = 'drag';
                const p = canvasPointFromTouch(e.touches[0]);
                startDragAtPoint(p);
                e.preventDefault();
            } else if(e.touches.length >= 2){
                touchMode = 'pinch';
                const t0 = e.touches[0];
                const t1 = e.touches[1];
                const dx = t0.clientX - t1.clientX;
                const dy = t0.clientY - t1.clientY;
                pinchLastDist = Math.hypot(dx, dy);
                if(!state._wheelSnapshot && window.APP && window.APP.history && typeof window.APP.history.cloneStateForHistory === 'function'){
                    state._wheelSnapshot = window.APP.history.cloneStateForHistory(window.APP.state);
                }
                e.preventDefault();
            }
        } catch(err){
            console.error('touchstart handler error', err);
        }
    }, { passive:false });

    canvas.addEventListener('touchmove', e=>{
        try {
            if(touchMode === 'drag' && e.touches.length === 1){
                const p = canvasPointFromTouch(e.touches[0]);
                moveDragToPoint(p);
                e.preventDefault();
                return;
            }
            if(touchMode === 'pinch' && e.touches.length >= 2){
                const t0 = e.touches[0];
                const t1 = e.touches[1];
                const dx = t0.clientX - t1.clientX;
                const dy = t0.clientY - t1.clientY;
                const dist = Math.hypot(dx, dy);
                if(pinchLastDist > 0){
                    const scale = dist / pinchLastDist;
                    const mid = { clientX: (t0.clientX + t1.clientX) / 2, clientY: (t0.clientY + t1.clientY) / 2 };
                    const p = canvasPointFromEvent(mid);
                    applyZoomAtPoint(p, scale, scale);
                    if(state._wheelCommitTimer){
                        clearTimeout(state._wheelCommitTimer);
                    }
                    state._wheelCommitTimer = setTimeout(()=>{
                        if(state._wheelSnapshot && window.APP && window.APP.history && typeof window.APP.history.saveSnapshot === 'function'){
                            window.APP.history.saveSnapshot(state._wheelSnapshot);
                        }
                        state._wheelSnapshot = null;
                        state._wheelCommitTimer = null;
                    }, 200);
                }
                pinchLastDist = dist;
                e.preventDefault();
            }
        } catch(err){
            console.error('touchmove handler error', err);
        }
    }, { passive:false });

    function endPinch(){
        if(state._wheelSnapshot && window.APP && window.APP.history && typeof window.APP.history.saveSnapshot === 'function'){
            window.APP.history.saveSnapshot(state._wheelSnapshot);
        }
        state._wheelSnapshot = null;
        if(state._wheelCommitTimer){
            clearTimeout(state._wheelCommitTimer);
            state._wheelCommitTimer = null;
        }
        pinchLastDist = 0;
    }

    canvas.addEventListener('touchend', e=>{
        try {
            if(touchMode === 'drag' && e.touches.length === 0){
                endDrag();
            }
            if(touchMode === 'pinch' && e.touches.length < 2){
                endPinch();
            }
            if(e.touches.length === 0){
                touchMode = null;
            }
        } catch(err){
            console.error('touchend handler error', err);
        }
    });

    canvas.addEventListener('touchcancel', ()=>{
        if(touchMode === 'drag') endDrag();
        if(touchMode === 'pinch') endPinch();
        touchMode = null;
    });

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
            setPosInputs('sysPic');
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
        setPosInputs('sysPic');
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
                    try { await document.fonts.ready; } catch(e){ }
                }
                if(window.APP && typeof window.APP.draw === 'function'){
                    await window.APP.draw();
                }
                const fmt = (refs.formatSel && refs.formatSel.value) || 'image/png';
                if(fmt === 'gif' && window.APP && window.APP.ui && typeof window.APP.ui.exportCanvasImage === 'function'){
                    try { await window.APP.ui.exportCanvasImage(); } catch(e){ }
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

    function startHistorySnapshot(el){
        if(!el || el._historySnapshot) return;
        if(window.APP && window.APP.history && typeof window.APP.history.cloneStateForHistory === 'function'){
            el._historySnapshot = window.APP.history.cloneStateForHistory(window.APP.state);
        }
    }
    function commitHistorySnapshot(el){
        if(!el || !el._historySnapshot) return;
        if(window.APP && window.APP.history && typeof window.APP.history.saveSnapshot === 'function'){
            window.APP.history.saveSnapshot(el._historySnapshot);
        }
        el._historySnapshot = null;
    }
    function bindHistoryStart(el){
        if(!el || el._historyStartBound) return;
        const start = ()=> startHistorySnapshot(el);
        el.addEventListener('pointerdown', start);
        el.addEventListener('mousedown', start);
        el.addEventListener('touchstart', start);
        el.addEventListener('keydown', start);
        el.addEventListener('focus', start);
        el._historyStartBound = true;
    }

    function setPosInputs(key){
        const map = {
            mainPic: { x: refs.mainPicX, y: refs.mainPicY, z: refs.mainPicZ },
            subPic: { x: refs.subPicX, y: refs.subPicY, z: refs.subPicZ },
            bgPic: { x: refs.bgPicX, y: refs.bgPicY, z: refs.bgPicZ },
            wmPic: { x: refs.wmPicX, y: refs.wmPicY, z: refs.wmPicZ },
            sysPic: { x: refs.sysPicX, y: refs.sysPicY, z: refs.sysPicZ }
        };
        const target = map[key];
        const obj = state.images && state.images[key];
        if(!target || !obj) return;
        if(target.x) target.x.value = Math.round(typeof obj.x === 'number' ? obj.x : 0);
        if(target.y) target.y.value = Math.round(typeof obj.y === 'number' ? obj.y : 0);
        if(target.z){
            if(key === 'subPic'){
                const baseSize = (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) ? window.APP.subPicDefault.sizePx : 1200;
                const shape = (obj.crop && typeof obj.crop.shape === 'string') ? obj.crop.shape : 'circle';
                if(shape === 'rectangle'){
                    const curW = (typeof obj.rectangleWidth === 'number') ? obj.rectangleWidth : 1200;
                    target.z.value = Math.round((curW / 1200) * 100);
                } else {
                    const curSize = (typeof obj.sizePx === 'number') ? obj.sizePx : baseSize;
                    target.z.value = Math.round((curSize / baseSize) * 100);
                }
            } else {
                const pct = Math.round((obj.scale || 1) * 100);
                target.z.value = pct;
            }
        }
    }

    function bindPosInputs(key, xEl, yEl, zEl){
        const obj = state.images && state.images[key];
        if(!obj) return;
        if(xEl && !xEl._bound){
            bindHistoryStart(xEl);
            xEl.addEventListener('input', ()=>{
                obj.x = parseInt(xEl.value,10) || 0;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            xEl.addEventListener('change', ()=>{ commitHistorySnapshot(xEl); });
            xEl._bound = true;
        }
        if(yEl && !yEl._bound){
            bindHistoryStart(yEl);
            yEl.addEventListener('input', ()=>{
                obj.y = parseInt(yEl.value,10) || 0;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            yEl.addEventListener('change', ()=>{ commitHistorySnapshot(yEl); });
            yEl._bound = true;
        }
        if(zEl && !zEl._bound){
            bindHistoryStart(zEl);
            zEl.addEventListener('input', ()=>{
                const pct = parseInt(zEl.value,10);
                if(Number.isNaN(pct)) return;
                if(key === 'subPic'){
                    const baseSize = (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) ? window.APP.subPicDefault.sizePx : 1200;
                    const shape = (obj.crop && typeof obj.crop.shape === 'string') ? obj.crop.shape : 'circle';
                    if(shape === 'rectangle'){
                        const nextW = Math.max(400, Math.min(2020, Math.round(1200 * (pct / 100))));
                        const nextH = Math.max(400, Math.min(2500, Math.round(1200 * (pct / 100))));
                        obj.rectangleWidth = nextW;
                        obj.rectangleHeight = nextH;
                        const subPicHeightPx = document.getElementById('subPicHeightPx');
                        const subPicHeightPxVal = document.getElementById('subPicHeightPxVal');
                        const subPicWidthPx = document.getElementById('subPicWidthPx');
                        const subPicWidthPxVal = document.getElementById('subPicWidthPxVal');
                        if(subPicHeightPx) subPicHeightPx.value = nextH;
                        if(subPicHeightPxVal) subPicHeightPxVal.textContent = String(nextH);
                        if(subPicWidthPx) subPicWidthPx.value = nextW;
                        if(subPicWidthPxVal) subPicWidthPxVal.textContent = String(nextW);
                    } else {
                        const nextSize = Math.max(window.APP.subPicDefault.min, Math.min(window.APP.subPicDefault.max, Math.round(baseSize * (pct / 100))));
                        obj.sizePx = nextSize;
                    }
                } else {
                    obj.scale = Math.max(0.01, Math.min(4.0, pct / 100));
                }
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            zEl.addEventListener('change', ()=>{ commitHistorySnapshot(zEl); });
            zEl._bound = true;
        }
        setPosInputs(key);
    }

    if(refs.subPicCropX) {
        bindHistoryStart(refs.subPicCropX);
        refs.subPicCropX.addEventListener('input', ()=>{ state.images.subPic.crop.cx = parseInt(refs.subPicCropX.value,10)/100; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.subPicCropX.addEventListener('change', ()=>{ commitHistorySnapshot(refs.subPicCropX); });
    }
    if(refs.subPicCropY) {
        bindHistoryStart(refs.subPicCropY);
        refs.subPicCropY.addEventListener('input', ()=>{ state.images.subPic.crop.cy = parseInt(refs.subPicCropY.value,10)/100; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.subPicCropY.addEventListener('change', ()=>{ commitHistorySnapshot(refs.subPicCropY); });
    }
    if(refs.subPicZoom) {
        bindHistoryStart(refs.subPicZoom);
        refs.subPicZoom.addEventListener('input', ()=>{ const pct = parseInt(refs.subPicZoom.value,10); if(refs.subPicZoomVal) refs.subPicZoomVal.textContent = pct + '%'; state.images.subPic.zoom = pct/100; if(refs.subPicZ) refs.subPicZ.value = pct; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.subPicZoom.addEventListener('change', ()=>{ commitHistorySnapshot(refs.subPicZoom); });
    }
    if(refs.subPicBorder) {
        bindHistoryStart(refs.subPicBorder);
        refs.subPicBorder.addEventListener('input', ()=>{ if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.subPicBorder.addEventListener('change', ()=>{ commitHistorySnapshot(refs.subPicBorder); });
    }
    if(refs.resetSubPicPos) refs.resetSubPicPos.addEventListener('click', ()=>{ if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state); state.images.subPic.x = window.APP.subPicDefault.x; state.images.subPic.y = window.APP.subPicDefault.y; state.images.subPic.sizePx = window.APP.subPicDefault.sizePx; state.images.subPic.rectangleWidth = 1200; state.images.subPic.rectangleHeight = 1200; state.images.subPic.crop = {cx:0.5,cy:0.33}; state.images.subPic.zoom = 1.0; state.images.subPic.bgOpacity = 1.0; if(refs.subPicCropX) refs.subPicCropX.value = 50; if(refs.subPicCropY) refs.subPicCropY.value = 33; if(refs.subPicZoom) refs.subPicZoom.value = 100; if(refs.subPicZoomVal) refs.subPicZoomVal.textContent='100%'; if(refs.subPicZ) refs.subPicZ.value = 100; if(refs.bgSubPic) refs.bgSubPic.value = '#FFFF00'; if(refs.bgSubPicAlpha) refs.bgSubPicAlpha.value = 100; if(refs.bgSubPicAlphaVal) refs.bgSubPicAlphaVal.textContent = '100%'; const subPicHeightPx = document.getElementById('subPicHeightPx'); const subPicHeightPxVal = document.getElementById('subPicHeightPxVal'); const subPicWidthPx = document.getElementById('subPicWidthPx'); const subPicWidthPxVal = document.getElementById('subPicWidthPxVal'); if(subPicHeightPx) subPicHeightPx.value = 1200; if(subPicHeightPxVal) subPicHeightPxVal.textContent = '1200'; if(subPicWidthPx) subPicWidthPx.value = 1200; if(subPicWidthPxVal) subPicWidthPxVal.textContent = '1200'; setPosInputs('subPic'); if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });

    if(refs.text1El) {
        refs.text1El.addEventListener('input', ()=>{ if(!refs.text1El._historySnapshot) startHistorySnapshot(refs.text1El); state.texts[0].text = refs.text1El.value; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.text1El.addEventListener('blur', ()=>{ commitHistorySnapshot(refs.text1El); });
    }
    if(refs.text2El) {
        refs.text2El.addEventListener('input', ()=>{ if(!refs.text2El._historySnapshot) startHistorySnapshot(refs.text2El); state.texts[1].text = refs.text2El.value; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.text2El.addEventListener('blur', ()=>{ commitHistorySnapshot(refs.text2El); });
    }
    if(refs.text3El) {
        refs.text3El.addEventListener('input', ()=>{ if(!refs.text3El._historySnapshot) startHistorySnapshot(refs.text3El); state.texts[2].text = refs.text3El.value; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.text3El.addEventListener('blur', ()=>{ commitHistorySnapshot(refs.text3El); });
    }

    function bindTextPosInputs(idx, xEl, yEl){
        if(!state.texts || !state.texts[idx]) return;
        if(xEl && !xEl._bound){
            bindHistoryStart(xEl);
            xEl.addEventListener('input', ()=>{
                state.texts[idx].x = parseInt(xEl.value,10) || 0;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            xEl.addEventListener('change', ()=>{ commitHistorySnapshot(xEl); });
            xEl._bound = true;
        }
        if(yEl && !yEl._bound){
            bindHistoryStart(yEl);
            yEl.addEventListener('input', ()=>{
                state.texts[idx].y = parseInt(yEl.value,10) || 0;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            yEl.addEventListener('change', ()=>{ commitHistorySnapshot(yEl); });
            yEl._bound = true;
        }
        if(xEl) xEl.value = Math.round(state.texts[idx].x || 0);
        if(yEl) yEl.value = Math.round(state.texts[idx].y || 0);
    }

    bindTextPosInputs(0, refs.text1X, refs.text1Y);
    bindTextPosInputs(1, refs.text2X, refs.text2Y);
    bindTextPosInputs(2, refs.text3X, refs.text3Y);

    function bindTextStyleControls(idx, controls){
        if(!state.texts || !state.texts[idx] || !controls) return;
        const getTextRef = ()=> (state.texts && state.texts[idx]) ? state.texts[idx] : null;
        const initText = getTextRef();
        if(initText) normalizeTextStyle(initText);

        if(controls.fontSelect && !controls.fontSelect._bound){
            bindHistoryStart(controls.fontSelect);
            const applyFontChange = ()=>{
                try {
                    const t = getTextRef();
                    if(!t) return;
                    const f = (controls.fontSelect.value || 'Arial').toString();
                    t.fontFamily = f;
                    if (document && document.fonts && typeof document.fonts.load === 'function') {
                        document.fonts.load(`16px "${f}"`).then(()=>{
                            if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                        }).catch(()=>{
                            if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                        });
                    } else {
                        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                    }
                } catch(e){
                    if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
                }
            };
            controls.fontSelect.addEventListener('change', applyFontChange);
            controls.fontSelect.addEventListener('input', applyFontChange);
            controls.fontSelect.addEventListener('change', ()=>{ commitHistorySnapshot(controls.fontSelect); });
            controls.fontSelect._bound = true;
        }

        if(controls.fontSize && !controls.fontSize._bound){
            bindHistoryStart(controls.fontSize);
            controls.fontSize.addEventListener('input', ()=>{
                const t = getTextRef();
                if(!t) return;
                const v = parseInt(controls.fontSize.value,10);
                if(Number.isNaN(v)) return;
                t.fontSize = v;
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            controls.fontSize.addEventListener('change', ()=>{
                const t = getTextRef();
                if(!t) return;
                const v = parseInt(controls.fontSize.value,10);
                const clamped = Number.isNaN(v) ? 20 : Math.max(20, v);
                t.fontSize = clamped;
                controls.fontSize.value = clamped;
                commitHistorySnapshot(controls.fontSize);
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            controls.fontSize._bound = true;
        }

        if(controls.fontColor && !controls.fontColor._bound){
            bindHistoryStart(controls.fontColor);
            controls.fontColor.addEventListener('input', ()=>{
                const t = getTextRef();
                if(!t) return;
                t.fontColor = controls.fontColor.value || '#000000';
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            controls.fontColor.addEventListener('change', ()=>{
                const t = getTextRef();
                if(!t) return;
                t.fontColor = controls.fontColor.value || '#000000';
                commitHistorySnapshot(controls.fontColor);
                if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
            });
            controls.fontColor._bound = true;
        }

        function setOrientation(orient){
            const t = getTextRef();
            if(!t) return;
            t.textOrientation = (orient === 'vertical') ? 'vertical' : 'horizontal';
            if(controls.orientH) controls.orientH.checked = (t.textOrientation === 'horizontal');
            if(controls.orientV) controls.orientV.checked = (t.textOrientation === 'vertical');
            if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
        }

        if(controls.orientH && !controls.orientH._bound){
            bindHistoryStart(controls.orientH);
            controls.orientH.addEventListener('change', function(){
                if(this.checked) setOrientation('horizontal');
                commitHistorySnapshot(controls.orientH);
            });
            controls.orientH._bound = true;
        }
        if(controls.orientV && !controls.orientV._bound){
            bindHistoryStart(controls.orientV);
            controls.orientV.addEventListener('change', function(){
                if(this.checked) setOrientation('vertical');
                commitHistorySnapshot(controls.orientV);
            });
            controls.orientV._bound = true;
        }

        if(controls.fontSelect && controls.fontSelect.value) {
            const t = getTextRef();
            if(t) t.fontFamily = (controls.fontSelect.value || 'Arial').toString();
        }
        if(controls.fontSize && controls.fontSize.value){
            const v = parseInt(controls.fontSize.value,10);
            const t = getTextRef();
            if(!Number.isNaN(v) && t) t.fontSize = v;
        }
        if(controls.fontColor && controls.fontColor.value){
            const t = getTextRef();
            if(t) t.fontColor = controls.fontColor.value || t.fontColor || '#000000';
        }
        if(controls.orientV && controls.orientV.checked){
            const t = getTextRef();
            if(t) t.textOrientation = 'vertical';
        } else if(controls.orientH){
            const t = getTextRef();
            if(t) t.textOrientation = 'horizontal';
        }
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    }

    bindTextStyleControls(0, {
        fontSelect: refs.text1FontSelect,
        fontSize: refs.text1FontSize,
        fontColor: refs.text1FontColor,
        orientH: refs.text1OrientHorizontal,
        orientV: refs.text1OrientVertical
    });
    bindTextStyleControls(1, {
        fontSelect: refs.text2FontSelect,
        fontSize: refs.text2FontSize,
        fontColor: refs.text2FontColor,
        orientH: refs.text2OrientHorizontal,
        orientV: refs.text2OrientVertical
    });
    bindTextStyleControls(2, {
        fontSelect: refs.text3FontSelect,
        fontSize: refs.text3FontSize,
        fontColor: refs.text3FontColor,
        orientH: refs.text3OrientHorizontal,
        orientV: refs.text3OrientVertical
    });

    if(refs.bgSubPicAlpha) {
        bindHistoryStart(refs.bgSubPicAlpha);
        refs.bgSubPicAlpha.addEventListener('input', ()=>{ state.images.subPic.bgOpacity = parseInt(refs.bgSubPicAlpha.value,10)/100; if(refs.bgSubPicAlphaVal) refs.bgSubPicAlphaVal.textContent = refs.bgSubPicAlpha.value + '%'; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.bgSubPicAlpha.addEventListener('change', ()=>{ commitHistorySnapshot(refs.bgSubPicAlpha); });
    }
    if(refs.wmPicOpacity) {
        bindHistoryStart(refs.wmPicOpacity);
        refs.wmPicOpacity.addEventListener('input', ()=>{ state.images.wmPic.opacity = parseInt(refs.wmPicOpacity.value,10)/100; if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
        refs.wmPicOpacity.addEventListener('change', ()=>{ commitHistorySnapshot(refs.wmPicOpacity); });
    }

    bindPosInputs('mainPic', refs.mainPicX, refs.mainPicY, refs.mainPicZ);
    bindPosInputs('subPic', refs.subPicX, refs.subPicY, refs.subPicZ);
    bindPosInputs('bgPic', refs.bgPicX, refs.bgPicY, refs.bgPicZ);
    bindPosInputs('wmPic', refs.wmPicX, refs.wmPicY, refs.wmPicZ);
    bindPosInputs('sysPic', refs.sysPicX, refs.sysPicY, refs.sysPicZ);

    setPosInputs('subPic');
    setPosInputs('wmPic');
    setPosInputs('sysPic');

    if(refs.resetMainPicPos) refs.resetMainPicPos.addEventListener('click', ()=>{ if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state); state.images.mainPic.x = window.APP.refPos.mainPic.x; state.images.mainPic.y = window.APP.refPos.mainPic.y; if(typeof state.images.mainPic.initialScale==='number') state.images.mainPic.scale = state.images.mainPic.initialScale; setPosInputs('mainPic'); if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });
    if(refs.resetBgPicPos) refs.resetBgPicPos.addEventListener('click', ()=>{ if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state); if(state.images.bgPic.img && window.APP && window.APP.ui && typeof window.APP.ui.fitBgPicToCanvas === 'function') window.APP.ui.fitBgPicToCanvas(state.images.bgPic.img); setPosInputs('bgPic'); if(window.APP && typeof window.APP.draw === 'function') window.APP.draw(); });

    if(refs.resetWmPicPos) refs.resetWmPicPos.addEventListener('click', ()=>{
        if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
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
        setPosInputs('wmPic');
        if(window.APP && typeof window.APP.draw === 'function') window.APP.draw();
    });

    function ensureSysPicUIBindings(){
        try {
            state.images = state.images || {};
            state.images.sysPic = state.images.sysPic || { img:null, filename:null, thumb:null, info:{}, x:40, y: Math.round((state.height || 2000) - 200 - 40), scale:1, z:0 };
            if(typeof state.images.sysPic.x !== 'number') state.images.sysPic.x = 40;
            if(typeof state.images.sysPic.y !== 'number') state.images.sysPic.y = Math.round((state.height || 2000) - 200 - 40);
            if(typeof state.images.sysPic.scale !== 'number') state.images.sysPic.scale = 1;
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
                resetBtn.addEventListener('click', ()=>{ if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state); resetSysPicToDefault(); });
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
                setPosInputs('wmPic');
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
        const style = getTextStyle(0);
        const lineHeight = style.lineHeight;
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
        const resetText1PosBtn = document.getElementById('resetText1PosBtn');
        if(resetText1PosBtn){
            resetText1PosBtn.addEventListener('click', ()=>{
                if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
                resetSingleTextToDefault(0);
            });
        }
        const resetText2PosBtn = document.getElementById('resetText2PosBtn');
        if(resetText2PosBtn){
            resetText2PosBtn.addEventListener('click', ()=>{
                if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
                resetSingleTextToDefault(1);
            });
        }
        const resetText3PosBtn = document.getElementById('resetText3PosBtn');
        if(resetText3PosBtn){
            resetText3PosBtn.addEventListener('click', ()=>{
                if(window.APP && window.APP.history) window.APP.history.saveState(window.APP.state);
                resetSingleTextToDefault(2);
            });
        }
        ensureSysPicUIBindings();
        setPosInputs('sysPic');
    })();
})();