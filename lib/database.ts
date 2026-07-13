import Database from "better-sqlite3";

const db = new Database("ioverify.db");

db.exec(`
CREATE TABLE IF NOT EXISTS certificados (

  id INTEGER PRIMARY KEY AUTOINCREMENT,

  codigo TEXT UNIQUE,

  rut TEXT,

  nombres TEXT,

  apellidos TEXT,

  curso TEXT,

  fecha TEXT,

  horas INTEGER,

  nota REAL

);
`);

export default db;