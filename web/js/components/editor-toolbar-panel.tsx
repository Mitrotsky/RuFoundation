import React from "react"
import { useCallback } from 'react'


interface EditorToolbarPanelProps {
  readonly textareaRef: React.RefObject<HTMLTextAreaElement>,
}


const EditorToolbarPanel: React.FC<EditorToolbarPanelProps> = ({ textareaRef }) => {

  const hugSelection = useCallback((before: string, after: string = before) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const { selectionStart, selectionEnd } = textarea;
    // `textarea.value` is always `source` as long as we call `onSourceChange` in one way or another
    // dispatching input event calls `onChange` in the parent component, witch in turn calls `onSourceChange`
    // passing `onSourceChange` as prop and calling it directly is probably better but idk
    const selectedText = textarea.value.slice(selectionStart, selectionEnd)
    textarea.setRangeText(before + selectedText + after, selectionStart, selectionEnd, "preserve")
    textarea.dispatchEvent(new Event("input", { bubbles: true }))

    textarea.focus()
    textarea.setSelectionRange(selectionStart, selectionEnd + before.length + after.length)
  }, []);

  return (
    <div className="wd-editor-toolbar-panel" id="wd-editor-toolbar-panel">
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

          <li><a className="weditor-bold" title="Полужирный" onClick={() => hugSelection("**")}><span>bold</span></a></li>
          <li><a className="weditor-italic" href="#" title=""><span>italic</span></a></li>
          <li><a className="weditor-underline" href="#" title=""><span>underline</span></a></li>
          <li><a className="weditor-strikethrough" href="#" title=""><span>strikethrough</span></a></li>
          <li><a className="weditor-teletype" href="#" title=""><span>teletype</span></a></li>
          <li><a className="weditor-quote" href="#" title=""><span>quote</span></a></li>
          <li><a className="weditor-superscript" href="#" title=""><span>superscript</span></a></li>
          <li><a className="weditor-subscript" href="#" title=""><span>subscript</span></a></li>
          <li><a className="weditor-raw" href="#" title=""><span>raw</span></a></li>
        </ul>
      </div>
      <div>
        <ul>
          <li><a className="weditor-hr" href="#" title=""><span>hr</span></a></li>

          <li><a className="weditor-div" href="#" title=""><span>div</span></a>
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
  )
}


export default EditorToolbarPanel