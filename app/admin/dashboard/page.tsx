export default function Dashboard() {
  return (
    <main
      style={{
        minHeight: "100vh",
        background: "#eef3f9",
        padding: 40,
        fontFamily: "Arial, Helvetica, sans-serif",
      }}
    >
      <h1 style={{ color: "#f7931e" }}>
        Panel de Administración
      </h1>

      <hr />

      <div
        style={{
          marginTop: 30,
          background: "#ffffff",
          padding: 25,
          borderRadius: 16,
          boxShadow: "0 10px 30px rgba(0,0,0,.08)",
          maxWidth: 500,
        }}
      >
        <h2>Dashboard</h2>

        <p><b>Certificados registrados:</b> 0</p>

        <p><b>Última importación:</b> Sin registros</p>

        <button
          style={{
            marginTop: 20,
            padding: "14px 24px",
            border: "none",
            borderRadius: 10,
            background: "#f7931e",
            color: "#fff",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          Importar Excel
        </button>
      </div>
    </main>
  );
}
