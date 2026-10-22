import React, { useSyncExternalStore } from "react";
import { useCallback, useState, useEffect } from "react";
import styled from "styled-components";
import EditorModal from "~components/editor-toolbar/modals/base-modal";
import { EditorModalStyleBase } from "~components/editor-toolbar/modals/base-modal";
import { fetchArticleFiles } from "~api/files";
import { APIError } from "~util/fetch-util";
import type { EditorModalComponent } from "~components/editor-toolbar/modals/base-modal";
import type { ArticleFile } from "~api/files";
import Loader from "~util/loader";
import { MOBILE_SIZE } from "~reactive/theme/Theme.consts";


type FileLoadingStaus = "pending" | "success" | "error";

type ImageLinkType = "freeLink" | "file";
type ImageMarkupType = "legacy" | "include";
type ImageAlign = "left" | "center" | "right";


interface FileStoreBase {
  status: FileLoadingStaus,
  files: ArticleFile[] | null,
  errorMessage: string | null,
}

interface FileStoreSuccess extends FileStoreBase {
  status: "success",
  files: ArticleFile[],
  errorMessage: null,
}

interface FileStorePending extends FileStoreBase {
  status: "pending",
  files: null,
  errorMessage: null,
}

interface FileStoreError extends FileStoreBase {
  status: "error",
  files: null,
  errorMessage: string,
}

type FileStoreState = FileStoreSuccess | FileStorePending | FileStoreError;


// An overcomplicated solution of a simple problem, but I'm a sucker for OOP so
class FileStore {
  private readonly listeners: Set<() => void> = new Set();
  private state: FileStoreState = {
    status: "pending",
    files: null,
    errorMessage: null,
  };
  
  private emit = () => this.listeners.forEach((listener) => listener());
  
  public subscribe = (listener: () => void): () => void => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  
  public getSnapshot = () => this.state;
  
  public setState = (state: FileStoreState) => {
    this.state = state;
    this.emit();
  };
  
  public load = (pageId: string, force: boolean = false) => {
    if (this.state.status === "success" && !force) return;
    
    this.setState({
      status: "pending",
      files: null,
      errorMessage: null,
    });
    
    fetchArticleFiles(pageId)
      .then(response => this.setState({
        status: "success",
        files: response.files.filter(file => file.mimeType.startsWith("image")),
        errorMessage: null,
      }))
      .catch((error: unknown) => {
        const errorMessage = (error instanceof APIError)
          ? error.message || "Ошибка связи с сервером"
          : "Неизвестная ошибка";
        this.setState({
          status: "error",
          files: null,
          errorMessage: errorMessage,
        });
      });
  };
}


const fileStore = new FileStore();

const ImageModalStyle = styled(EditorModalStyleBase)`
  .image-modal-files-container {
    max-height: 128px;
    width: fit-content;
    margin-inline: auto;
    overflow-y: auto;
    scrollbar-gutter: stable;
    padding-inline: 1em;
  }

  .image-modal-files-container-list {
    width: fit-content;
  }

  .image-modal-files-container-list label {
    display: flex;
    align-items: center;
    column-gap: 0.4em;
  }

  .image-modal-buttons {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 0.4em;
  }

  .image-modal-additional-options-selects {
    display: grid;
    grid-template-columns: max-content auto;
    gap: 0.1em 0.4em;
    width: fit-content;
    margin-inline: auto;
  }

  @media (max-width: ${MOBILE_SIZE}px) {
    .image-modal-additional-options-selects {
      grid-template-columns: 1fr;
    }
  }

  .image-modal-additional-options-selects label {
    display: grid;
    grid-column: -1 / 1;
    grid-template-columns: subgrid;
    align-items: center;
  }
`;


const ImageModal: EditorModalComponent = ({
  onSubmit,
  onCancel,
  pageId,
}) => {
  const fileStoreState = useSyncExternalStore(fileStore.subscribe, fileStore.getSnapshot);
  const [imageLinkType, setImageLinkType] = useState<ImageLinkType>("freeLink");
  
  const [selectedFile, setSelectedFile] = useState<string>("");
  const [markupType, setMarkupType] = useState<ImageMarkupType>("include");
  const [caption, setCaption] = useState<string>("");
  const [align, setAlign] = useState<ImageAlign>("right");
  const [width, setWidth] = useState<string>("300px");
  
  const createLegacyImage = useCallback((): string => {
    const alignMap: Record<ImageAlign, string> = {
      left: "limg",
      center: "cimg",
      right: "rimg",
    };
    
    const top = `[[div_ class="${alignMap[align]}"]]\n[[image ${encodeURI(selectedFile.trim())} style="width: ${width.trim() || "300px"}"]]\n`;
    const content = `[[span]]${caption.replaceAll("\n", " _\n")}[[/span]]\n`;
    const bottom = "[[/div]]";
    
    return top + content + bottom;
  }, [caption, width, selectedFile, align]);
  
  const createIncludeImage = useCallback((): string => {
    const content = [
      `  | name=${encodeURI(selectedFile.trim())}`,
      `  | align=${align}`,
      `  | caption=${caption.trim()}`,
      `  | width=${width.trim() || "300px"}`,
    ].join("\n");
    
    return "[[include component:image-block\n" + content + "\n]]";
  }, [caption, width, selectedFile, align]);
  
  const createImage = useCallback((): string => {
    const imageFn: Record<ImageMarkupType, () => string> = {
      include: createIncludeImage,
      legacy: createLegacyImage,
    };
    return imageFn[markupType]();
  }, [markupType, createLegacyImage, createIncludeImage]);
  
  const onRefreshClick = useCallback(() => {
    if (!pageId) return;
    setSelectedFile("");
    fileStore.load(pageId, true);
  }, [pageId, setSelectedFile]);
  
  useEffect(() => {
    if (!pageId) return;
    fileStore.load(pageId);
  }, []);
  
  useEffect(() => {
    if (fileStoreState.status === "success" && fileStoreState.files.length) {
      setSelectedFile(fileStoreState.files[0].name);
    }
  }, [fileStoreState.files]);
  
  return (
    <EditorModal onSubmit={() => onSubmit(createImage())} onCancel={() => onCancel()}>
      <ImageModalStyle>
        <p className="editor-modal-header">Мастер вставки изображений</p>
        <fieldset>
          <legend>Тип вставляемого изображения</legend>
          <div>
            <label>
              <input
                type="radio"
                name="wd-ed-imagewizard-type"
                value="freeLink"
                checked={imageLinkType === "freeLink"}
                onChange={() => setImageLinkType("freeLink")}
              />
              Произвольная ссылка
            </label>
            {pageId && (
              <label>
                <input
                  type="radio"
                  name="wd-ed-imagewizard-type"
                  value="file"
                  checked={imageLinkType === "file"}
                  onChange={() => setImageLinkType("file")}
                />
                Файл статьи
              </label>
            )}
          </div>
        </fieldset>
        
        {imageLinkType === "freeLink" && (
          <div className="image-modal-additional-options-selects">
            <label>
              Ссылка:
              <input
                type="text"
                name="wd-ed-imagewizard-link"
                value={selectedFile}
                onChange={ev => setSelectedFile(ev.target.value)}
                placeholder="Ссылка на файл"
              />
            </label>
            {/* todo add domain check */}
          </div>
        )}
        
        {imageLinkType === "file" && (
          <div>
            <div className="image-modal-buttons">
              <button
                type="button"
                onClick={onRefreshClick}
                disabled={fileStoreState.status === "pending"}
              >Перезагрузить
              </button>
            </div>
            
            {fileStoreState.status === "pending" && (
              <div className="editor-modal-loader-container">
                <Loader/>
              </div>
            )}
            
            {fileStoreState.status === "error" && (
              <div className="image-modal-error-container">
                <p>{`К сожалению, что-то пошло не так: ${fileStoreState.errorMessage}`}</p>
              </div>
            )}
            
            {fileStoreState.status === "success" && (
              <div className="image-modal-files-container">
                <div className="image-modal-files-container-list">
                  {fileStoreState.files.length ? (
                    fileStoreState.files.map(image => (
                      <label key={image.name}>
                        <input
                          type="radio"
                          name="image-modal-file-select"
                          value={image.name}
                          checked={image.name === selectedFile}
                          onChange={ev => setSelectedFile(ev.target.value)}
                        />
                        {image.name}
                      </label>
                    ))
                  ) : <p className="editor-modal-grid-spanner">На данной странице нет ни одного файла изображений.</p>}
                </div>
              </div>
            )}
          </div>
        )}
        
        <div>
          <label>
            Подпись:
            <textarea
              className="text"
              name="wd-ed-imagewizard-caption"
              value={caption}
              onChange={ev => setCaption(ev.target.value)}
              onInput={ev => {
                if (!CSS.supports("field-sizing", "content")) {
                  const textarea = ev.currentTarget;
                  textarea.style.height = "auto";
                  textarea.style.height = `${textarea.scrollHeight}px`;
                }
              }}
              placeholder="Описание изображения"
            />
          </label>
          <div className="image-modal-additional-options-selects">
            <label>
              Тип синтаксиса:
              <select
                id="wd-ed-imagewizard-markup-select"
                value={markupType}
                onChange={ev => setMarkupType(ev.target.value as ImageMarkupType)}
              >
                <option value="legacy">Классический (rimg/cimg/limg)</option>
                <option value="include">Стандартный блок с изображением</option>
              </select>
            </label>
            <label>
              Выравнивание:
              <select
                id="wd-ed-imagewizard-align-select"
                value={align}
                onChange={ev => setAlign(ev.target.value as ImageAlign)}
              >
                <option value="left">Слева</option>
                <option value="center">По центру</option>
                <option value="right">Справа</option>
              </select>
            </label>
            <label>
              Ширина:
              <input
                type="text"
                value={width}
                onChange={ev => setWidth(ev.target.value)}
                placeholder="300px"
              />
            </label>
          </div>
        </div>
        <div className="editor-modal-hint">
          <p>
            <b>Подсказка</b>: поле «Ширина» принимает в себя <a
            href="https://developer.mozilla.org/en-US/docs/Web/CSS/Reference/Properties/width"
            target="_blank"
          > любое валидное в CSS значение для ширины</a>.
          </p>
        </div>
      </ImageModalStyle>
    </EditorModal>
  );
};


export default ImageModal;
