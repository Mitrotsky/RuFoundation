import React from "react";
import { useEffect } from "react";
import styled from "styled-components";
import WikidotModal from "~util/wikidot-modal";


interface EditorModalProps {
  onSubmit: () => void,
  onCancel: () => void,
  children: React.ReactNode,
}


interface EditorModalComponentProps {
  onSubmit: (result: string) => void,
  onCancel: () => void,
  pageId?: string,
}


type EditorModalComponent = React.FC<EditorModalComponentProps>;


const EditorModalStyleBase = styled.div`
  * {
    box-sizing: border-box;
  }
  
  :is(button, input) {
    padding-block: 0.1em;
  }

  :is(input[type="text"], input[type="number"], textarea, select) {
    border: 1px solid #777;
    margin: 0 1px;
    padding: 1px 2px;
    background-color: #FFF;
    color: #333;
  }

  button {
    padding-inline: 1em;
  }
  
  button:disabled {
    filter: contrast(0.7);
    cursor: not-allowed;
  }

  fieldset {
    display: grid;
    gap: 0.4em;
    border: 1px solid #aaa;
    margin: 1em auto;
    width: fit-content;
  }
  
  fieldset label {
    display: flex;
    align-items: center;
    column-gap: 0.4em;
  }

  textarea {
    field-sizing: content;
    width: 100%;
    min-height: 1lh;
    resize: none;
  }

  :is(fieldset, label) input[type="radio"] {
    margin-block: 0;
    margin-left: 0;
  }

  .editor-modal-header {
    text-align: center;
    font-weight: bold;
  }
  
  .editor-modal-loader-container {
    display: grid;
    place-items: center;
    margin-inline: auto;
    padding: 1em;
    background-color: rgba(119 119 119 / 0.5);
  }
  
  .editor-modal-grid-spanner {
    grid-column: -1 / 1;
  }
  
  .editor-modal-hint {
    text-align: center;
    text-wrap: balance;
  }
`;


const EditorModal: React.FC<EditorModalProps> = (
  {
    onSubmit,
    onCancel,
    children,
  },
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
      {
        title: "Отменить",
        onClick: onCancel,
      },
      {
        title: "Вставить код",
        onClick: onSubmit,
      },
    ]}>
      {children}
    </WikidotModal>
  );
};


export default EditorModal;
export { EditorModalStyleBase };
export type { EditorModalComponentProps, EditorModalComponent };
