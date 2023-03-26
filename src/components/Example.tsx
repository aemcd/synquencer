import React from 'react';
import {useKeyboard} from 'react-aria';

export default function Example() {
  let { keyboardProps } = useKeyboard({
    onKeyDown: (e) =>
 alert(e.key + "pressed.")});
  return ( <>
    <label htmlFor="example">Example</label>
    <input

aria-label = "example"
{...keyboardProps}
      id="example"
    />
</>    )  }