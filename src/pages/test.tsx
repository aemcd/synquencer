import Head from "next/head";
import Link from "next/link";

function runCode() {}

export default function Home() {
	return (
		<>
			<Head>
				<title>Synquencer</title>
				<meta name="description" content="Synquencer" />
				<meta
					name="viewport"
					content="width=device-width, initial-scale=1"
				/>
				<link rel="icon" href="/favicon.ico" />
			</Head>
			<div
				style={{
					display: "flex",
					flexFlow: "row nowrap",
					alignItems: "center",
					justifyContent: "center",
					height: "100vh",
				}}
			>
				<div
					style={{
						textAlign: "center",
					}}
				>
					<h1 style={{ margin: "0 0 24px 0" }}>Testing</h1>
					<button onClick={runCode}></button>
				</div>
			</div>
		</>
	);
}
