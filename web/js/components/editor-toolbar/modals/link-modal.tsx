import React from "react";
import { useCallback, useMemo, useState } from "react";
import styled from "styled-components";
import EditorModal from "~components/editor-toolbar/modals/base-modal";
import { EditorModalStyleBase } from "~components/editor-toolbar/modals/base-modal";
import type { EditorModalComponent } from "~components/editor-toolbar/modals/base-modal";


type LinkType = "external" | "internal";


const LinkModalStyle = styled(EditorModalStyleBase)`
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

  fieldset input {
    margin-block: 0;
    margin-left: 0;
  }

  .link-modal-main-content {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: 0.1em 0.4em;
    width: fit-content;
    margin-inline: auto;
  }
`;


const LinkModal: EditorModalComponent = ({
  onCancel,
  onSubmit,
}) => {
  const [linkType, setLinkType] = useState<LinkType>("external");
  const [isNewPage, setIsNewPage] = useState<boolean>(false);
  const [link, setLink] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  
  // TODO: move some of these functions outside the module
  const passedURL = useMemo((): URL | null => URL.parse(link.trim(), window.location.origin), [link]);
  
  const isSameDomain = useMemo((): boolean => {
    const domain = window.location.hostname;
    const result = passedURL ? passedURL.hostname.split(".").slice(-2).join(".") : "";
    return domain === result;
  }, [passedURL]);
  
  const createExternalLink = useCallback((): string => {
    return `[${isNewPage ? "*" : ""}${link.trim()} ${title.trim() || "Ссылка"}]`;
  }, [link, title, isNewPage]);
  
  const createInternalLink = useCallback((): string => {
    const pageId = (isSameDomain && passedURL) ? passedURL.pathname.split("/")[1] : link.trim();
    return `[[[${isNewPage ? "*" : ""}${pageId}|${title.trim()}]]]`;
  }, [link, isSameDomain, passedURL, title, isNewPage]);
  
  const createLink = useCallback((): string => {
    const linkFn: Record<LinkType, () => string> = {
      external: createExternalLink,
      internal: createInternalLink,
    };
    return linkFn[linkType]();
  }, [linkType, createExternalLink, createInternalLink]);
  
  return (
    <EditorModal onSubmit={() => onSubmit(createLink())} onCancel={() => onCancel()}>
      <LinkModalStyle>
        <p className="editor-modal-header"><b>Мастер вставки ссылок</b></p>
        <fieldset>
          <legend>Тип вставляемой ссылки</legend>
          <div className="link-modal-radio-options">
            <label>
              <input
                type="radio"
                name="wd-ed-linkwizard-type"
                value="external"
                checked={linkType === "external"}
                onChange={() => setLinkType("external")}
              />
              Внешняя ссылка
            </label>
            <label>
              <input
                type="radio"
                name="wd-ed-linkwizard-type"
                value="internal"
                checked={linkType === "internal"}
                onChange={() => setLinkType("internal")}
              />
              Внутренняя ссылка
            </label>
          </div>
          <label className="editor-modal-grid-spanner">
            Открывать в новой вкладке:
            <input
              type="checkbox"
              checked={isNewPage}
              onChange={(ev) => setIsNewPage(ev.target.checked)}
            />
          </label>
        </fieldset>
        <div className="link-modal-main-content">
          <label htmlFor="wd-ed-linkwizard-link">Ссылка на страницу: </label>
          <input
            className="text"
            type="text"
            id="wd-ed-linkwizard-link"
            placeholder="https://example.com/"
            size={28}
            onChange={(ev) => setLink(ev.target.value)}
          />
          <label htmlFor="wd-ed-linkwizard-text">Текст ссылки: </label>
          <input
            className="text"
            type="text"
            id="wd-ed-linkwizard-text"
            placeholder="Ссылка"
            size={28}
            value={title}
            onChange={(ev) => setTitle(ev.target.value)}
          />
        </div>
        <div>
          {(linkType === "internal" && !isSameDomain) && (<p>
            Введённая ссылка ведёт на внешний сайт. Будет вставлена полная ссылка.
          </p>)}
          {(linkType === "external" && isSameDomain) && (<p>
            Введённая ссылка ведёт на этот сайт. Используйте опцию «Внутренняя ссылка».
          </p>)}
        </div>
      </LinkModalStyle>
    </EditorModal>
  );
};


export default LinkModal;
