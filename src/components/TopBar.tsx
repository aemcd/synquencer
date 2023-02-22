export default function TopBar() {
    return(
        <div className="top-bar">
            <button className="top-button">▶</button>
            <button className="top-button">◼</button>
            <div className="settings">
                <input className="settings-input" defaultValue="120" style={{width: "36px"}} maxLength={3}></input> BPM |
                <input className="settings-input" defaultValue="4/4" style={{width: "56px"}}></input>|
                <input className="settings-input" defaultValue="1/16" style={{width: "64px"}}></input>
            </div>
            
        </div>
    )
}