//Code referenced:
//https://fluidframework.com/docs/recipes/react/

import "@/styles/globals.css";
import type { AppProps } from "next/app";

import {
	SequenceMetadata,
	Note,
	Instrument,
} from "@/server/types";
import { IFluidContainer, SharedMap } from "fluid-framework";
import { SharedCounter } from "@fluidframework/counter";
import { TinyliciousClient, TinyliciousContainerServices } from "@fluidframework/tinylicious-client";
import {
	AddNotes,
	AddSequence,
	GetNotes,
	GetSequence,
} from "../database/calls";
import * as React from "react";
import { type } from "os";
import randomstring from "randomstring";
import { ThemeProvider } from "next-themes";

export default function App({ Component, pageProps }: AppProps) {
	//TODO: fully implement fluid framework structures with React

	return (
		<ThemeProvider>
			<Component {...pageProps} />
		</ThemeProvider>
	) 
}
