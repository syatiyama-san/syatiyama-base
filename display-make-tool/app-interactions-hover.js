// app-interactions-hover.js

(function(){
    const canvas = window.APP && window.APP.canvas;
    const state = window.APP && window.APP.state;

    if(!canvas || !state){
        console.error('app-interactions-hover: required globals missing (canvas/state).');
        return;
    }

    function canvasPointFromEvent(e){
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    }

    function getTextStyle(t){
        const fontSize = (t && typeof t.fontSize === 'number') ? t.fontSize : ((state.ui && typeof state.ui.fontSize === 'number') ? state.ui.fontSize : 60);
        const fontFamily = (t && typeof t.fontFamily === 'string') ? t.fontFamily : ((state.ui && typeof state.ui.fontFamily === 'string') ? state.ui.fontFamily : 'Arial');
        const textOrientation = (t && t.textOrientation === 'vertical') ? 'vertical' : ((state.ui && state.ui.textOrientation === 'vertical') ? 'vertical' : 'horizontal');
        const fontSpec = `${fontSize}px "${fontFamily}"`;
        const lineHeight = Math.round(fontSize * 1.15);
        return { fontSpec, lineHeight, textOrientation };
    }

    function checkHover(p){
        const utils = window.APP.utils || {};
        const maxWidth = Math.max(200, state.width - 220 - 220);
        
        for(let i = state.texts.length - 1; i >= 0; i--){
            const t = state.texts[i];
            const style = getTextStyle(t);
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
                const block = utils.measureTextBlock ? utils.measureTextBlock(t.text, maxWidth, fontSpec, lineHeight) : { lines: [t.text] };
                w = block.width || maxWidth;
                h = block.height || lineHeight;
            }
            const hitX = (textOrient === 'vertical') ? (t.x - (w - lineHeight)) : t.x;
            if(p.x >= hitX && p.x <= hitX + w && p.y >= t.y && p.y <= t.y + h){
                return { type: 'text', index: i };
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
                
                const sizePx = obj.sizePx || (window.APP && window.APP.subPicDefault && window.APP.subPicDefault.sizePx) || 200;
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
                    return { type: 'image', key: k };
                }
                continue;
            }
            
            const w = (obj.img.width || 0) * (obj.scale || 1);
            const h = (obj.img.height || 0) * (obj.scale || 1);
            if(p.x >= obj.x && p.x <= obj.x + w && p.y >= obj.y && p.y <= obj.y + h){
                return { type: 'image', key: k };
            }
        }

        return null;
    }

    canvas.addEventListener('mousemove', e => {
        try {
            const p = canvasPointFromEvent(e);
            const hoverTarget = checkHover(p);
            
            if(hoverTarget){
                state.hovering = hoverTarget;
            } else {
                state.hovering = null;
            }
            
            if(window.APP && typeof window.APP.draw === 'function') {
                window.APP.draw();
            }
        } catch(err){
            console.error('hover mousemove handler error', err);
        }
    });

    canvas.addEventListener('mouseleave', () => {
        try {
            state.hovering = null;
            if(window.APP && typeof window.APP.draw === 'function') {
                window.APP.draw();
            }
        } catch(err){
            console.error('hover mouseleave handler error', err);
        }
    });

    const originalMouseDown = canvas.onmousedown;
    canvas.onmousedown = function(e){
        state.hovering = null;
        if(originalMouseDown) originalMouseDown.call(this, e);
    };

    const originalMouseUp = canvas.onmouseup;
    canvas.onmouseup = function(e){
        if(originalMouseUp) originalMouseUp.call(this, e);
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        if(mouseX >= 0 && mouseX <= rect.width && mouseY >= 0 && mouseY <= rect.height){
            const p = canvasPointFromEvent(e);
            const hoverTarget = checkHover(p);
            if(hoverTarget){
                state.hovering = hoverTarget;
                if(window.APP && typeof window.APP.draw === 'function') {
                    window.APP.draw();
                }
            }
        }
    };
})();
