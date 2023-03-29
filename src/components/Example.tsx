import React from 'react';
import {useKeyboard} from 'react-aria';
import {announce} from "@react-aria/live-announcer";

export default function Example() {
  let { keyboardProps } = useKeyboard({
    if (e.key = "ArrowUp") {onKeyDown: (e) =>
 announce(e.key + " pressed.", "assertive", 50)});
  return ( <>
    <label htmlFor="example">Example</label>
    <input

aria-label = "example"
{...keyboardProps}
      id="example"
    />
</>    )  }