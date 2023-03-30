import React, {useRef, useEffect} from 'react';

export default function LiveAnnouncer({liveText}) {
    const liveRef = useRef(null);

  const setText = (text: string) => {
    if (liveRef.current) {
      const newText = document.createElement("span");
      newText.innerHTML = text;
      // @ts-ignore
      liveRef.current.appendChild(newText);
    }
  };
  const clearText = () => {
    if (liveRef.current) {
      // @ts-ignore
      liveRef.current.innerHTML = "";
    }
  };
  useEffect(() => {
    clearText();
    setTimeout(() => {
      setText(liveText);
    }, 50);
  }, [liveText]);
  return <div aria-live="assertive" ref={liveRef} />;
}