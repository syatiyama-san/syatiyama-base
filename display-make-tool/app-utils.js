// app-utils.js

(function(){
    const ctx = window.APP.ctx;
    const state = window.APP.state;
    const fontOptions = window.APP.fontOptions;

    function populateFontSelect(selEl){
        selEl.innerHTML = '';
        const sortedFonts = (fontOptions || []).slice().sort((a,b)=> (a || '').localeCompare((b || ''), 'en'));
        for(const f of sortedFonts){
            const opt = document.createElement('option');
            opt.value = f; opt.textContent = f;
            selEl.appendChild(opt);
        }
    }

    let _fontsLoaded = false;
    async function loadGoogleFontIfNeeded(){
        if(_fontsLoaded) return;
        try {
            await document.fonts.load('16px "Zen Old Mincho"');
            await Promise.all([
                document.fonts.load('16px "Noto Sans JP"').catch(()=>{}),
                document.fonts.load('16px "Noto Serif JP"').catch(()=>{}),
                document.fonts.load('16px "Kiwi Maru"').catch(()=>{}),
                document.fonts.load('16px "Hina Mincho"').catch(()=>{}),
                document.fonts.load('16px "Kaisei Decol"').catch(()=>{}),
                document.fonts.load('16px "Mochiy Pop One"').catch(()=>{}),
                document.fonts.load('16px "Yomogi"').catch(()=>{}),
                document.fonts.load('16px "Pacifico"').catch(()=>{}),
                document.fonts.load('16px "Ballet"').catch(()=>{})
            ]);
        } catch(e){}
        _fontsLoaded = true;
    }

    function loadImageFromFile(file, callback){
        const reader = new FileReader();
        reader.onload = e => {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = () => callback(img, e.target.result);
            img.onerror = () => callback(img, e.target.result);
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function wrapTextLines(text, maxWidth, fontSpec){
        const paragraphs = text.split('\n');
        const lines = [];
        ctx.save();
        ctx.font = fontSpec;
        for(const p of paragraphs){
            if(p === '') { lines.push(''); continue; }
            const words = p.split(' ');
            if(words.length === 1){
                let cur = '';
                for(const ch of p){
                    const test = cur + ch;
                    if(ctx.measureText(test).width > maxWidth && cur !== ''){
                        lines.push(cur); cur = ch;
                    } else cur = test;
                }
                if(cur !== '') lines.push(cur);
            } else {
                let cur = '';
                for(const w of words){
                    const test = cur ? (cur + ' ' + w) : w;
                    if(ctx.measureText(test).width > maxWidth && cur !== ''){
                        lines.push(cur); cur = w;
                    } else cur = test;
                }
                if(cur !== '') lines.push(cur);
            }
        }
        ctx.restore();
        return lines;
    }

    function measureTextBlock(text, maxWidth, fontSpec, lineHeight){
        const lines = wrapTextLines(text, maxWidth, fontSpec);
        ctx.save(); ctx.font = fontSpec;
        const width = lines.reduce((m,l)=>Math.max(m, ctx.measureText(l).width), 0);
        ctx.restore();
        return { lines, width: Math.min(maxWidth, width), height: lines.length * lineHeight, lineCount: lines.length };
    }

    window.APP.utils = {
        populateFontSelect,
        loadGoogleFontIfNeeded,
        loadImageFromFile,
        wrapTextLines,
        measureTextBlock
    };
})();
