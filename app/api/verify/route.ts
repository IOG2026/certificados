import { NextResponse } from "next/server";
import db from "@/lib/database";

export async function POST(req: Request) {
  try {
    const { codigo } = await req.json();

    const certificado = db
      .prepare(
        `
        SELECT
          codigo,
          nombres,
          apellidos,
          curso,
          fecha,
          horas,
          nota
        FROM certificados
        WHERE UPPER(codigo) = UPPER(?)
      `
      )
      .get(codigo);

    if (!certificado) {
      return NextResponse.json({
        valido: false,
        mensaje: "Certificado no encontrado.",
      });
    }

    return NextResponse.json({
      valido: true,
      certificado,
    });
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        valido: false,
        mensaje: "Error interno del servidor.",
      },
      {
        status: 500,
      }
    );
  }
}