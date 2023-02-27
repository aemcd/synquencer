import React from 'react'
import useKeyboardShortcut from 'use-keyboard-shortcut'
   
function keyMoveLeft() {
    const { flushHeldKeys } = useKeyboardShortcut(
  ["ArrowLeft"], setLocation(getLocation() - 1) ,{ overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
    }
     
    function keyMoveRight() {
        const { flushHeldKeys } = useKeyboardShortcut(
      ["ArrowRight"], setLocation(getLocation() + 1) ,{ overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
        }
        
    function keyIncreasePitch() {
        const { flushHeldKeys } = useKeyboardShortcut(
      ["ArrowLeft"], setPitch(getPitch()+1),{ overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
        }
        
    function keyDecreasePitch() {
        const { flushHeldKeys } = useKeyboardShortcut(
      ["ArrowUp"], setLocation(getLocation() - 1) ,{ overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
        }
        
    function keyIncreaseOctave() {
        const { flushHeldKeys } = useKeyboardShortcut(
      ["CTRL", "ArrowUp"], setPitch(getPitch()+12),{ overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
        }
        
    function keyDecreaseOctave() {
        const { flushHeldKeys } = useKeyboardShortcut(
      ["CTRL", "ArrowDown"], setPitch(getPitch()-12),{ overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
        }
        
    function keyCSixteenth() {
        const { flushHeldKeys } = useKeyboardShortcut(
      ["1"], setDuration(16)) ,{ overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
        }
        
    function keyChangeEighth() {
        const { flushHeldKeys } = useKeyboardShortcut(
      ["2"], setDuration(8), { overrideSystem: false, ignoreInputFields: false, repeatOnHold: false});
        }
        
        