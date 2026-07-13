"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminLogin() {
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const router = useRouter();

  function ingresar() {
    if (usuario === "admin" && password === "iogroup") {
      router.push("/admin/dashboard");
    } else {
      alert("Usuario o contraseña incorrectos.");
    }
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
      }}
    >
      <div
        style={{
          width: 420,
          background: "#ffffff",
          padding: 40,
          borderRadius: 20,
          boxShadow: "0 15px 40px rgba(0,0,0,.12)",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            color: "#f7931e",
            marginBottom: 35,
          }}
        >
          Administración IO Verify
        </h1>

        <input
          type="text"
          placeholder="Usuario"
          value={usuario}
          onChange={(e) => setUsuario(e.target.value)}
          style={{
            width: "100%",
            padding: 16,
            marginBottom: 18,
            borderRadius: 10,
            border: "1px solid #d8dce5",
            boxSizing: "border-box",
            fontSize: 16,
          }}
        />

        <input
          type="password"
          placeholder="Contraseña"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          style={{
            width: "100%",
            padding: 16,
            marginBottom: 25,
            borderRadius: 10,
            border: "1px solid #d8dce5",
            boxSizing: "border-box",
            fontSize: 16,
          }}
        />

        <button
          onClick={ingresar}
          style={{
            width: "100%",
            padding: 16,
            border: "none",
            borderRadius: 10,
            background: "#f7931e",
            color: "#ffffff",
            fontSize: 18,
            fontWeight: 700,
            cursor: "pointer",
          }}
        >
          Ingresar
        </button>
      </div>
    </main>
  );
}
