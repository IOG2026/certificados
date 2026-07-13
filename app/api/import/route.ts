import { NextRequest, NextResponse } from "next/server";
import * as XLSX from "xlsx";
import db from "@/lib/database";

function convertirFecha(valor: any): string {
  if (!valor) return "";

  if (valor instanceof Date) {
    const dia = String(valor.getDate()).padStart(2, "0");
    const mes = String(valor.getMonth() + 1).padStart(2, "0");
    const anio = valor.getFullYear();

    return `${dia}-${mes}-${anio}`;
  }

  if (typeof valor === "string") {
    return valor;
  }

  if (typeof valor === "number") {
    const fecha = XLSX.SSF.parse_date_code(valor);

    const dia = String(fecha.d).padStart(2, "0");
    const mes = String(fecha.m).padStart(2, "0");
    const anio = String(fecha.y);

    return `${dia}-${mes}-${anio}`;
  }

  return String(valor);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();

    const archivo = formData.get("file") as File;

    if (!archivo) {
      return NextResponse.json(
        {
          ok: false,
          error: "No se recibió ningún archivo.",
        },
        {
          status: 400,
        }
      );
    }

    const buffer = Buffer.from(await archivo.arrayBuffer());

    const workbook = XLSX.read(buffer, {
      cellDates: true,
    });

    const hoja = workbook.Sheets[workbook.SheetNames[0]];

    const datos = XLSX.utils.sheet_to_json<any>(hoja);

    // Consulta si el código ya existe
    const buscar = db.prepare(`
      SELECT id
      FROM certificados
      WHERE codigo = ?
    `);

    // Inserta solamente certificados nuevos
    const insertar = db.prepare(`
      INSERT INTO certificados
      (
        codigo,
        rut,
        nombres,
        apellidos,
        curso,
        fecha,
        horas,
        nota
      )
      VALUES
      (
        @codigo,
        @rut,
        @nombres,
        @apellidos,
        @curso,
        @fecha,
        @horas,
        @nota
      )
    `);

    let importados = 0;
    let duplicados = 0;

    const codigosDuplicados: string[] = [];

    for (const fila of datos) {

      if (!fila.codigo) continue;

      const existe = buscar.get(fila.codigo);

      if (existe) {
        duplicados++;
        codigosDuplicados.push(fila.codigo);
        continue;
      }

      insertar.run({
        codigo: fila.codigo,
        rut: fila.rut,
        nombres: fila.nombres,
        apellidos: fila.apellidos,
        curso: fila.curso,
        fecha: convertirFecha(fila.fecha),
        horas: Number(fila.horas),
        nota: Number(fila.nota),
      });

      importados++;
    }

    return NextResponse.json({
      ok: true,
      importados,
      duplicados,
      codigosDuplicados,
    });

  } catch (error) {

    console.error(error);

    return NextResponse.json(
      {
        ok: false,
        error: "Error al importar el archivo.",
      },
      {
        status: 500,
      }
    );

  }
}