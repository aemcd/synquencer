import React, {useEffect, useRef, useReducer, MouseEvent} from 'react';

export default function PianoRoll() {
    const sequenceMap = new Map<string, number>();

    let rollWidth = 767;
    let rollHeight = 575;
    let gridWidth = 24;
    let gridHeight = 24;

    let isDragging = false;
    let startGridX = -1;
    let startGridY = -1;

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
            if (!(key === `${startGridX},${startGridY}`)) {
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
    }

    function getGridPos(e: MouseEvent) {
        let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();

        let pixelX = e.clientX - rect.left - 2;
        let pixelY = e.clientY - rect.top - 2;
        
        let gridX = Math.floor(pixelX / gridWidth);
        let gridY = Math.floor(pixelY / gridHeight);

        return {gridX, gridY};
    }
    
    function handleMouseDown(e: MouseEvent) {
        e.preventDefault();

        let {gridX, gridY} = getGridPos(e);

        if (e.button === 2) {
            if (sequenceMap.has(`${gridX},${gridY}`)) {
                sequenceMap.delete(`${gridX},${gridY}`);
                drawFG();
            }

            return;
        }

        if (e.button !== 0) {
            return;
        }

        if (!sequenceMap.has(`${gridX},${gridY}`)) {
            sequenceMap.set(`${gridX},${gridY}`, 1);
            drawFG();
            return;
        }

        isDragging = true;
        startGridX = gridX;
        startGridY = gridY;
    }

    function handleMouseMove(e: MouseEvent) {
        e.preventDefault();
        
        if (!isDragging) return;

        if (!sequenceMap.has(`${startGridX},${startGridY}`)) {
            isDragging = false;
            startGridX = -1;
            startGridY = -1;
            drawFG();
            return;
        }

        let {gridX, gridY} = getGridPos(e);

        drawFG();
        drawNote(gridX, gridY, sequenceMap.get(`${startGridX},${startGridY}`)!, computedStyle.getPropertyValue("--yellow"), computedStyle.getPropertyValue("--yellow-accent"));
    }

    function handleMouseUp(e: MouseEvent) {
        e.preventDefault();

        if (!isDragging) return;

        if (!sequenceMap.has(`${startGridX},${startGridY}`)) {
            isDragging = false;
            startGridX = -1;
            startGridY = -1;
            drawFG();
            return;
        }

        let {gridX, gridY} = getGridPos(e);

        if (!(gridX == startGridX && gridY == startGridY)) {
            sequenceMap.set(`${gridX},${gridY}`, sequenceMap.get(`${startGridX},${startGridY}`)!);
            sequenceMap.delete(`${startGridX},${startGridY}`);
        }

        isDragging = false;
        startGridX = -1;
        startGridY = -1;

        drawFG();
    }

    function handleMouseOut(e: MouseEvent) {
        e.preventDefault();

        isDragging = false;
        startGridX = -1;
        startGridY = -1;
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