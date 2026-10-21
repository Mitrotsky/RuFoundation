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
}


type EditorModalComponent = React.FC<EditorModalComponentProps>;


const EditorModalStyleBase = styled.div`
  :is(button, input) {
    padding-block: 0.1em;
  }

  button {
    padding-inline: 1em;
  }

  .editor-modal-header {
    text-align: center;
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
