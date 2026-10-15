// Prueba integral aislada: nunca utiliza credenciales remotas ni una base existente.
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { randomBytes, createHash } from 'node:crypto';
import { createClient } from '@libsql/client';
import XLSX from 'xlsx';
const temp = await mkdtemp(join(tmpdir(), 'io-verify-auth-'));
const url = `file:${join(temp, 'test.db')}`;
const secret = randomBytes(32).toString('hex');
const password = randomBytes(16).toString('hex');
const newPassword = randomBytes(16).toString('hex');
const base = 'http://127.0.0.1:3200';
const db = createClient({ url });
await db.execute('CREATE TABLE certificados(id INTEGER PRIMARY KEY, codigo TEXT UNIQUE, rut TEXT, nombres TEXT, apellidos TEXT, curso TEXT, fecha TEXT, horas REAL, nota TEXT)');
const child = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--port', '3200', '--hostname', '127.0.0.1'], { env: { ...process.env, TURSO_DATABASE_URL: url, TURSO_AUTH_TOKEN: '', IO_VERIFY_SETUP_SECRET: secret, VERCEL_ENV: 'development', NEXT_TELEMETRY_DISABLED: '1' }, stdio: ['ignore', 'pipe', 'pipe'] });
const originalFetch = globalThis.fetch;
globalThis.fetch = (url, options={}) => originalFetch(url, { ...options, signal: AbortSignal.timeout(15000) });
let logs = ''; child.stdout.on('data', x => {logs += x; process.stdout.write(x)}); child.stderr.on('data', x => {logs += x; process.stderr.write(x)});
let checks = 0;
const ok = (condition, label) => { assert.ok(condition, label); console.log('PASS', label); checks++; };
async function post(path, body, cookie = '', origin = base) {
  return fetch(base + path, { method: 'POST', headers: { 'Content-Type': 'application/json', origin, cookie }, body: JSON.stringify(body) });
}
async function login(email, pass = password) {
  const r = await post('/api/auth/login', { email, password: pass });
  return { response: r, cookie: (r.headers.get('set-cookie') || '').split(';')[0] };
}
try {
  let ready = false;
  for (let i=0;i<30;i++) {
    try { const r = await fetch(base + '/admin'); if (r.ok) { ready=true; break; } } catch(e) { console.log(e.message); }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  assert.ok(ready, 'Servidor disponible');
  for (const path of ['/admin/dashboard','/admin/importar','/admin/operadores']) {
    const r = await fetch(base + path, { redirect: 'manual' });
    ok(r.status === 307 && r.headers.get('location') === '/admin', `Visitante bloqueado: ${path}`);
  }
  ok((await post('/api/import', {})).status === 401, 'API de importación bloqueada sin sesión');
  ok((await post('/api/admin/setup', { secret: 'wrong', email:'admin@example.test', password })).status === 403, 'Alta inicial rechaza código incorrecto');
  ok((await post('/api/admin/setup', { secret, email:'admin@example.test', password })).status === 200, 'Alta inicial correcta');
  ok((await post('/api/admin/setup', { secret, email:'other@example.test', password })).status === 409, 'No permite un segundo administrador inicial');
  ok((await login('admin@example.test','incorrect-password')).response.status === 401, 'Rechaza contraseña incorrecta');
  const admin = await login('admin@example.test');
  ok(admin.response.ok && /HttpOnly/i.test(admin.response.headers.get('set-cookie')) && /SameSite=lax/i.test(admin.response.headers.get('set-cookie')), 'Login y cookie HttpOnly/SameSite');
  ok((await post('/api/admin/operadores', {action:'create',email:'jorgev@iogroupchile.com',password},admin.cookie)).ok,'Administrador crea operador de prueba');
  ok((await post('/api/admin/operadores', {action:'create',email:'JORGEV@IOGROUPCHILE.COM',password},admin.cookie)).status===409,'Correos duplicados bloqueados');
  const op = await login('JORGEV@IOGROUPCHILE.COM');
  ok(op.response.ok, 'Operador ingresa con correo sin distinguir mayúsculas');
  const page = await fetch(base+'/admin/dashboard',{headers:{cookie:op.cookie}});
  ok(page.ok && !(await page.text()).includes('Administrar operadores'),'Panel de operador sin administración de usuarios');
  ok((await fetch(base+'/admin/operadores',{headers:{cookie:op.cookie},redirect:'manual'})).status===307,'Página de usuarios bloqueada al operador');
  ok((await post('/api/admin/operadores',{action:'create',email:'evil@example.test',password,role:'admin'},op.cookie)).status===403,'Operador no puede gestionar usuarios por API');
  ok((await post('/api/admin/operadores',{action:'create',email:'evil@example.test',password},admin.cookie,'https://foreign.example')).status===403,'Rechaza solicitudes de otro origen');
  const book=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book,XLSX.utils.json_to_sheet([
    {codigo:'AUTH-TEST-1',nombres:'Prueba',apellidos:'Numérica',curso:'Prueba',nota:6.5,horas:20,fecha:'15-10-2026'},
    {codigo:'AUTH-TEST-2',nombres:'Prueba',apellidos:'Texto',curso:'Prueba',nota:'Aprobado',horas:20,fecha:'15-10-2026'}
  ]),'Certificados'); const bytes=XLSX.write(book,{type:'buffer',bookType:'xlsx'});
  async function upload(cookie) {const data=new FormData();data.append('file',new Blob([bytes]),'test.xlsx');return fetch(base+'/api/import',{method:'POST',headers:{origin:base,cookie},body:data});}
  const imported=await (await upload(op.cookie)).json();ok(imported.importados===2,'Operador importa dos certificados');
  const duplicate=await (await upload(op.cookie)).json();ok(duplicate.importados===0&&duplicate.duplicados===2,'Mantiene control de duplicados');
  for(const [codigo,nota] of [['AUTH-TEST-1','6.5'],['AUTH-TEST-2','Aprobado']]) {
    const r=await (await post('/api/verify',{codigo})).json();ok(r.valido&&r.certificado.nota===nota,`Consulta pública preserva nota ${nota}`);
  }
  const id=String((await db.execute("SELECT id FROM io_users WHERE role='operator'")).rows[0].id);
  await post('/api/admin/operadores',{action:'active',id,active:false},admin.cookie);
  ok((await upload(op.cookie)).status===401,'Desactivar revoca sesión abierta');
  ok((await login('jorgev@iogroupchile.com')).response.status===401,'Operador desactivado no puede ingresar');
  await post('/api/admin/operadores',{action:'active',id,active:true},admin.cookie);
  ok((await upload(op.cookie)).status===401,'Reactivar no revive sesión anterior');
  const restored=await login('jorgev@iogroupchile.com');ok(restored.response.ok,'Operador reactivado puede ingresar');
  await post('/api/admin/operadores',{action:'password',id,password:newPassword},admin.cookie);
  ok((await upload(restored.cookie)).status===401,'Cambiar contraseña revoca sesión abierta');
  ok((await login('jorgev@iogroupchile.com')).response.status===401,'Contraseña anterior invalidada');
  const reset=await login('jorgev@iogroupchile.com',newPassword);ok(reset.response.ok,'Nueva contraseña funciona');
  await post('/api/auth/logout',{},reset.cookie);
  ok((await upload(reset.cookie)).status===401,'Cerrar sesión invalida cookie anterior');
  const exp=await login('jorgev@iogroupchile.com',newPassword);
  const token=exp.cookie.split('=')[1];await db.execute({sql:'UPDATE io_sessions SET expires_at=0 WHERE token_hash=?',args:[createHash('sha256').update(token).digest('hex')]});
  ok((await upload(exp.cookie)).status===401,'Sesión vencida rechazada');
  for(let i=0;i<10;i++) await login('missing@example.test');
  ok((await login('missing@example.test')).response.status===429,'Límite de intentos compartido en base de datos');
  const hashes=await db.execute('SELECT password_hash FROM io_users');ok(hashes.rows.every(x=>String(x.password_hash).startsWith('scrypt$')&&!String(x.password_hash).includes(password)),'Contraseñas almacenadas como hashes');
  console.log(`Verificación completada: ${checks} comprobaciones.`);
} catch(error) {console.error(error.message);console.error(logs.slice(-5000));process.exitCode=1;} finally {child.kill('SIGTERM');await new Promise(resolve=>{ if(child.exitCode !== null) resolve(); else child.once('exit',resolve); });db.close();await rm(temp,{recursive:true,force:true});}
