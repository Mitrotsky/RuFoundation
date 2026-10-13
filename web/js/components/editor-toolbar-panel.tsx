import React from 'react'
import { useEffect, useLayoutEffect, useRef, useCallback, useMemo } from 'react'
import styled from 'styled-components'


interface TextSelection {
  start: number,
  end: number,
}


type Letter =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type Digit =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "0";
type Key = Letter | Digit;

type ModifierPrefix = Exclude<`${"Ctrl+" | ""}${"Alt+" | ""}${"Shift+" | ""}`, "">;

type KeybindLiteral = `${ModifierPrefix}${Key}`;


const isAppleDevice = /Mac|iPhone|iPad/.test(navigator.userAgent);
const ctrlRepr = isAppleDevice ? "⌘" : "Ctrl";


function keyCodeToLetter(keycode: string): string | null {
  const letterRegex = /(?:Key|Digit)(?<char>[A-Z0-9])/;
  const key = keycode.match(letterRegex)?.groups?.char;
  return key ? key : null;
}


function eventToLiteral(ev: KeyboardEvent): KeybindLiteral | null {
  const key = keyCodeToLetter(ev.code);
  if (!key) return null;

  const ctrl = isAppleDevice ? ev.metaKey : ev.ctrlKey;
  // TIL apparently Apple devices have both ctrl and meta buttons
  const nonNative = isAppleDevice ? ev.ctrlKey : ev.metaKey;
  if (nonNative) return null;

  const prefix = `${ctrl ? "Ctrl+" : ""}${ev.altKey ? "Alt+" : ""}${ev.shiftKey ? "Shift+" : ""}`;
  if (!prefix) return null;

  return `${prefix}${key}` as KeybindLiteral;
}


interface EditorToolbarButtonProps {
  onClick: () => void,
  title: string,
  className?: string,
  content?: string,
  keybind?: KeybindLiteral,
}


const EditorToolbarButton: React.FC<EditorToolbarButtonProps> = (
  {
    onClick,
    title,
    className,
    content,
    keybind,
  }
) => {
  return (
    <a className={className} onClick={onClick} title={keybind ? `${title} (${keybind.replace("Ctrl", ctrlRepr)})` : title}>
      <span>{content}</span>
    </a>
  )
}


interface EditorToolbarPanelProps {
  readonly textareaRef: React.RefObject<HTMLTextAreaElement>,
  onSourceChange: (text: string) => void,
  className?: string,
}


const EditorToolbarPanel__Bare: React.FC<EditorToolbarPanelProps> = ({ textareaRef, onSourceChange, className }) => {
  const selectionRef = useRef<TextSelection | null>(null);

  const hugSelection = useCallback((before: string, after: string = before, togglable = true) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value: taValue } = textarea;

    const isToggling = selectionStart >= before.length
      && taValue.startsWith(before, selectionStart - before.length)
      && taValue.startsWith(after, selectionEnd)
      && togglable;

    const selectionShift = isToggling ? -before.length : before.length;

    // `textarea.value` is always `source` as long as we call `onSourceChange` in one way or another
    const selectedText = taValue.slice(selectionStart, selectionEnd);
    selectionRef.current = {
      start: selectionStart + selectionShift,
      end: selectionEnd + selectionShift,
    }
    onSourceChange(isToggling
      ? taValue.slice(0, selectionStart - before.length) + selectedText + taValue.slice(selectionEnd + after.length)
      : taValue.slice(0, selectionStart) + before + selectedText + after + taValue.slice(selectionEnd))
  }, [onSourceChange]);

  const inject = useCallback((before: string, after: string, message: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value: taValue } = textarea;

    const isNewlineBegin = taValue.startsWith("\n", selectionStart - 1) || selectionStart == 0;
    const isNewlineEnd = taValue.endsWith("\n", selectionEnd + 1);

    const newlineSeparatorBegin = !isNewlineBegin ? "\n\n" : "";
    const newlineSeparatorEnd = !isNewlineEnd ? "\n\n" : "";

    const hasSelection = selectionStart !== selectionEnd;
    const selectedText = taValue.slice(selectionStart, selectionEnd);
    const content = hasSelection ? selectedText : message;

    selectionRef.current = {
      start: selectionStart + newlineSeparatorBegin.length + before.length + 1,
      end: selectionStart + newlineSeparatorBegin.length + before.length + 1 + content.length,
    }

    const injectable = newlineSeparatorBegin + before + '\n' + content + '\n' + after + newlineSeparatorEnd;
    onSourceChange(taValue.slice(0, selectionStart) + injectable + taValue.slice(selectionEnd));
  }, [onSourceChange]);

  // TODO: unify `buttonData` and `actions` creation to nuke duplicate code
  const buttonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-bold", title: "Полужирный", onClick: () => hugSelection("**"), keybind: "Ctrl+B" },
    { className: "weditor-italic", title: "Курсивный", onClick: () => hugSelection("//"), keybind: "Ctrl+I" },
    { className: "weditor-underline", title: "Подчёркнутый", onClick: () => hugSelection("__"), keybind: "Ctrl+U" },
    { className: "weditor-strikethrough", title: "Перечёркнутый", onClick: () => hugSelection("--") },
    { className: "weditor-teletype", title: "Моноширинный", onClick: () => hugSelection("{{", "}}") },
    { className: "weditor-superscript", title: "Верхний регистр", onClick: () => hugSelection("^^") },
    { className: "weditor-subscript", title: "Нижний регистр", onClick: () => hugSelection(",,") },
    { className: "weditor-raw", title: "Сырой текст", onClick: () => hugSelection("@@") },
  ], [hugSelection]);

  const actions: Map<KeybindLiteral, () => void> = useMemo(() => new Map([
    ["Ctrl+B", () => hugSelection("**")],
    ["Ctrl+I", () => hugSelection("//")],
    ["Ctrl+U", () => hugSelection("__")],
    // TODO: implement later
    ["Ctrl+Z", () => {/* undo */}],
    ["Ctrl+Shift+Z", () => {/* redo */}]
  ]), [hugSelection, /* Jung Kook - Please Don't Change */]);

  useLayoutEffect(() => {
    const selection = selectionRef.current;
    const textarea = textareaRef.current;
    if (!selection || !textarea) return;

    textarea.setSelectionRange(selection.start, selection.end);
    textarea.focus();
    selectionRef.current = null;
  });

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const keyPressHandler = (ev: KeyboardEvent)=> {
      const kb = eventToLiteral(ev);
      if (!kb) return;

      const action = actions.get(kb);
      if (!action) return;

      ev.preventDefault();
      if (ev.repeat) return;

      action();
    };

    textarea.addEventListener("keydown", keyPressHandler);
    return () => textarea.removeEventListener("keydown", keyPressHandler);
  }, [actions]);

  return (
    <div className={`wd-editor-toolbar-panel ${className}`} id="wd-editor-toolbar-panel">
      <div className="editor-toolbar-inline-options">
        {buttonData.map(p => <EditorToolbarButton
          className={p.className}
          onClick={p.onClick}
          title={p.title}
          keybind={p.keybind}
        />)}
      </div>
      <div>
        <ul>
          <li><a className="weditor-h1" title="" href="#"><span>heading level 1</span></a>
            <ul>
              <li><a className="weditor-h2" title="" href="#"><span>heading level 2</span></a></li>
              <li><a className="weditor-h3" title="" href="#"><span>heading level 3</span></a></li>
              <li><a className="weditor-h4" title="" href="#"><span>heading level 4</span></a></li>
              <li><a className="weditor-h5" title="" href="#"><span>heading level 5</span></a></li>
              <li><a className="weditor-h6" title="" href="#"><span>heading level 6</span></a></li>
            </ul>
          </li>
          <li><a className="weditor-quote" href="#" title=""><span>quote</span></a></li>
        </ul>
      </div>
      <div>
        <ul>
          <li><a className="weditor-hr" href="#" title=""><span>hr</span></a></li>
          <li>
            <a className="weditor-div" href="#" title=""><span>div</span></a>
            <EditorToolbarButton className="weditor-div" title="div-элемент"
              onClick={() => inject("[[div]]", "[[/div]]", "Содержимое div'а")} />
          </li>

          <li><a className="weditor-clearfloat" href="#" title=""><span>clear float</span></a>
            <ul>
              <li><a className="weditor-clearfloatleft" href="#" title=""><span>left</span></a></li>
              <li><a className="weditor-clearfloatright" href="#" title=""><span>right</span></a></li>
            </ul>
          </li>

          <li><a className="weditor-table" href="#" title=""><span>table</span></a></li>

          <li><a className="weditor-toc" href="#" title=""><span>toc</span></a></li>

          <li className="hseparator"></li>
          <li><a className="weditor-code" href="#" title=""><span>code</span></a></li>
          <li><a className="weditor-codewiz" href="#" title=""><span>code wizard</span></a></li>

          <li className="hseparator"></li>
          <li><a className="weditor-uri" href="#" title=""><span>url</span></a></li>
          <li><a className="weditor-uriwiz" href="#" title=""><span>url link wizard</span></a></li>

          <li><a className="weditor-pagelink" href="#" title=""><span>page link</span></a></li>
          <li><a className="weditor-pagelinkwiz" href="#" title=""><span>page link wizard</span></a></li>

          <li className="hseparator"></li>
          <li><a className="weditor-image" href="#" title=""><span>image</span></a></li>
          <li><a className="weditor-imagewiz" href="#" title=""><span>image wizard</span></a></li>

          <li className="hseparator"></li>
          <li><a className="weditor-html" href="#" title=""><span>HTML</span></a></li>
        </ul>
      </div>
      <div>
        <ul>
          <li><a className="weditor-numlist" href="#" title=""><span>numbered list</span></a></li>
          <li><a className="weditor-bullist" href="#" title=""><span>bulleted list</span></a></li>
          <li><a className="weditor-incindent" href="#" title=""><span>increase indent</span></a></li>
          <li><a className="weditor-decindent" href="#" title=""><span>decrease indent</span></a></li>
          <li><a className="weditor-deflist" href="#" title=""><span>definition list</span></a></li>
          <li><a className="weditor-footnote" href="#" title=""><span>footnote</span></a></li>

          <li className="hseparator"></li>

          <li><a className="weditor-math" href="#" title=""><span>math</span></a></li>
          <li><a className="weditor-mathinline" href="#" title=""><span>inline math</span></a></li>
          <li><a className="weditor-eqref" href="#" title=""><span>equation reference</span></a></li>

          <li className="hseparator"></li>

          <li><a className="weditor-bib" href="#" title=""><span>bibliography</span></a></li>
          <li><a className="weditor-bibcite" href="#" title=""><span>bibcite</span></a></li>

        </ul>
      </div>
    </div>
  );
}


const EditorToolbarPanel = styled(EditorToolbarPanel__Bare)`
  /* temp styles todo: redo after the button refactor */
  & * {
    box-sizing: border-box;
  }
  a {
    height: 22px;
    width: 22px;
    padding: 0;
    margin: 0;
    display: inline-block;
    border: 1px solid #AAA;
    background-color: #F4F4F4;
    background-origin: border-box;
  }
`;


export default EditorToolbarPanel
