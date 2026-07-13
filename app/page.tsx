"use client";

import { useState } from "react";
import Image from "next/image";

export default function Home() {
  const [codigo, setCodigo] = useState("");
  const [resultado, setResultado] = useState<any>(null);
  const [cargando, setCargando] = useState(false);

  async function verificar() {
    if (!codigo.trim()) {
      alert("Ingrese un código.");
      return;
    }

    setCargando(true);

    try {
      const respuesta = await fetch("/api/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          codigo,
        }),
      });

      const data = await respuesta.json();

      setResultado(data);
    } catch (error) {
      console.error(error);

      setResultado({
        valido: false,
        mensaje: "Error de conexión con el servidor.",
      });
    }

    setCargando(false);
  }

  function formatearFecha(fecha: any) {
    if (!fecha) return "";

    // Si viene como número de Excel
    if (!isNaN(Number(fecha))) {
      const excelDate = Number(fecha);
      const jsDate = new Date((excelDate - 25569) * 86400 * 1000);

      return jsDate.toLocaleDateString("es-CL");
    }

    return fecha;
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "#eef3f9",
        fontFamily: "Arial, Helvetica, sans-serif",
        padding: 30,
      }}
    >
      <div
        style={{
          width: 500,
          background: "#fff",
          borderRadius: 28,
          padding: 40,
          boxShadow: "0 18px 45px rgba(0,0,0,.12)",
          textAlign: "center",
        }}
      >
        <Image
          src="/images/iogroup.png"
          alt="IO Group"
          width={350}
          height={97}
          priority
          style={{
            width: "280px",
            height: "auto",
            margin: "0 auto 20px",
          }}
        />

        <Image
          src="/images/verify.png"
          alt="Verify"
          width={220}
          height={199}
          priority
          style={{
            width: "160px",
            height: "auto",
            margin: "0 auto 24px",
          }}
        />

        <h2
          style={{
            color: "#f7931e",
            fontSize: 22,
            marginBottom: 28,
          }}
        >
          Verificación de certificados digitales
        </h2>

        <input
          type="text"
          value={codigo}
          onChange={(e) => setCodigo(e.target.value)}
          placeholder="Ingrese el código del certificado"
          style={{
            width: "100%",
            padding: 18,
            borderRadius: 12,
            border: "1px solid #d8dce5",
            fontSize: 18,
            boxSizing: "border-box",
          }}
        />

        <button
          onClick={verificar}
          disabled={cargando}
          style={{
            width: "100%",
            marginTop: 18,
            padding: 18,
            borderRadius: 12,
            border: "none",
            background: "#f7931e",
            color: "#fff",
            fontWeight: 700,
            fontSize: 20,
            cursor: cargando ? "default" : "pointer",
          }}
        >
          {cargando ? "Verificando..." : "Verificar certificado"}
        </button>

        {resultado && (
          <div
            style={{
              marginTop: 30,
              padding: 22,
              borderRadius: 14,
              background: resultado.valido ? "#edf9ef" : "#fff2f2",
              border: resultado.valido
                ? "1px solid #b7dfc0"
                : "1px solid #efb2b2",
              textAlign: "left",
            }}
          >
            {resultado.valido ? (
              <>
                <h3
                  style={{
                    color: "#0b8f3c",
                    marginTop: 0,
                  }}
                >
                  ✅ Certificado válido
                </h3>

                <p>
                  <b>Alumno:</b>{" "}
                  {resultado.certificado.nombres}{" "}
                  {resultado.certificado.apellidos}
                </p>

                <p>
                  <b>Curso:</b> {resultado.certificado.curso}
                </p>

                <p>
                  <b>Fecha:</b>{" "}
                  {formatearFecha(resultado.certificado.fecha)}
                </p>

                <p>
                  <b>Horas:</b> {resultado.certificado.horas}
                </p>

                <p>
                  <b>Nota Final:</b> {resultado.certificado.nota}
                </p>

                <p>
                  <b>Código:</b> {resultado.certificado.codigo}
                </p>
              </>
            ) : (
              <>
                <h3
                  style={{
                    color: "#c62828",
                    marginTop: 0,
                  }}
                >
                  ❌ Certificado no encontrado
                </h3>

                <p>{resultado.mensaje}</p>
              </>
            )}
          </div>
        )}

        <div
          style={{
            marginTop: 28,
            padding: 18,
            background: "#f7f8fb",
            borderRadius: 12,
            border: "1px solid #dfe5ef",
            color: "#5d6b82",
            lineHeight: 1.6,
          }}
        >
          Escanee el código QR impreso en su diploma
          <br />
          o ingrese el código manualmente.
        </div>

        <div
          style={{
            marginTop: 24,
            color: "#98a4b7",
            fontSize: 14,
          }}
        >
          © 2026 IO Group Chile
        </div>
      </div>
    </main>
  );
}