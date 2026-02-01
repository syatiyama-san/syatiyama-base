// app-state.js

(function(){
    const canvas = document.getElementById('mainCanvas');
    if(!canvas) throw new Error('mainCanvas not found in DOM');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    const subPicDefault = { x: 5, y: 160, sizePx: 1200, min: 200, max: 2000 };
    const refPos = { mainPic: { x: 1050, y: 80, scale: 1.5 }, subPic: { x: subPicDefault.x, y: subPicDefault.y } };

    const state = {
        width: canvas.width || 2000,
        height: canvas.height || 2000,
        aspectRatio: { width: 2000, height: 2000 },
        images: {
            mainPic: {
                img: null,
                x: Math.round(canvas.width * 0.525),
                y: Math.round(canvas.height * 0.04),
                scale: refPos.mainPic.scale,
                initialScale: refPos.mainPic.scale,
                z: 3,
                filename: null,
                thumb: null
            },
            subPic: {
                img: null,
                x: Math.round(canvas.width * 0.05),
                y: Math.round(canvas.height * 0.08),
                sizePx: subPicDefault.sizePx,
                z: 2,
                crop: { cx: 0.5, cy: 0.33 },
                zoom: 1.0,
                filename: null,
                thumb: null
            },
            bgPic: {
                img: null,
                x: 0,
                y: 0,
                scale: 1,
                z: 1,
                filename: null,
                thumb: null
            },
            wmPic: {
                img: null,
                x: 0,
                y: 0,
                scale: 1,
                z: 999,
                opacity: 0.5,
                filename: null,
                thumb: null
            },
            sysPic: {
                img: null,
                x: 40,
                y: null,
                scale: 1,
                z: 0,
                filename: null,
                thumb: null,
                info: {},
                _isDefault: false,
                _preventDefault: false
            },
            overlayAsset: {
                img: null,
                filename: null,
                thumb: null,
                widthPx: 700,
                marginLeft: 20,
                marginBottom: 24,
                z: 50
            }
        },
        texts: [
            { id:'text1', text:'シナリオ', x: Math.round(canvas.width * 0.265), y: Math.round(canvas.height * 0.825) },
            { id:'text2', text:'ハンドアウト', x: Math.round(canvas.width * 0.265), y: Math.round(canvas.height * 0.885) },
            { id:'text3', text:'お名前', x: Math.round(canvas.width * 0.265), y: Math.round(canvas.height * 0.945) }
        ],
        dragging: null,
        dragOffset: { x:0, y:0 }
    };

    const fontOptions = [
        'Arial','Georgia','Times New Roman','Noto Sans JP','Roboto',
        'Zen Old Mincho','Montserrat','Open Sans','Lato','Poppins',
        'Inter','Noto Serif JP'
    ];

    window.APP = window.APP || {};
    window.APP.canvas = canvas;
    window.APP.ctx = ctx;
    window.APP.subPicDefault = subPicDefault;
    window.APP.refPos = refPos;
    window.APP.state = state;
    window.APP.fontOptions = fontOptions;
})();
