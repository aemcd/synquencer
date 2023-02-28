import React, {useEffect, useRef, useReducer, MouseEvent} from 'react';

export default function PianoRoll() {
    const bgRef = useRef<HTMLCanvasElement | null>(null);
    const fgRef = useRef<HTMLCanvasElement | null>(null);
    let fg: CanvasRenderingContext2D;
    let bg: CanvasRenderingContext2D;
    const sequenceMap = new Map<string, number>();
    sequenceMap.set("3,5", 1);
    sequenceMap.set("7,16", 2);
    sequenceMap.set("9,7", 4);

    let rollWidth = 767;
    let rollHeight = 575;
    let gridWidth = 24;
    let gridHeight = 24;
    let computedStyle : CSSStyleDeclaration;

    useEffect(() => {
        const bgCanvas = bgRef.current;
        if (!bgCanvas) return;
        const bg = bgCanvas.getContext("2d");
        if (!bg) return;

        const fgCanvas = fgRef.current;
        if (!fgCanvas) return;
        fg = fgCanvas.getContext("2d")!;
        if (!fg) return;

        // eslint-disable-next-line react-hooks/exhaustive-deps
        computedStyle = getComputedStyle(bgCanvas);

        drawBG(bg);
        drawFG(fg);
    });

    function drawBG(ctx: CanvasRenderingContext2D) {
        ctx.lineWidth = 2;

        // horizontal grid lines
        ctx.fillStyle = computedStyle.getPropertyValue("--bg1");
        for (let i = 0; i < rollHeight / gridHeight; i++) {
            ctx.fillRect(0, gridHeight * (i+1) - 1, rollWidth, 2)
        }

        // vertical grid lines
        for (let i = 0; i < rollWidth / gridWidth; i++) {
            !((i + 1) % 4) ? ctx.fillStyle = computedStyle.getPropertyValue("--bg3") : ctx.fillStyle = computedStyle.getPropertyValue("--bg1");
            ctx.fillRect(gridWidth * (i + 1) - 1, 0, 2, rollHeight);
        }
    }

    function drawFG(ctx: CanvasRenderingContext2D) {
        ctx.clearRect(0, 0, rollWidth, rollHeight);

        sequenceMap.forEach((value, key) => {
            let [x, y] = key.split(',').map(str => parseInt(str));
            drawNote(ctx, x, y, value, computedStyle.getPropertyValue("--yellow"), computedStyle.getPropertyValue("--yellow-accent"));
        });
    }

    function drawNote(ctx : CanvasRenderingContext2D, gridX: number, gridY: number, length: number, colorFill: string, colorOutline: string) {
        if (length < 0) return;
        ctx.fillStyle = colorFill;
        ctx.fillRect(gridX * gridWidth, gridY * gridHeight, gridWidth * length, gridHeight);
        ctx.strokeStyle = colorOutline;
        ctx.lineWidth = 2;
        ctx.strokeRect(gridX * gridWidth, gridY * gridHeight, gridWidth * length, gridHeight);
    }

    function handleClick(e: MouseEvent) {
        e.preventDefault();
        let rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
        let pixelX = e.clientX - rect.left - 2;
        let gridX = Math.floor(pixelX / gridWidth);
        let pixelY = e.clientY - rect.top - 2;
        let gridY = Math.floor(pixelY / gridHeight);

        console.log(e);

        if (e.type === "click") {
            sequenceMap.set(`${gridX},${gridY}`, 1);
        } else if (e.type === "contextmenu") {
            sequenceMap.set(`${gridX},${gridY}`, -1);
        }

        drawFG(fg);
    }

    return(
        <div style={{position: "relative"}}>
            <canvas ref={bgRef} width={rollWidth} height={rollHeight} style={{position: "absolute", left: "0", top: "0", zIndex: "0", imageRendering: "pixelated", border: "solid", borderColor: "var(--bg4)", borderWidth: "2px"}} />
            <canvas ref={fgRef} onClick={handleClick} onContextMenu={handleClick} width={rollWidth} height={rollHeight} style={{position: "absolute", left: "0", top: "0", zIndex: "1", imageRendering: "pixelated", border: "solid", borderColor: "var(--bg3)", borderWidth: "2px"}} />
        </div>
    )
}