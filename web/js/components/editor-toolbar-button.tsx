import React, { useEffect, useMemo, useRef } from 'react'


type Letter =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type Digit =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9";
type Key = Letter | Digit;

type ModifierPrefix = Exclude<`${"Ctrl+" | "⌘+" | ""}${"Alt+" | ""}${"Shift+" | ""}`, "">;

export type KeybindLiteral = `${ModifierPrefix}${Key}`;


interface EditorToolbarButtonProps {
  readonly textareaRef: React.RefObject<HTMLTextAreaElement>,
  onClick: () => void,
  title: string,
  className?: string,
  content?: string,
  keybind?: KeybindLiteral,
}


interface Keybind {
  ctrl: boolean,
  alt: boolean,
  shift: boolean,
  key: string,
}


const isAppleDevice = /Mac|iPhone|iPad/.test(navigator.userAgent);
const ctrlRepr = isAppleDevice ? "⌘" : "Ctrl";


function parseKeybind(kb: KeybindLiteral): Keybind {
  const keybindKeys = kb.toLowerCase().trim().split("+");
  const keyName = keybindKeys.at(-1);
  if (!keyName) throw new Error(`"${kb}" is not a valid keybind`);

  return {
    ctrl: keybindKeys.includes("ctrl"),
    alt: keybindKeys.includes("alt"),
    shift: keybindKeys.includes("shift"),
    key: keyName,
  }
}


function keyCodeToLetter(keyCode: string): string {
  const validKeyTypes = ["Key", "Digit"];
  for (const keyType of validKeyTypes) {
    if (keyCode.startsWith(keyType)) return keyCode.slice(keyType.length);
  }
  return "undefined";
}


function formatKeybind(keybind: Keybind): string {
  const kbArray: string[] = [];
  if (keybind.ctrl) kbArray.push(ctrlRepr);
  if (keybind.alt) kbArray.push("Alt");
  if (keybind.shift) kbArray.push("Shift");
  kbArray.push(keybind.key.toUpperCase());
  return kbArray.join("+");
}


function compareKeybind(ev: KeyboardEvent, keybind: Keybind): boolean {
  const ctrlKey = isAppleDevice ? ev.metaKey : ev.ctrlKey ;
  const keyCode = ev.code;

  const displayedKey = keyCode ? keyCodeToLetter(keyCode) : ev.key;

  return (
    displayedKey.toLowerCase() === keybind.key &&
    ctrlKey === keybind.ctrl &&
    ev.shiftKey === keybind.shift &&
    ev.altKey === keybind.alt
  );
}


const EditorToolbarButton: React.FC<EditorToolbarButtonProps> = (
  {
    textareaRef,
    onClick,
    title,
    className,
    content,
    keybind,
  }
) => {
  const parsedKeybind = useMemo(() => keybind ? parseKeybind(keybind) : null, [keybind]);
  const onClickRef = useRef(onClick);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !parsedKeybind) return;

    const keyPressHandler = (ev: KeyboardEvent)=> {
      if (!compareKeybind(ev, parsedKeybind)) return;
      ev.preventDefault();
      if (ev.repeat) return;
      onClickRef.current();
    }

    textarea.addEventListener("keydown", keyPressHandler);
    return () => textarea.removeEventListener("keydown", keyPressHandler);
  }, [parsedKeybind]);

  const fTitle = parsedKeybind ? `${title} (${formatKeybind(parsedKeybind)})` : title;

  return (
    <a className={className} onClick={onClickRef.current} title={fTitle}>
      <span>{content}</span>
    </a>
  )
}


export default EditorToolbarButton
