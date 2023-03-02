//Code referenced:
//https://fluidframework.com/docs/recipes/react/

import '@/styles/globals.css'
import type { AppProps } from 'next/app'

import {SequenceMetadata, Note, Instrument, PitchLocation} from "./types.js";
import {SharedString} from "@fluidframework/sequence";
import {IValueChanged, SharedMap} from "fluid-framework";
import {TinyliciousClient} from "@fluidframework/tinylicious-client"
import {GetNotes} from "../database/calls.js";
import * as React from "react";


const getFluidData = async () => {
  const client: TinyliciousClient = new TinyliciousClient();
  const schema = {
    initialObjects: {
        metadata: SharedMap,
        sequence: SharedMap,
    },
    dynamicObjectTypes: [SharedString, SharedMap],
  }
  let container;
  const containerId = location.hash.substring(1);
  if (!containerId) {
      ({ container } = await client.createContainer(schema));
      const id = await container.attach();
      location.hash = id;
  } else {
      ({ container } = await client.getContainer(containerId, schema));
  }

  return container.initialObjects;
}

//METADATA CODE HERE ----------------------------------

let localMetadata = new SequenceMetadata(); //local copy of properties for clients
let localSequence: SharedMap;



//TODO: finalize loading from mongodb
//Serverside only
/*
export function loadMetadata(id: any): void {
    metadataContainer.clear();
    if (true) {//case where there is an existing sequence for the id
        let sequenceArgs: any = Object.entries(localMetadata);
        //TODO
        //load metadata for sequence from mongodb and replace sequenceArgs
        localMetadata = new SequenceMetadata(sequenceArgs);
    }
    else {//case where we are creating new sequence

    }
}
*/
/*export function setMetadata(key: string, value: number | string) {
    metadataContainer.set(key, value);
}*/

export function getMetadata(key: keyof SequenceMetadata) {
    return localMetadata[key];
}


/*
//serverside only
export async function loadSequence(id: any) {
    //TODO: Implement with database code
    let instrumentList: Instrument[] = [new Instrument({channel: -1, name: "mayonnaise"}),];
    for (let sequenceInstrument of instrumentList as Instrument[]) {
        const newNoteList = await container.create(SharedMap);
        sequenceContainer.set(sequenceInstrument.serialize(), newNoteList);
    }
    let noteList: {note: Note, instrument: Instrument}[] = [];
    for (var notePattern of noteList as typeof noteList) {
        addNote(notePattern.note, notePattern.instrument);
    }
}
*/

export default function App({ Component, pageProps }: AppProps) {
  const [fluidMetadata, setMetadata] = React.useState<any | null>(null);
  const [fluidSequence, setSequence] = React.useState<any | null>(null);

  React.useEffect(() => {
    if (fluidMetadata) {
      const {metadataContainer} = fluidMetadata;
      const updateLocalMetadata = () => {
        const args = Object.fromEntries(metadataContainer.entries());
        const clazz = SequenceMetadata as new(arg: any) => any;
        localMetadata = new clazz(args);
      };
      updateLocalMetadata();
      metadataContainer.on("valueChanged", updateLocalMetadata);
      return () => {metadataContainer.off("valueChanged", updateLocalMetadata) }  

    } else {
        return;
    }
  }, [fluidMetadata]);

  React.useEffect(() => {
    if (fluidSequence) {
      const sequenceContainer = fluidSequence as SharedMap;
      const updateLocalSequence = () => {
        localSequence = sequenceContainer;
      };
      updateLocalSequence();
      sequenceContainer.on("valueChanged", updateLocalSequence);
      return () => {sequenceContainer.off("valueChanged", updateLocalSequence) }  

    } else {
        return;
    }
  }, [fluidSequence]);


  React.useEffect(() => {
      getFluidData().then(data => setMetadata(data.metadata));
  }, []);  

  React.useEffect(() => {
    getFluidData().then(data => setSequence(data.sequence));
  }, []); 

  return <Component {...pageProps} />
}
