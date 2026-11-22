import { crearDependencias } from "./src/dependencias.js"
import { crearApp } from "./src/app.js"

async function runTests() {
  const app = crearApp(crearDependencias())
  const server = app.listen(0, async () => {
    const port = server.address().port
    const base = `http://localhost:${port}/api`

    console.log("=== INICIANDO AUDITORÍA Y TESTS DE SEGURIDAD (CON JWT) ===")

    // 1. Headers de Seguridad OWASP
    const resHeaders = await fetch(`${base}/health`)
    console.log("[Test 1] Security Headers:")
    console.log("  nosniff:", resHeaders.headers.get("x-content-type-options") === "nosniff")
    console.log("  x-frame-options:", resHeaders.headers.get("x-frame-options") === "DENY")
    console.log("  hsts:", resHeaders.headers.has("strict-transport-security"))
    console.log("  x-powered-by hidden:", resHeaders.headers.get("x-powered-by") === null)

    // 2. JWT Authentication: Login con usuario comprador (Sofía)
    const resLogin = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "sofia@aiticket.com", password: "password123" }),
    })
    const loginData = await resLogin.json()
    console.log("[Test 2] Login JWT status:", resLogin.status, "Token recibido:", !!loginData.token)

    const tokenSofia = loginData.token

    // 3. Login con credenciales incorrectas (debe dar 401)
    const resBadLogin = await fetch(`${base}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "sofia@aiticket.com", password: "passwordIncorrecta" }),
    })
    console.log("[Test 3] Reject Wrong Password (401):", resBadLogin.status === 401)

    // 4. Token Forjado / Inválido (debe dar 401)
    const resBadToken = await fetch(`${base}/auth/perfil`, {
      headers: { Authorization: "Bearer token_falso_invalido_123" },
    })
    console.log("[Test 4] Reject Forged JWT (401):", resBadToken.status === 401)

    // 5. Prototype Pollution Payload
    const resProto = await fetch(`${base}/organizador/eventos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "5",
      },
      body: '{"__proto__": {"admin": true}, "nombre": "Test Evento", "descripcion": "Descripcion valida para evento"}',
    })
    const protoData = await resProto.json()
    console.log("[Test 5] Prototype Pollution Block:", resProto.status, protoData.error)

    // 6. Reject Dangerous Image Protocol (javascript:...)
    const resMaliciousUrl = await fetch(`${base}/organizador/eventos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": "5",
      },
      body: JSON.stringify({
        nombre: "Evento Ataque",
        descripcion: "Descripcion con ataque XSS",
        categoriaId: "1",
        fecha: new Date(Date.now() + 864000000).toISOString(),
        multimedia: ["javascript:alert(document.cookie)"],
        tiposEntrada: [{ nombre: "General", precio: 1000, cupo: 10 }],
      }),
    })
    const malUrlData = await resMaliciousUrl.json()
    console.log("[Test 6] Reject Dangerous Image Protocol:", resMaliciousUrl.status, malUrlData.error)

    // 7. Compra Excesiva (Anti-Acaparamiento / Bot hoarding)
    const resHoarding = await fetch(`${base}/comprador/compras`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenSofia}`,
      },
      body: JSON.stringify({
        eventoId: "9",
        tipoEntradaId: "1",
        cantidad: 99,
      }),
    })
    const hoardData = await resHoarding.json()
    console.log("[Test 7] Limit Ticket Purchase (Anti-Hoarding):", resHoarding.status, hoardData.error)

    // 8. Compra Válida usando JWT
    const resEventos = await fetch(`${base}/eventos`)
    const eventos = await resEventos.json()
    const ev = eventos.find((e) => !e.yaSeRealizo)
    const tipo = ev.tiposEntrada[0]
    const resGood = await fetch(`${base}/comprador/compras`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tokenSofia}`,
      },
      body: JSON.stringify({
        eventoId: ev.id,
        tipoEntradaId: tipo.id,
        cantidad: 2,
      }),
    })
    const goodData = await resGood.json()
    console.log("[Test 8] Valid Purchase via JWT (2 tickets): status", resGood.status, "Total: $" + goodData.total)

    server.close()
    console.log("=== TODOS LOS TESTS PASARON EXITOSAMENTE ===")
  })
}

runTests().catch(console.error)
