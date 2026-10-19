import React from "react";
import { useEffect, useLayoutEffect, useRef, useCallback, useMemo, useState } from "react"
import styled from "styled-components"
import WikidotModal from "~util/wikidot-modal";


interface TextSelection {
  start: number,
  end: number,
}


interface EditHistoryEntry {
  source: string,
  selection: TextSelection,
}


interface EditHistory {
  entries: EditHistoryEntry[],
  pointer: number,
  lastEdit: number,
  lastEditBatch: number,
}


type FKey = `F${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`;
type Special = "Tab" | "Escape" | FKey;
type Letter =
  | "A" | "B" | "C" | "D" | "E" | "F" | "G" | "H" | "I" | "J" | "K" | "L" | "M"
  | "N" | "O" | "P" | "Q" | "R" | "S" | "T" | "U" | "V" | "W" | "X" | "Y" | "Z";
type Digit =
  | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9" | "0";

type Modifiers = `${"Ctrl+" | ""}${"Alt+" | ""}${"Shift+" | ""}`;
type ModifierPrefix = Exclude<Modifiers, "">;

type KeybindLiteral =
  | `${ModifierPrefix}${Letter | Digit}`
  | `${Modifiers}${Special}`;


interface EditorToolbarButtonProps {
  onClick: () => void,
  title: string,
  className?: string,
  keybind?: KeybindLiteral,
}


interface ToolbarGroup {
  className: string,
  entry: EditorToolbarButtonProps[],
}


interface EditorToolbarPanelProps {
  readonly textareaRef: React.RefObject<HTMLTextAreaElement>,
  onSourceChange: (text: string) => void,
  className?: string,
}


interface EditorModalProps {
  onSubmit: () => void,
  onCancel: () => void,
  children: React.ReactNode,
}


interface EditorModalComponentProps {
  onSubmit: (result: string) => void,
  onCancel: () => void,
}


type EditorModalComponent = React.FC<EditorModalComponentProps>;


const isAppleDevice = /Mac|iPhone|iPad/.test(navigator.userAgent);
const ctrlRepr = isAppleDevice ? "⌘" : "Ctrl";


function keyCodeToLetter(keycode: string): string | null {
  const specialKeyRegex = /^(?:Tab|Escape|F(?:[1-9]|1[0-2]))$/;
  if (specialKeyRegex.test(keycode)) return keycode;

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
  if (!prefix && key.length === 1) return null;

  return `${prefix}${key}` as KeybindLiteral;
}


const EditorModal: React.FC<EditorModalProps> = (
  {
    onSubmit,
    onCancel,
    children
  }
) => {
  useEffect(() => {
    const keyPressHandler = (ev: KeyboardEvent) => {
      if (ev.code === "Escape") onCancel();
    };
    document.addEventListener("keydown", keyPressHandler);
    return () => document.removeEventListener("keydown", keyPressHandler);
  }, [onCancel]);

  return (
    <WikidotModal buttons={[
      { title: "Отменить", onClick: onCancel },
      { title: "Вставить код", onClick: onSubmit },
    ]}>
      {children}
    </WikidotModal>
  );
};


const TableModal: EditorModalComponent = (
  {
    onCancel,
    onSubmit,
  }
) => {
  const [rows, setRows] = useState<number>(2);
  const [columns, setColumns] = useState<number>(2);
  const [useHeader, setUseHeader] = useState<boolean>(false);

  const MIN_ROWS = 2;
  const MIN_COLUMNS = 2;

  const createTableRow = (length: number, isHeader: boolean = false): string => {
    const rowArray: string[] = [];
    for (let i = 0; i < length; i++) rowArray.push(`||${isHeader ? "~" : ""} Ячейка `);
    return rowArray.join("") + "||";
  }

  const createTable = (): string => {
    const totalRows = Number.isNaN(rows) ? MIN_ROWS : Math.min(99, Math.max(rows, MIN_ROWS));
    const totalColumns = Number.isNaN(columns) ? MIN_COLUMNS : Math.min(99, Math.max(columns, MIN_COLUMNS));

    const tableRows: string[] = [];
    for (let i = 0; i < totalRows; i++) tableRows.push(createTableRow(totalColumns));
    if (useHeader) tableRows[0] = createTableRow(totalColumns, true);
    return tableRows.join("\n");
  };

  return (
    <EditorModal onSubmit={() => onSubmit(createTable())} onCancel={() => onCancel()} >
      <div style={{ textAlign: "center" }}>
        <p><b>Мастер вставки таблиц</b></p>

        <table className="form">
          <tbody>
            <tr>
              <td><label htmlFor="wd-ed-tablewizard-rows">Количество строк:</label></td>
              <td><input
                className="text"
                id="wd-ed-tablewizard-rows"
                type="number"
                value={rows}
                min={MIN_ROWS} max={99}
                style={{ minWidth: "4ch" }}
                onChange={e => setRows(e.target.valueAsNumber)}
              /></td>
            </tr>
            <tr>
              <td><label htmlFor="wd-ed-tablewizard-columns">Количество столбцов:</label></td>
              <td><input
                className="text"
                id="wd-ed-tablewizard-columns"
                type="number"
                value={columns}
                min={MIN_COLUMNS} max={99}
                style={{ minWidth: "4ch" }}
                onChange={e => setColumns(e.target.valueAsNumber)}
              /></td>
            </tr>
            <tr>
              <td><label htmlFor="wd-ed-tablewizard-headers">Первая строка как заголовок:</label></td>
              <td><input
                className="checkbox"
                id="wd-ed-tablewizard-headers"
                type="checkbox"
                checked={useHeader}
                onChange={e => setUseHeader(e.target.checked)}
              /></td>
            </tr>
          </tbody>
        </table>
        <br/>
        <div style={{ textWrap: "balance" }}>
          Подсказка: чтобы выровнять содержимое ячейки, добавьте сразу после
          маркера <code>||</code> символ <code>&lt;</code>, <code>=</code> или <code>&gt;</code> (для выравнивания по
          левому краю, центру и правому краю соответственно).
        </div>
      </div>
    </EditorModal>
  );
};


// TODO: add image modal


// TODO: add link modal


// TODO: add tabview modal


// TODO: add ... modal


type ModalName =
  | "table";


interface EditorModalState {
  name: ModalName,
  selection: TextSelection,
}


const EDIT0R_MODALS: Record<ModalName, EditorModalComponent> = {
  table: TableModal,
};


const EditorToolbarButton: React.FC<EditorToolbarButtonProps> = (
  {
    onClick,
    title,
    className,
    keybind,
  }
) => {
  return (
    <button
      type="button"
      className={className}
      onClick={onClick}
      title={keybind ? `${title} (${keybind.replace("Ctrl", ctrlRepr)})` : title}
    />
  );
};


const EditorToolbarPanel__Bare: React.FC<EditorToolbarPanelProps> = ({ textareaRef, onSourceChange, className }) => {
  const [keyboardTrapped, setKeyboardTrapped] = useState<boolean>(false);
  const [currentModal, setCurrentModal] = useState<EditorModalState | null>(null);

  const selectionRef = useRef<TextSelection | null>(null);
  const editHistoryRef = useRef<EditHistory>({ entries: [], pointer: -1, lastEdit: 0, lastEditBatch: 0 });

  // Methods

  const addHistoryEntry = useCallback((entry: EditHistoryEntry, rewritable = false) => {
    const MAX_ENTRY_SIZE = 256;
    const MIN_DELAY_MS = 350;
    const MAX_DELAY_MS = 1000;

    const history = editHistoryRef.current;
    const currentTime = Date.now();
    const shouldRewrite = rewritable
      && (currentTime - history.lastEdit) < MIN_DELAY_MS
      && (currentTime - history.lastEditBatch) < MAX_DELAY_MS;

    history.entries.length = history.pointer + 1;
    if (shouldRewrite) {
      history.entries[history.pointer] = entry;
    } else {
      history.entries.push(entry);
      if (history.entries.length > MAX_ENTRY_SIZE) {
        history.entries.shift();
      }
      history.pointer = history.entries.length - 1;
      history.lastEditBatch = currentTime;
    }
    history.lastEdit = rewritable ? currentTime : 0;
    }, []);

  const renderHistoryEntry = useCallback((entry: EditHistoryEntry) => {
    selectionRef.current = entry.selection;
    onSourceChange(entry.source);
  }, [onSourceChange]);

  const applyChanges = useCallback((source: string, selection: TextSelection) => {
    selectionRef.current = selection;
    addHistoryEntry({ source, selection });
    onSourceChange(source);
  }, [addHistoryEntry, onSourceChange]);

  const insertInline = useCallback((before: string, after: string = before, togglable = true) => {
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
    const selection = {
      start: selectionStart + selectionShift,
      end: selectionEnd + selectionShift,
    }
    const source = isToggling
      ? taValue.slice(0, selectionStart - before.length) + selectedText + taValue.slice(selectionEnd + after.length)
      : taValue.slice(0, selectionStart) + before + selectedText + after + taValue.slice(selectionEnd);

    applyChanges(source, selection);
  }, [applyChanges]);

  const insertBlock = useCallback((before: string, after: string, message: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value: taValue } = textarea;

    const newlinePrefix = taValue.startsWith("\n", selectionStart - 1) || selectionStart === 0 ? "" : "\n\n";
    const newlineSuffix = taValue.endsWith("\n", selectionEnd + 1) ? "" : "\n\n";

    const hasSelection = selectionStart !== selectionEnd;
    const content = hasSelection ? taValue.slice(selectionStart, selectionEnd) : message;

    const selection = {
      start: selectionStart + newlinePrefix.length + before.length + 1,
      end: selectionStart + newlinePrefix.length + before.length + 1 + content.length,
    };
    const injectable = newlinePrefix + before + "\n" + content + "\n" + after + newlineSuffix;
    const source = taValue.slice(0, selectionStart) + injectable + taValue.slice(selectionEnd);

    applyChanges(source, selection);
  }, [applyChanges]);

  const insertList = useCallback((marker: string, message: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value: taValue } = textarea;
    const newlinePrefix = taValue.startsWith("\n", selectionStart - 1) || selectionStart === 0 ? "" : "\n";
    const newlineSuffix = taValue.endsWith("\n", selectionEnd + 1) ? "" : "\n";
    const markerPrefix = `${marker} `;

    const hasSelection = selectionStart !== selectionEnd;
    const content = hasSelection ? taValue.slice(selectionStart, selectionEnd).replaceAll("\n", "\n" + markerPrefix) : message;

    const selection = {
      start: selectionStart + newlinePrefix.length + markerPrefix.length,
      end: selectionStart + newlinePrefix.length + markerPrefix.length + content.length,
    };
    const injectable = newlinePrefix + markerPrefix + content + newlineSuffix;
    const source = taValue.slice(0, selectionStart) + injectable + taValue.slice(selectionEnd);

    applyChanges(source, selection);
  }, [applyChanges]);

  const indent = useCallback((isIncrement: boolean) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const whitespaceRegex = /^\s/;

    const { selectionStart, selectionEnd, value: taValue } = textarea;

    const hasSelection = selectionStart !== selectionEnd;
    const beginningIdx = taValue.slice(0, selectionStart).lastIndexOf("\n") + 1;
    const endingIdx = taValue.indexOf("\n", hasSelection && taValue[selectionEnd - 1] === "\n" ? selectionEnd - 1 : selectionEnd )
    const selectedBlock = taValue.slice(beginningIdx, endingIdx);

    const lines = selectedBlock.split("\n");
    const tmpLines: string[] = [];
    for (const line of lines) tmpLines.push(isIncrement ? ` ${line}` : line.replace(whitespaceRegex, ""));
    const injectable = tmpLines.join("\n");

    const source = taValue.slice(0, beginningIdx) + injectable + taValue.slice(endingIdx);
    const selection = {
      start: beginningIdx,
      end: endingIdx + injectable.length - selectedBlock.length,
    }

    if (injectable === selectedBlock) {
      // React no-ops if source doesn't change therefore `useLayoutEffect` doesn't execute
      textarea.setSelectionRange(selection.start, selection.end);
      textarea.focus();
      return;
    }

    applyChanges(source, selection);
  }, [applyChanges]);

  const insertPlain = useCallback((before: string, after: string = "", template: string = "") => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd, value: taValue } = textarea;

    const newlinePrefix = taValue.startsWith("\n", selectionStart - 1) || selectionStart === 0 ? "" : "\n";
    const newlineSuffix = taValue.endsWith("\n", selectionEnd + 1) ? "" : "\n";

    const injectable = newlinePrefix + before + template + after + newlineSuffix;
    const source = taValue.slice(0, selectionStart) + injectable + taValue.slice(selectionEnd);
    const selection = {
      start: selectionStart + newlinePrefix.length + before.length,
      end: selectionStart + newlinePrefix.length + before.length + template.length
    }

    applyChanges(source, selection);
  }, [applyChanges]);

  const openModal = useCallback((modalName: ModalName) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const { selectionStart, selectionEnd } = textarea;

    setCurrentModal({
      name: modalName,
      selection: {
        start: selectionStart,
        end: selectionEnd,
      }
    });
  }, [setCurrentModal]);

  const closeModal = useCallback(() => {
    if (currentModal) selectionRef.current = currentModal.selection;
    setCurrentModal(null);
  }, [setCurrentModal, currentModal]);

  const submitModal = useCallback((result: string) => {
    const textarea = textareaRef.current;
    if (!textarea || !currentModal) return;

    const { start, end } = currentModal.selection;

    const source = textarea.value.slice(0, start) + result + textarea.value.slice(end);
    const selection = {
      start: start,
      end: start + result.length,
    };
    closeModal();
    applyChanges(source, selection);
  }, [currentModal, closeModal, applyChanges]);

  const renderModal = useCallback(() => {
    if (!currentModal) return;
    const EditorModal = EDIT0R_MODALS[currentModal.name];
    return <EditorModal onSubmit={submitModal} onCancel={closeModal} />
  }, [currentModal, submitModal, closeModal]);

  const undo = useCallback(() => {
    const history = editHistoryRef.current;
    if (history.pointer > 0) {
      history.pointer -= 1;
      renderHistoryEntry(history.entries[history.pointer]);
    }
  }, [renderHistoryEntry]);

  const redo = useCallback(() => {
    const history = editHistoryRef.current;
    if (history.pointer < history.entries.length - 1) {
      history.pointer += 1;
      renderHistoryEntry(history.entries[history.pointer]);
    }
  }, [renderHistoryEntry]);

  // Data

  const textFormatButtonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-bold", title: "Полужирный", onClick: () => insertInline("**"), keybind: "Ctrl+B" },
    { className: "weditor-italic", title: "Курсивный", onClick: () => insertInline("//"), keybind: "Ctrl+I" },
    { className: "weditor-underline", title: "Подчёркнутый", onClick: () => insertInline("__"), keybind: "Ctrl+U" },
    { className: "weditor-strikethrough", title: "Перечёркнутый", onClick: () => insertInline("--") },
    { className: "weditor-teletype", title: "Моноширинный", onClick: () => insertInline("{{", "}}") },
    { className: "weditor-superscript", title: "Верхний регистр", onClick: () => insertInline("^^") },
    { className: "weditor-subscript", title: "Нижний регистр", onClick: () => insertInline(",,") },
    { className: "weditor-raw", title: "Сырой текст", onClick: () => insertInline("@@") },
    { className: "weditor-textcolor", title: "Цветной текст", onClick: () => insertInline("##цвет|", "##", false) },
  ], [insertInline]);

  const paragraphFormatButtonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-alignleft", title: "Выравнивание по левому краю", onClick: () => insertBlock("[[<]]", "[[/<]]"), keybind: "Ctrl+L" },
    { className: "weditor-alignmiddle", title: "Выравнивание по центру", onClick: () => insertBlock("[[=]]", "[[/=]]"), keybind: "Ctrl+E" },
    { className: "weditor-alignright", title: "Выравнивание по правому краю", onClick: () => insertBlock("[[>]]", "[[/>]]"), keybind: "Ctrl+R" },
    { className: "weditor-alignjustify", title: "Выравнивание по ширине", onClick: () => insertBlock("[[==]]", "[[/==]]"), keybind: "Ctrl+J" },
  ], [insertBlock]);

  const listFormatButtonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-bullist", title: "Маркированный список", onClick: () => insertList("*") },
    { className: "weditor-numlist", title: "Нумерованный список", onClick: () => insertList("#") },
    { className: "weditor-incindent", title: "Увеличить отступ", onClick: () => indent(true), keybind: "Tab" },
    { className: "weditor-decindent", title: "Уменьшить отступ", onClick: () => indent(false), keybind: "Shift+Tab" },
    { className: "weditor-deflist", title: "Список определений", onClick: () => insertList(": Термин : ", "Определение") },
  ], [insertList, indent]);

  const blockFormatButtonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-collapsible", title: "Раскрываемый блок", onClick: () => insertBlock("[[collapsible show=\"+ Надпись при открытии спойлера\" hide=\"- Надпись при закрытии спойлера\"]]", "[[/collapsible]]", "Содержимое скрываемого блока") },
    { className: "weditor-quote", title: "Блок цитирования", onClick: () => insertBlock("[[blockquote]]", "[[/blockquote]]", "Содержимое блока цитирования") },
    { className: "weditor-div", title: "div-элемент", onClick: () => insertBlock("[[div]]", "[[/div]]", "Содержимое блока") },
  ], [insertBlock]);

  const inlineFormatButtonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-footnote", title: "Сноска", onClick: () => insertInline("[[footnote]]", "[[/footnote]]", false) },
    { className: "weditor-span", title: "span-элемент", onClick: () => insertInline("[[span]]", "[[/span]]", false) },
    { className: "weditor-extlink", title: "Внешняя ссылка", onClick: () => insertInline("[*ссылка ", "]", false) },
    { className: "weditor-link", title: "Внутренняя ссылка", onClick: () => insertInline("[[[*статья|", "]]]", false) },
  ], [insertInline]);

  const miscFormatButtonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-hr", title: "Горизонтальная линия", onClick: () => insertPlain("----") },
    { className: "weditor-clearfloat", title: "Сброс плавающих элементов", onClick: () => insertPlain("~~~~") },
    { className: "weditor-lines", title: "Вставка пустых строк", onClick: () => insertPlain("[[lines ", "]]", "число") },
  ], [insertPlain]);

  const wizardButtonData: EditorToolbarButtonProps[] = useMemo(() => [
    { className: "weditor-table", title: "Мастер вставки таблиц", onClick: () => openModal("table") },
  ], [openModal]);

  const toolbarButtonGroups: ToolbarGroup[] = useMemo(() => [
    { className: "text-format-options", entry: textFormatButtonData },
    { className: "paragraph-format-options", entry: paragraphFormatButtonData },
    { className: "list-format-options", entry: listFormatButtonData },
    { className: "block-format-options", entry: blockFormatButtonData },
    { className: "inline-format-options", entry: inlineFormatButtonData },
    { className: "misc-format-options", entry: miscFormatButtonData },
    { className: "wizard-format-options", entry: wizardButtonData },
  ], [textFormatButtonData, paragraphFormatButtonData, listFormatButtonData, blockFormatButtonData, inlineFormatButtonData, miscFormatButtonData, wizardButtonData]);

  const actions: Map<KeybindLiteral, () => void> = useMemo(() => {
    const keybindActionsMap: Map<KeybindLiteral, () => void> = new Map([
      ["Ctrl+Z", () => undo()],
      ["Ctrl+Shift+Z", () => redo()],
      ["Escape", () => {
        setKeyboardTrapped(false);
        textareaRef.current?.blur();
      }],
    ]);

    for (const buttonGroup of toolbarButtonGroups) {
      for (const button of buttonGroup.entry) {
        if (button.keybind) keybindActionsMap.set(button.keybind, button.onClick);
      }
    }

    return keybindActionsMap;
  }, [toolbarButtonGroups, setKeyboardTrapped, undo, redo /* Jung Kook - Please Don't Change */]);

  // Hooks

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
      const REPEATABLE_KEYBINDS: KeybindLiteral[] = ["Ctrl+Z", "Ctrl+Shift+Z"];

      const kb = eventToLiteral(ev);
      if (!kb) return;

      const isTab = kb === "Tab" || kb === "Shift+Tab";
      if (isTab && !keyboardTrapped) return;

      const action = actions.get(kb);
      if (!action) return;

      ev.preventDefault();
      if (ev.repeat && !REPEATABLE_KEYBINDS.includes(kb)) return;

      action();
    };

    const focusHandler = () => {
      setKeyboardTrapped(true);
    }
    const blurHandler = () => {
      setKeyboardTrapped(false);
    }

    textarea.addEventListener("keydown", keyPressHandler);
    textarea.addEventListener("focus", focusHandler);
    textarea.addEventListener("blur", blurHandler);
    return () => {
      textarea.removeEventListener("keydown", keyPressHandler);
      textarea.removeEventListener("focus", focusHandler);
      textarea.removeEventListener("blur", blurHandler);
    };
  }, [actions, keyboardTrapped, setKeyboardTrapped]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const inputHandler = () => {
      addHistoryEntry({
        source: textarea.value,
        selection: {
          start: textarea.selectionStart,
          end: textarea.selectionEnd,
        },
      }, true);
    };

    textarea.addEventListener("input", inputHandler);
    return () => textarea.removeEventListener("input", inputHandler);
  }, [addHistoryEntry]);

  return (
    <div className={`wd-editor-toolbar-panel ${className}`} id="wd-editor-toolbar-panel">
      <div className="editor-toolbar-wrapper">
        {toolbarButtonGroups.map(buttonGroup => (
          <div className={`editor-toolbar-options ${buttonGroup.className}`} key={buttonGroup.className}>
            {buttonGroup.entry.map((button, idx) => (
              <EditorToolbarButton
                className={button.className}
                onClick={button.onClick}
                title={button.title}
                keybind={button.keybind}
                key={`${buttonGroup.className}-${idx}`}
              />
            ))}
          </div>
        ))}
      </div>
      <div>
        <p>{keyboardTrapped ? "Используйте Escape чтобы вернуться к навигации по странице" : "Выделите редактор чтобы использовать панель инструментов"}</p>
      </div>
      {renderModal()}
    </div>
  );
};


const EditorToolbarPanel = styled(EditorToolbarPanel__Bare)`
  /* temp styles todo: redo after the button refactor */
  * {
    box-sizing: border-box;
  }
  div {
    height: unset;
  }
  :where(.editor-toolbar-options) {
    display: inline-flex;
    position: relative;
    gap: 2px;
    vertical-align: text-bottom;
  }
  :where(.editor-toolbar-wrapper) {
    display: flex;
  }
  
  button {
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
