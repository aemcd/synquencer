import React, {useEffect, useReducer, useRef} from 'react';

export default function PianoRoll() {
    const bgRef = useRef<HTMLCanvasElement | null>(null);
    const fgRef = useRef<HTMLCanvasElement | null>(null);
    

    let rollWidth = 512;
    let rollHeight = 384;
    let gridWidth = 16;
    let gridHeight = 16;
    let computedStyle : CSSStyleDeclaration;

    useEffect(() => {
        const bgCanvas = bgRef.current;
        if (!bgCanvas) return; 
        const bg = bgCanvas.getContext("2d");   
        if (!bg) return;

        const fgCanvas = fgRef.current;
        if (!fgCanvas) return; 
        const fg = fgCanvas.getContext("2d");   
        if (!fg) return;

        // eslint-disable-next-line react-hooks/exhaustive-deps
        computedStyle = getComputedStyle(bgCanvas);

        draw(bg, fg);
    });

    function draw(bg: CanvasRenderingContext2D, fg: CanvasRenderingContext2D) {
        drawBG(bg);
        drawNote(fg, 3, 3, computedStyle.getPropertyValue("--red"), computedStyle.getPropertyValue("--red-accent"));
    }

    function drawBG(ctx: CanvasRenderingContext2D) {
        ctx.imageSmoothingEnabled = false;

        // vertical grid lines
        ctx.fillStyle = computedStyle.getPropertyValue("--bg4");
        for (let i = 0; i < rollWidth / gridWidth; i++) {
            ctx.fillRect(gridWidth * (i + 1) - 1, 0, 1, rollHeight);
        }

        // horizontal grid lines
        ctx.fillStyle = computedStyle.getPropertyValue("--bg4");
        for (let i = 0; i < rollHeight / gridHeight; i++) {
            ctx.fillRect(0, gridHeight * (i+1) - 1, rollWidth, 1)
        }
    }

    function drawNote(ctx : CanvasRenderingContext2D, gridX : number, gridY : number, colorFill : string, colorOutline : string) {
        ctx.fillStyle = colorFill;
        ctx.fillRect(gridX * gridWidth, gridY * gridHeight, gridWidth - 1, gridHeight - 1);
        ctx.strokeStyle = colorOutline;
        ctx.lineWidth = 2;
        ctx.strokeRect(gridX * gridWidth, gridY * gridHeight, gridWidth - 1, gridHeight - 1);
    }

    return(
        <div style={{position: "relative"}}>
            <canvas ref={bgRef} width={rollWidth} height={rollHeight} style={{position: "absolute", left: "0", top: "0", zIndex: "0", imageRendering: "pixelated"}} />
            <canvas ref={fgRef} width={rollWidth} height={rollHeight} style={{position: "absolute", left: "0", top: "0", zIndex: "1", imageRendering: "pixelated"}} />
        </div>
    )
}