import React from "react";
import { useState } from "react";
import styled from "styled-components";
import EditorModal from "~components/editor-toolbar/modals/base-modal";
import { EditorModalStyleBase } from "~components/editor-toolbar/modals/base-modal";
import type { EditorModalComponent } from "~components/editor-toolbar/modals/base-modal";


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
      {/* TODO: update styles */}
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
          <b>Подсказка</b>: чтобы выровнять содержимое ячейки, добавьте сразу после
          маркера <code>||</code> символ <code>&lt;</code>, <code>=</code> или <code>&gt;</code> (для выравнивания по
          левому краю, центру и правому краю соответственно).
        </div>
      </div>
    </EditorModal>
  );
};


export default TableModal;
