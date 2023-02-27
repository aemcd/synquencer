import React, {useEffect} from 'react';

export default function PianoRoll() {
    let gridWidth = 16;
    let gridHeight = 16;

    useEffect(() => {
        drawBG();
    });

    function drawBG() {
        const bgCanvas = document.getElementById("bgCanvas") as HTMLCanvasElement;
        const bg = bgCanvas.getContext("2d");   
        if (!bg) return; 

        let computedStyle = getComputedStyle(bgCanvas);
        bg.imageSmoothingEnabled = false;

        // vertical grid lines
        bg.fillStyle = computedStyle.getPropertyValue("--bg4");
        for (let i = 0; i < bgCanvas.width / gridWidth; i++) {
            bg.fillRect(gridWidth * (i + 1) - 1, 0, 1, bgCanvas.height);
        }

        // horizontal grid lines
        bg.fillStyle = computedStyle.getPropertyValue("--bg4");
        for (let i = 0; i < bgCanvas.height / gridHeight; i++) {
            bg.fillRect(0, gridHeight * (i+1) - 1, bgCanvas.width, 1)
        }
    }

    return(
        <div style={{position: "relative"}}>
            <canvas id="bgCanvas" width="512" height="384" style={{position: "absolute", left: "0", top: "0", zIndex: "0", imageRendering: "pixelated"}} />
            <canvas id="fgCanvas" width="512" height="384" style={{position: "absolute", left: "0", top: "0", zIndex: "1", imageRendering: "pixelated"}} />
        </div>
    )
}