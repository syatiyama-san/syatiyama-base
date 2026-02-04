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
                crop: { cx: 0.5, cy: 0.33, shape: 'circle' },
                zoom: 1.0,
                filename: null,
                thumb: null,
                rectangleWidth: 1200,
                rectangleHeight: 1200
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
        'Arial','Georgia','Times New Roman','Noto Sans JP',
        'Zen Old Mincho','Noto Serif JP',
        'Kiwi Maru','Hina Mincho','Kaisei Decol','Mochiy Pop One',
        'Yomogi','Pacifico','Ballet'
    ];

    const history = {
        undoStack: [],
        redoStack: [],
        maxSteps: 50,
        cloneStateForHistory: function(currentState) {
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
            if (cloned && cloned.images && cloned.images.subPic && cloned.images.subPic.crop) {
                delete cloned.images.subPic.crop.shape;
            }
            if (cloned) {
                delete cloned.aspectRatio;
            }
            if (cloned && cloned.ui && cloned.ui.bandOrientation !== undefined) {
                delete cloned.ui.bandOrientation;
            }
            return cloned;
        },
        saveState: function(currentState) {
            const stateCopy = this.cloneStateForHistory(currentState);
            this.undoStack.push(stateCopy);
            if (this.undoStack.length > this.maxSteps) {
                this.undoStack.shift();
            }
            this.redoStack = [];
            this.updateHistoryUI();
        },
        saveSnapshot: function(stateSnapshot) {
            if(!stateSnapshot) return;
            this.undoStack.push(stateSnapshot);
            if (this.undoStack.length > this.maxSteps) {
                this.undoStack.shift();
            }
            this.redoStack = [];
            this.updateHistoryUI();
        },
        undo: function() {
            if (this.undoStack.length === 0) return null;
            const currentStateCopy = this.cloneStateForHistory(state);
            this.redoStack.push(currentStateCopy);
            const previousState = this.undoStack.pop();
            this.updateHistoryUI();
            return previousState;
        },
        redo: function() {
            if (this.redoStack.length === 0) return null;
            const currentStateCopy = this.cloneStateForHistory(state);
            this.undoStack.push(currentStateCopy);
            const nextState = this.redoStack.pop();
            this.updateHistoryUI();
            return nextState;
        },
        canUndo: function() {
            return this.undoStack.length > 0;
        },
        canRedo: function() {
            return this.redoStack.length > 0;
        },
        updateHistoryUI: function() {
            const undoBtn = document.getElementById('undoBtn');
            const redoBtn = document.getElementById('redoBtn');
            if (undoBtn) {
                undoBtn.disabled = !this.canUndo();
                undoBtn.dataset.tooltip = '元に戻す';
            }
            if (redoBtn) {
                redoBtn.disabled = !this.canRedo();
                redoBtn.dataset.tooltip = 'やり直す';
            }
        }
    };

    history.updateHistoryUI();

    window.APP = window.APP || {};
    window.APP.canvas = canvas;
    window.APP.ctx = ctx;
    window.APP.subPicDefault = subPicDefault;
    window.APP.refPos = refPos;
    window.APP.state = state;
    window.APP.fontOptions = fontOptions;
    window.APP.history = history;
})();
