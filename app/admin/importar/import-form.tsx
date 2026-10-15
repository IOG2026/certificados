"use client";

import { useRef, useState } from "react";

export default function ImportarExcel() {
  const [archivo, setArchivo] = useState<File | null>(null);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState("");
  const [esError, setEsError] = useState(false);

  const inputFile = useRef<HTMLInputElement>(null);

  function seleccionarArchivo(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    if (e.target.files && e.target.files.length > 0) {
      setArchivo(e.target.files[0]);
      setMensaje("");
    }
  }

  async function importarExcel() {
    if (!archivo) {
      alert("Seleccione un archivo Excel.");
      return;
    }

    setSubiendo(true);
    setMensaje("");

    try {
      const formData = new FormData();
      formData.append("file", archivo);

      const respuesta = await fetch("/api/import", {
        method: "POST",
        body: formData,
      });

      const data = await respuesta.json();

      if (respuesta.ok && data.ok) {
        setEsError(false);
        setMensaje(
          `✅ Se importaron correctamente ${data.importados} certificados.`
        );
      } else {
        setEsError(true);
        setMensaje(data.error || "Error al importar el archivo.");
      }
    } catch (error) {
      console.error(error);
      setEsError(true);
      setMensaje("No fue posible conectar con el servidor.");
    }

    setSubiendo(false);
  }

  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#eef3f9",
        padding: 40,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 850,
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            color: "#f7931e",
            marginBottom: 10,
          }}
        >
          Importar certificados
        </h1>

        <p
          style={{
            color: "#666",
            marginBottom: 35,
          }}
        >
          Cargue un archivo Excel con los certificados emitidos por IO Group.
        </p>

        <div
          style={{
            background: "#ffffff",
            borderRadius: 20,
            padding: 40,
            boxShadow: "0 15px 35px rgba(0,0,0,.08)",
          }}
        >
          <div
            onClick={() => inputFile.current?.click()}
            style={{
              border: "3px dashed #d5dce8",
              borderRadius: 18,
              padding: "70px 30px",
              textAlign: "center",
              cursor: "pointer",
            }}
          >
            <div
              style={{
                fontSize: 60,
              }}
            >
              📄
            </div>

            <h2
              style={{
                color: "#444",
                marginTop: 15,
              }}
            >
              Seleccione un archivo Excel
            </h2>

            <p
              style={{
                color: "#777",
                marginTop: 8,
              }}
            >
              Haga clic aquí para seleccionar el archivo (.xlsx)
            </p>

            <input
              ref={inputFile}
              type="file"
              accept=".xlsx,.xls"
              onChange={seleccionarArchivo}
              style={{
                display: "none",
              }}
            />
          </div>

          <div
            style={{
              marginTop: 35,
              padding: 20,
              background: "#f7f9fc",
              borderRadius: 12,
            }}
          >
            <b>Archivo seleccionado</b>

            <p
              style={{
                marginTop: 10,
                color: "#666",
              }}
            >
              {archivo
                ? archivo.name
                : "Todavía no ha seleccionado ningún archivo."}
            </p>
          </div>

          <button
            onClick={importarExcel}
            disabled={!archivo || subiendo}
            style={{
              marginTop: 30,
              width: "100%",
              padding: 18,
              border: "none",
              borderRadius: 12,
              background:
                !archivo || subiendo ? "#cccccc" : "#f7931e",
              color: "#fff",
              fontSize: 18,
              fontWeight: "bold",
              cursor:
                !archivo || subiendo
                  ? "default"
                  : "pointer",
            }}
          >
            {subiendo
              ? "Importando..."
              : "Importar certificados"}
          </button>

          {mensaje && (
            <div
              style={{
                marginTop: 25,
                padding: 18,
                borderRadius: 12,
                background: esError
                  ? "#fff2f2"
                  : "#edf9ef",
                border: esError
                  ? "1px solid #efb2b2"
                  : "1px solid #b7dfc0",
                color: esError ? "#b00020" : "#0b8f3c",
                fontWeight: 600,
              }}
            >
              {mensaje}
            </div>
          )}

          <div
            style={{
              marginTop: 30,
              background: "#fff8eb",
              border: "1px solid #ffe0a3",
              borderRadius: 12,
              padding: 20,
            }}
          >
            <b>Antes de importar:</b>

            <ul
              style={{
                marginTop: 12,
                lineHeight: 1.8,
                color: "#555",
              }}
            >
              <li>El archivo debe estar en formato Excel (.xlsx).</li>
              <li>Debe utilizar la plantilla oficial de IO Verify.</li>
              <li>No cambie los nombres de las columnas.</li>
              <li>El código de certificado debe ser único.</li>
            </ul>
          </div>
        </div>
      </div>
    </main>
  );
}