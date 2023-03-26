import React from 'react';
import {useKeyboard} from 'react-aria';

export function Example() {
  let { keyboardProps } = useKeyboard({
    onKeyDown: (e) =>
 alert(e.key + "pressed.")});
  return
   
         <input
  {...keyboardProps}
  />

  }
