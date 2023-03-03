import Link from 'next/link'

export default function TopBar() {
    return(
        <div className="top-bar">
            <button className="top-button">▶</button>
            <button className="top-button">◼</button>
            <div className="settings">
                BPM <input className="settings-input" defaultValue="120" style={{width: "36px"}} maxLength={3}></input> Time Signature |
                <input  className="settings-input" defaultValue="4/4" style={{width: "56px"}}></input> Step Length|
                <input className="settings-input" defaultValue="1/16" style={{width: "64px"}}></input> 
            </div>
            <button className="top-button" style={{transform: "scale(1,-1)"}}>
                <svg width="18" height="18" viewBox="0 0 185.2 185.2">
                    <path fill="var(--fg2)" d="M26.5 529.2h185.2v-79.4h-26.5v53H53v-53H26.5z" transform="translate(-26.5 -344)"/>
                    <path fill="var(--fg2)" d="M119 476.3 53 410h39.6V344h53V410h39.6z" transform="translate(-26.5 -344)"/>
                </svg>
            </button>
            <button className="top-button">
                <svg width="18" height="18" viewBox="0 0 185.2 185.2">
                    <path fill="var(--fg2)" d="M26.5 529.2h185.2v-79.4h-26.5v53H53v-53H26.5z" transform="translate(-26.5 -344)"/>
                    <path fill="var(--fg2)" d="M119 476.3 53 410h39.6V344h53V410h39.6z" transform="translate(-26.5 -344)"/>
                </svg>
            </button>
            <Link href="/">
                <button className="top-button">
                    <svg width="20" height="20" viewBox="0 0 238.1 198.4">
                        <path fill="var(--fg2)" d="M119 0 0 119h39.7v79.4h52.9v-52.9h53v53h52.8V119h39.7z"/>
                    </svg>
                </button>
            </Link>
        </div>
    )
}