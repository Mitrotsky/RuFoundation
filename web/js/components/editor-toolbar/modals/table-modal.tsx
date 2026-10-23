import React from "react";
import { useState } from "react";
import styled from "styled-components";
import EditorModal from "~components/editor-toolbar/modals/base-modal";
import { EditorModalStyleBase } from "~components/editor-toolbar/modals/base-modal";
import type { EditorModalComponent } from "~components/editor-toolbar/modals/base-modal";
import { MOBILE_SIZE } from "~reactive/theme/Theme.consts";


const TableModalStyle = styled(EditorModalStyleBase)`
  .editor-modal-margin input {
    max-width: 8ch;
  }

  .editor-modal-margin .editor-modal-subgrid-row {
    justify-items: left;
  }

  @media (max-width: ${MOBILE_SIZE}px) {
    .editor-modal-margin input {
      max-width: revert;
      width: 100%;
    }
  }
`;


const TableModal: EditorModalComponent = ({
  onCancel,
  onSubmit,
}) => {
  const [rows, setRows] = useState<number>(2);
  const [columns, setColumns] = useState<number>(2);
  const [useHeader, setUseHeader] = useState<boolean>(false);
  
  const MIN_ROWS = 2;
  const MIN_COLUMNS = 2;
  
  const createTableRow = (length: number, isHeader: boolean = false): string => {
    const rowArray: string[] = [];
    for (let i = 0; i < length; i++) rowArray.push(`||${isHeader ? "~" : ""} Ячейка `);
    return rowArray.join("") + "||";
  };
  
  const createTable = (): string => {
    const totalRows = Number.isNaN(rows) ? MIN_ROWS : Math.min(99, Math.max(rows, MIN_ROWS));
    const totalColumns = Number.isNaN(columns) ? MIN_COLUMNS : Math.min(99, Math.max(columns, MIN_COLUMNS));
    
    const tableRows: string[] = [];
    for (let i = 0; i < totalRows; i++) tableRows.push(createTableRow(totalColumns));
    if (useHeader) tableRows[0] = createTableRow(totalColumns, true);
    return tableRows.join("\n");
  };
  
  return (
    <EditorModal onSubmit={() => onSubmit(createTable())} onCancel={() => onCancel()}>
      <TableModalStyle>
        <p className="editor-modal-header">Мастер вставки таблиц</p>
        
        <div className="editor-modal-form-grid editor-modal-margin">
          <label className="editor-modal-subgrid-row">
            Количество строк:
            <input
              type="number"
              name="wd-ed-tablewizard-rows"
              value={rows}
              onChange={ev => setRows(ev.target.valueAsNumber)}
              placeholder={`${MIN_ROWS}`}
            />
          </label>
          <label className="editor-modal-subgrid-row">
            Количество столбцов:
            <input
              type="number"
              name="wd-ed-tablewizard-columns"
              value={columns}
              onChange={ev => setColumns(ev.target.valueAsNumber)}
              placeholder={`${MIN_COLUMNS}`}
            />
          </label>
          <label className="editor-modal-subgrid-row">
            Первая строка как заголовок:
            <input
              type="checkbox"
              checked={useHeader}
              onChange={e => setUseHeader(e.target.checked)}
            />
          </label>
        </div>
        
        <div className="editor-modal-hint">
          <b>Подсказка</b>: чтобы выровнять содержимое ячейки, добавьте сразу после
          маркера <code>||</code> символ <code>&lt;</code>, <code>=</code> или <code>&gt;</code> (для выравнивания по
          левому краю, центру и правому краю соответственно).
        </div>
      </TableModalStyle>
    </EditorModal>
  );
};


export default TableModal;
