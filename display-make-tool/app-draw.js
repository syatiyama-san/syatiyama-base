// app-draw.js

(function(){
    const state = window.APP.state;
    const utils = window.APP.utils;

    function findCanvasElement(){
        if(window.APP){
            if(window.APP.canvasEl) return window.APP.canvasEl;
            if(window.APP.canvas) return window.APP.canvas;
        }
        return document.querySelector('canvas');
    }

    function ensureCanvasAndContext(){
        try {
            const canvas = findCanvasElement();
            if(!canvas) return null;
            const needResize = (canvas.width !== state.width) || (canvas.height !== state.height);
            if(needResize){
                canvas.width = state.width;
                canvas.height = state.height;
            }
            if(!window.APP.ctx || window.APP.ctx.canvas !== canvas){
                window.APP.ctx = canvas.getContext('2d', { willReadFrequently: true });
            }
            return window.APP.ctx;
        } catch(e){
            console.warn('ensureCanvasAndContext error', e);
            return window.APP.ctx || null;
        }
    }

    async function draw(){
        const ctx = ensureCanvasAndContext();
        if(!ctx){
            return;
        }
        try { await (utils && typeof utils.loadGoogleFontIfNeeded === 'function' ? utils.loadGoogleFontIfNeeded() : Promise.resolve()); } catch(e){ /* ignore */ }
        try {
            ctx.clearRect(0,0,state.width,state.height);
            ctx.fillStyle = '#ffffff';
            ctx.fillRect(0,0,state.width,state.height);
        } catch(e){
            console.error('canvas clear/fill error', e);
        }
        const ui = window.APP.ui || {};
        const uiRefs = ui.refs || {};
        const bgColor = (uiRefs && uiRefs.bgSubPic) ? uiRefs.bgSubPic.value : '#ffffff';
        const bandCol = (uiRefs && uiRefs.bandColor) ? uiRefs.bandColor.value : '#ffffff';
        const bandHVal = (uiRefs && uiRefs.bandHeight) ? (parseInt(uiRefs.bandHeight.value,10) || 100) : 100;
        const orient = (state.ui && state.ui.bandOrientation) ? state.ui.bandOrientation : 'horizontal';
        try {
            const bgPic = state.images && state.images.bgPic;
            if(bgPic && bgPic.img){
                const w4 = bgPic.img.width * (bgPic.scale || 1);
                const h4 = bgPic.img.height * (bgPic.scale || 1);
                ctx.drawImage(bgPic.img, bgPic.x || 0, bgPic.y || 0, w4, h4);
            }
        } catch(e){
            console.error('draw bgPic error', e);
        }
        try {
            ctx.save();
            ctx.fillStyle = bandCol || '#ffffff';
            if (orient === 'vertical') {
                const bw = Math.max(0, Math.min(state.width, bandHVal));
                ctx.fillRect(0, 0, bw, state.height);
            } else {
                const bh = Math.max(0, Math.min(state.height, bandHVal));
                ctx.fillRect(0, state.height - bh, state.width, bh);
            }
            ctx.restore();
        } catch(e){
            console.error('draw band error', e);
        }
        try {
            const overlay = state.images && state.images.overlayAsset;
            if (overlay && overlay.img) {
                const desiredW = overlay.widthPx || 700;
                const maxAllowedW = Math.max(0, state.width - (overlay.marginLeft || 20) - 20);
                const drawW = Math.min(desiredW, maxAllowedW);
                const aspect = overlay.img.width ? (overlay.img.height / overlay.img.width) : 1;
                const drawH = Math.round(drawW * aspect);
                const baseLeft = (overlay.marginLeft != null) ? overlay.marginLeft : 20;
                const baseBottomOffset = (overlay.marginBottom != null) ? overlay.marginBottom : 24;
                const offsetX = 12;
                const offsetY = 12;
                const x = baseLeft + offsetX;
                const y = state.height - drawH - baseBottomOffset - offsetY;
                ctx.save();
                ctx.globalCompositeOperation = 'source-over';
                ctx.globalAlpha = 1.0;
                ctx.drawImage(overlay.img, x, y, drawW, drawH);
                ctx.restore();
            }
        } catch (e) {
            console.error('overlayAsset draw error', e);
        }
        try {
            const sysPic = state.images && state.images.sysPic;
            if(sysPic && sysPic.img){
                const img = sysPic.img;
                const scale = (typeof sysPic.scale === 'number') ? sysPic.scale : 1;
                const drawW = Math.round(img.width * scale);
                const drawH = Math.round(img.height * scale);
                const margin = 40;
                const dx = (typeof sysPic.x === 'number') ? sysPic.x : margin;
                const dy = (typeof sysPic.y === 'number') ? sysPic.y : Math.round(state.height - drawH - margin);
                const opacity = (typeof sysPic.opacity === 'number') ? sysPic.opacity : 1.0;
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(img, dx, dy, drawW, drawH);
                ctx.restore();
            }
        } catch(e){
            console.error('draw sysPic error', e);
        }
        try {
            const subPic = state.images && state.images.subPic;
            if(subPic && subPic.img){
                const sizePx = subPic.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 200;
                const drawX = (typeof subPic.x === 'number') ? subPic.x : 0;
                const drawY = (typeof subPic.y === 'number') ? subPic.y : 0;
                const radius = sizePx / 2;
                const clipCx = drawX + radius;
                const clipCy = drawY + radius;
                const baseSrcSize = Math.min(subPic.img.width, subPic.img.height);
                const zoom = subPic.zoom && subPic.zoom > 0 ? subPic.zoom : 1.0;
                let srcSize = Math.round(baseSrcSize / zoom);
                srcSize = Math.max(8, Math.min(baseSrcSize, srcSize));
                const crop = subPic.crop || {};
                const centerX = (typeof crop.cx === 'number') ? Math.round(crop.cx * subPic.img.width) : Math.round(subPic.img.width / 2);
                let centerY;
                if (typeof crop.cy === 'number') {
                    centerY = (crop.cy <= 1) ? Math.round(crop.cy * subPic.img.height) : Math.round(crop.cy);
                } else {
                    centerY = Math.round(subPic.img.height / 3);
                }
                let srcX = Math.round(centerX - srcSize / 2);
                let srcY = Math.round(centerY - srcSize / 2);
                if(srcX < 0) srcX = 0; if(srcY < 0) srcY = 0;
                if(srcX + srcSize > subPic.img.width) srcX = subPic.img.width - srcSize;
                if(srcY + srcSize > subPic.img.height) srcY = subPic.img.height - srcSize;
                const shape = (crop && typeof crop.shape === 'string') ? crop.shape : 'circle';
                ctx.save();
                if (shape === 'circle') {
                    ctx.beginPath(); ctx.arc(clipCx, clipCy, radius, 0, Math.PI * 2); ctx.closePath();
                    ctx.fillStyle = bgColor || '#ffffff';
                    ctx.fill();
                    ctx.beginPath(); ctx.arc(clipCx, clipCy, radius, 0, Math.PI * 2); ctx.closePath();
                    ctx.clip();
                } else if (shape === 'diamond') {
                    ctx.beginPath();
                    ctx.moveTo(clipCx, clipCy - radius);
                    ctx.lineTo(clipCx + radius, clipCy);
                    ctx.lineTo(clipCx, clipCy + radius);
                    ctx.lineTo(clipCx - radius, clipCy);
                    ctx.closePath();
                    ctx.fillStyle = bgColor || '#ffffff';
                    ctx.fill();
                    ctx.clip();
                } else {
                    ctx.beginPath(); ctx.arc(clipCx, clipCy, radius, 0, Math.PI * 2); ctx.closePath();
                    ctx.fillStyle = bgColor || '#ffffff';
                    ctx.fill();
                    ctx.beginPath(); ctx.arc(clipCx, clipCy, radius, 0, Math.PI * 2); ctx.closePath();
                    ctx.clip();
                }
                ctx.drawImage(subPic.img, srcX, srcY, srcSize, srcSize, drawX, drawY, sizePx, sizePx);
                ctx.restore();
                let strokePx = (subPic && typeof subPic.borderWidth === 'number') ? subPic.borderWidth : ((uiRefs && uiRefs.subPicBorder) ? (parseInt(uiRefs.subPicBorder.value,10) || 0) : 0);
                strokePx = Math.max(0, Math.min(100, strokePx));
                const strokeColor = (subPic && typeof subPic.borderColor === 'string') ? subPic.borderColor : ((uiRefs && uiRefs.subPicBorderColor) ? (uiRefs.subPicBorderColor.value || '#000000') : '#000000');
                if(strokePx > 0){
                    ctx.beginPath();
                    if (shape === 'circle') {
                        ctx.arc(clipCx, clipCy, radius, 0, Math.PI * 2);
                    } else if (shape === 'diamond') {
                        ctx.moveTo(clipCx, clipCy - radius);
                        ctx.lineTo(clipCx + radius, clipCy);
                        ctx.lineTo(clipCx, clipCy + radius);
                        ctx.lineTo(clipCx - radius, clipCy);
                        ctx.closePath();
                    } else {
                        ctx.arc(clipCx, clipCy, radius, 0, Math.PI * 2);
                    }
                    ctx.lineWidth = strokePx;
                    ctx.strokeStyle = strokeColor;
                    ctx.stroke();
                }
            }
        } catch(e){
            console.error('draw subPic error', e);
        }
        try {
            const mainPic = state.images && state.images.mainPic;
            if(mainPic && mainPic.img){
                const w1 = mainPic.img.width * (mainPic.scale || 1);
                const h1 = mainPic.img.height * (mainPic.scale || 1);
                ctx.drawImage(mainPic.img, mainPic.x || 0, mainPic.y || 0, w1, h1);
            }
        } catch(e){
            console.error('draw mainPic error', e);
        }
        try {
            const sysPic = state.images && state.images.sysPic;
            if(sysPic && sysPic.img){
                const img = sysPic.img;
                const scale = (typeof sysPic.scale === 'number') ? sysPic.scale : 1;
                const drawW = Math.round(img.width * scale);
                const drawH = Math.round(img.height * scale);
                const margin = 40;
                const dx = (typeof sysPic.x === 'number') ? sysPic.x : margin;
                const dy = (typeof sysPic.y === 'number') ? sysPic.y : Math.round(state.height - drawH - margin);
                const opacity = (typeof sysPic.opacity === 'number') ? sysPic.opacity : 1.0;
                ctx.save();
                ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
                ctx.globalCompositeOperation = 'source-over';
                ctx.drawImage(img, dx, dy, drawW, drawH);
                ctx.restore();
            }
        } catch(e){
            console.error('draw sysPic error', e);
        }
        try {
            const size = (uiRefs && uiRefs.fontSizeEl) ? (parseInt(uiRefs.fontSizeEl.value,10) || 60) : 60;
            const color = (uiRefs && uiRefs.fontColorEl) ? uiRefs.fontColorEl.value || '#000000' : '#000000';
            const font = (uiRefs && uiRefs.fontSelect) ? uiRefs.fontSelect.value || 'Arial' : 'Arial';
            const fontSpec = `${size}px "${font}"`;
            const lineHeight = Math.round(size * 1.15);
            ctx.textBaseline = 'top';
            ctx.fillStyle = color;
            ctx.font = fontSpec;
            ctx.shadowColor = 'rgba(0,0,0,0.3)';
            ctx.shadowBlur = 8;
            const margin = 220;
            const maxWidth = Math.max(200, state.width - margin - 220);
            for(let i = 0; i < (state.texts || []).length; i++){
                const t = state.texts[i];
                const block = utils.measureTextBlock ? utils.measureTextBlock(t.text, maxWidth, fontSpec, lineHeight) : { lines: [t.text] };
                const lines = block.lines || [];
                for(let li = 0; li < lines.length; li++){
                    ctx.fillText(lines[li], t.x, t.y + li * lineHeight);
                }
            }
            ctx.shadowBlur = 0;
        } catch(e){
            console.error('draw texts error', e);
        }
        try {
            const wmPic = state.images && state.images.wmPic;
            if (wmPic && wmPic.img) {
                ctx.save();
                ctx.globalAlpha = (wmPic.opacity != null) ? wmPic.opacity : 0.5;
                const w5 = wmPic.img.width * (wmPic.scale || 1);
                const h5 = wmPic.img.height * (wmPic.scale || 1);
                ctx.drawImage(wmPic.img, wmPic.x || 0, wmPic.y || 0, w5, h5);
                ctx.restore();
            }
        } catch (e) {
            console.error('draw wmPic error', e);
        }

        if(state.hovering) {
            if(state.hovering.type === 'text') {
                const t = state.texts[state.hovering.index];
                const size = (uiRefs && uiRefs.fontSizeEl) ? (parseInt(uiRefs.fontSizeEl.value,10) || 60) : 60;
                const font = (uiRefs && uiRefs.fontSelect) ? uiRefs.fontSelect.value || 'Arial' : 'Arial';
                const fontSpec = `${size}px "${font}"`;
                const lineHeight = Math.round(size * 1.15);
                const maxWidth = Math.max(200, state.width - 220 - 220);
                const block = utils.measureTextBlock ? utils.measureTextBlock(t.text, maxWidth, fontSpec, lineHeight) : { lines: [t.text] };
                const w = block.width || maxWidth;
                const h = block.height || lineHeight;
                
                ctx.save();
                ctx.fillStyle = 'rgba(70, 130, 180, 0.5)';
                ctx.fillRect(t.x - 5, t.y - 5, w + 10, h + 10);
                ctx.strokeStyle = 'rgba(70, 130, 180, 0.9)';
                ctx.lineWidth = 2;
                ctx.strokeRect(t.x - 5, t.y - 5, w + 10, h + 10);
                ctx.restore();
            } else if(state.hovering.type === 'image') {
                const obj = state.images[state.hovering.key];
                if(obj && obj.img) {
                    ctx.save();
                    ctx.strokeStyle = 'rgba(70, 130, 180, 0.9)';
                    ctx.lineWidth = 4;
                    ctx.setLineDash([10, 5]);
                    
                    ctx.fillStyle = 'rgba(70, 130, 180, 0.5)';
                    
                    if(state.hovering.key === 'subPic'){
                        const sizePx = obj.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 200;
                        const radius = sizePx / 2;
                        const clipCx = obj.x + radius;
                        const clipCy = obj.y + radius;
                        const crop = obj.crop || {};
                        const shape = (crop && typeof crop.shape === 'string') ? crop.shape : 'circle';
                        
                        if (shape === 'circle') {
                            ctx.beginPath();
                            ctx.arc(clipCx, clipCy, radius + 2, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        } else if (shape === 'diamond') {
                            ctx.beginPath();
                            ctx.moveTo(clipCx, clipCy - radius - 2);
                            ctx.lineTo(clipCx + radius + 2, clipCy);
                            ctx.lineTo(clipCx, clipCy + radius + 2);
                            ctx.lineTo(clipCx - radius - 2, clipCy);
                            ctx.closePath();
                            ctx.fill();
                            ctx.stroke();
                        } else {
                            ctx.beginPath();
                            ctx.arc(clipCx, clipCy, radius + 2, 0, Math.PI * 2);
                            ctx.fill();
                            ctx.stroke();
                        }
                    } else {
                        const w = (obj.img.width || 0) * (obj.scale || 1);
                        const h = (obj.img.height || 0) * (obj.scale || 1);
                        ctx.fillRect(obj.x - 2, obj.y - 2, w + 4, h + 4);
                        ctx.strokeRect(obj.x - 2, obj.y - 2, w + 4, h + 4);
                    }
                    ctx.restore();
                }
            }
        }
    }

    window.APP = window.APP || {};
    window.APP.draw = draw;
    window.APP.ensureCanvasAndContext = ensureCanvasAndContext;
})();
