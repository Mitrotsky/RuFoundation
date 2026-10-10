import React, { useEffect } from 'react'


interface EditorToolbarButtonProps {
  readonly textareaRef: React.RefObject<HTMLTextAreaElement>,
  onClick: () => void,
  title: string,
  className?: string,
  content?: string,
  keybind?: string,
}


// TODO: parse keys correctly (Digit{num}, Key{letter})
// TODO: add alt and shift support for keybinds just in case
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
  const key = keybind ? keybind.split("+").at(-1) : null;

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !key) return;

    const keyPressHandler = (ev: KeyboardEvent)=> {
      if (ev.code !== key || !(ev.ctrlKey || ev.metaKey)) return;
      ev.preventDefault();
      onClick();
    }

    textarea.addEventListener("keydown", keyPressHandler);
    return () => textarea.removeEventListener("keydown", keyPressHandler);
  }, [onClick]);

  const fTitle = key ? `${title} (Ctrl+${key})` : title;

  return (
    <a className={className} onClick={onClick} title={fTitle}>
      <span>{content}</span>
    </a>
  )
}


export default EditorToolbarButton
