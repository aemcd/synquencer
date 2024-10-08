import Head from 'next/head'
import Link from 'next/link'

export default function Home() {
  return (
    <>
      <Head>
        <title>Synquencer</title>
        <meta name="description" content="Synquencer" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div style={{
        display: "flex",
        flexFlow: "row nowrap",
        alignItems: "center",
        justifyContent: "center",
        height: "100vh",
      }}>
        <div style={{
            textAlign: "center"
        }}>
          <h1 style={{margin: "0 0 24px 0"}}>Synquencer</h1>
          <Link href="/sequencer/new" className="home-menu-button">New Sequence</Link>
          <Link href="/sequencer/upload" className="home-menu-button">Upload MIDI</Link>
          <Link href="/about" className="home-menu-button">About</Link>
        </div>
      </div>
    </>
  )
}
