import React, {useEffect, useRef, useReducer, MouseEvent} from 'react';

export default function PianoRoll() {
    const sequenceMap = new Map<string, number>();

    let rollWidth = 767;
    let rollHeight = 575;
    let gridWidth = 24;
    let gridHeight = 24;

    const DRAG_STATES = {
        NOT_DRAGGING: 0,
        MOVING_NOTE: 1,
        CHANGING_LENGTH: 2
    } as const

    let dragState : number = DRAG_STATES.NOT_DRAGGING;
    let startGridX = -1;
    let startGridY = -1;
    let startNoteX = -1;
    let startNoteLength = -1;

    const bgRef = useRef<HTMLCanvasElement | null>(null);
    const fgRef = useRef<HTMLCanvasElement | null>(null);

    let computedStyle : CSSStyleDeclaration;
    let bgCtx: CanvasRenderingContext2D | null;
    let fgCtx: CanvasRenderingContext2D | null;

    useEffect(() => {
        computedStyle = getComputedStyle(document.body);

        if (bgRef.current) {
            bgCtx = bgRef.current.getContext("2d");
        };

        if (fgRef.current) {
            fgCtx = fgRef.current.getContext("2d");
        };

        drawBG();
        drawFG();
    });

    function drawBG() {
        if (!bgCtx) return;

        bgCtx.clearRect(0, 0, rollWidth, rollHeight);

        bgCtx.lineWidth = 2;

        // horizontal grid lines
        bgCtx.fillStyle = computedStyle.getPropertyValue("--bg1");
        for (let i = 0; i < rollHeight / gridHeight; i++) {
            bgCtx.fillRect(0, gridHeight * (i+1) - 1, rollWidth, 2)
        }

        // vertical grid lines
        for (let i = 0; i < rollWidth / gridWidth; i++) {
            !((i + 1) % 4) ? bgCtx.fillStyle = computedStyle.getPropertyValue("--bg3") : bgCtx.fillStyle = computedStyle.getPropertyValue("--bg1");
            bgCtx.fillRect(gridWidth * (i + 1) - 1, 0, 2, rollHeight);
        }
    }

    function drawFG() {
        if (!fgCtx) return;

        fgCtx.clearRect(0, 0, rollWidth, rollHeight);

        sequenceMap.forEach((value, key) => {
            if (!(key === `${startNoteX},${startGridY}`)) {
                let [x, y] = key.split(',').map(str => parseInt(str));
                drawNote(x, y, value, computedStyle.getPropertyValue("--yellow"), computedStyle.getPropertyValue("--yellow-accent"));
            }
        });
    }

    function drawNote(gridX: number, gridY: number, length: number, colorFill: string, colorOutline: string) {
        if (length < 0) return;
        if (!fgCtx) return;

        fgCtx.fillStyle = colorFill;
        fgCtx.fillRect(gridX * gridWidth, gridY * gridHeight, gridWidth * length, gridHeight);
        fgCtx.strokeStyle = colorOutline;
        fgCtx.lineWidth = 2;
        fgCtx.strokeRect(gridX * gridWidth, gridY * gridHeight, gridWidth * length, gridHeight);
        fgCtx.fillStyle = colorOutline;
        fgCtx.fillRect((gridX + length) * gridWidth - 6, gridY * gridHeight + 4, 2, gridHeight - 8);
    }

    function getGridPos(e: MouseEvent) {
        let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

        let pixelX = e.clientX - rect.left - 2;
        let pixelY = e.clientY - rect.top - 2;
        
        let gridX = Math.floor(pixelX / gridWidth);
        let gridY = Math.floor(pixelY / gridHeight);

        let isRightHalf = pixelX % gridWidth > gridWidth / 2;

        return {gridX, gridY, isRightHalf};
    }
    
    function handleMouseDown(e: MouseEvent) {
        e.preventDefault();

        let {gridX, gridY, isRightHalf} = getGridPos(e);

        startGridX = gridX;
        startGridY = gridY;

        sequenceMap.forEach((value, key) => {
            let [x, y] = key.split(',').map(str => parseInt(str));
            if (gridY == y && gridX >= x && gridX < x + value) {
                // Clicked cell lies within an existing note. Only take the last one, which will be on top because of the render order.
                startNoteX = x;
                startGridY = y;
                startNoteLength = value;
            }
        }); 

        if (e.button === 2) {
            // right click - delete if note was found
            if (startNoteLength != -1) {
                sequenceMap.delete(`${startNoteX},${startGridY}`);
                drawFG();
            }
        } else if (e.button == 0) {
            // left click
            if (startNoteLength != -1) {
                // note found
                if (gridX == startNoteX + startNoteLength - 1 && isRightHalf) {
                    // end of the note was clicked - start changing length
                    dragState = DRAG_STATES.CHANGING_LENGTH;
                } else {
                    // another part of the note was clicked - start moving
                    dragState = DRAG_STATES.MOVING_NOTE;
                }
            } else {
                // no note found; creating new note
                startNoteLength = 1;
                startNoteX = gridX;
                dragState = DRAG_STATES.CHANGING_LENGTH;
                drawFG();
                drawNote(startNoteX, startGridY, 1, computedStyle.getPropertyValue("--yellow"), computedStyle.getPropertyValue("--yellow-accent"));
            }
            return;
        }

        startGridX = -1;
        startGridY = -1;
        startNoteX = -1;
        startNoteLength = -1;

        return;
    }

    function handleMouseMove(e: MouseEvent) {
        e.preventDefault();
        
        if (dragState == DRAG_STATES.NOT_DRAGGING) return;

        let {gridX, gridY} = getGridPos(e);

        if (dragState == DRAG_STATES.MOVING_NOTE) {
            // moving note
            drawFG();
            drawNote(startNoteX + gridX - startGridX, gridY, startNoteLength, computedStyle.getPropertyValue("--yellow"), computedStyle.getPropertyValue("--yellow-accent"));
        } else {
            // changing note length
            drawFG();
            drawNote(startNoteX, startGridY, Math.max(1, gridX - startNoteX + 1), computedStyle.getPropertyValue("--yellow"), computedStyle.getPropertyValue("--yellow-accent"));
        }
    }

    function handleMouseUp(e: MouseEvent) {
        e.preventDefault();

        if (dragState == DRAG_STATES.NOT_DRAGGING) return;

        let {gridX, gridY} = getGridPos(e);

        if (dragState == DRAG_STATES.MOVING_NOTE) {
            // done moving note
            if (!(gridX == startGridX && gridY == startGridY)) {
                // check to make sure we're actually changing the note location
                sequenceMap.set(`${startNoteX + gridX - startGridX},${gridY}`, startNoteLength);
                sequenceMap.delete(`${startNoteX},${startGridY}`);
            }
        } else {
            // done changing note length
            if (!(gridX == startGridX && gridY == startGridY && sequenceMap.has(`${startGridX},${startGridY}`))) {
                // check to make sure we're actually changing the length
                sequenceMap.set(`${startNoteX},${startGridY}`, Math.max(1, gridX - startNoteX + 1));
            }
        }

        dragState = DRAG_STATES.NOT_DRAGGING;
        startGridX = -1;
        startGridY = -1;
        startNoteX = -1;
        startNoteLength = -1;

        drawFG();
    }

    function handleMouseOut(e: MouseEvent) {
        e.preventDefault();

        dragState = DRAG_STATES.NOT_DRAGGING;
        startGridX = -1;
        startGridY = -1;
        startNoteX = -1;
        startNoteLength = -1;

        drawFG();
    }

    function handleContextMenu(e: MouseEvent) {
        e.preventDefault();
    }

    return(
        <div style={{position: "relative"}}>
            <canvas ref={bgRef} width={rollWidth} height={rollHeight} style={{position: "absolute", left: "0", top: "0", zIndex: "0", imageRendering: "pixelated", border: "solid", borderColor: "var(--bg4)", borderWidth: "2px"}} />
            <canvas ref={fgRef}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseOut={handleMouseOut}
                onContextMenu={handleContextMenu}
                width={rollWidth}
                height={rollHeight}
                style={{position: "absolute", left: "0", top: "0", zIndex: "1", imageRendering: "pixelated", border: "solid", borderColor: "var(--bg3)", borderWidth: "2px"}} />
        </div>
    )
}