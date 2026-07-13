import * as XLSX from "xlsx";

export function leerExcel(buffer: Buffer) {
  const workbook = XLSX.read(buffer, {
    type: "buffer",
  });

  const hoja = workbook.Sheets[workbook.SheetNames[0]];

  const datos = XLSX.utils.sheet_to_json(hoja);

  return datos;
}