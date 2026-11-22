// Middleware de seguridad integral: Headers, Rate Limiting y Sanitización

const rateLimitMap = new Map()

// Limpieza periódica de IPs antiguas para evitar fugas de memoria
setInterval(() => {
  const ahora = Date.now()
  for (const [ip, datos] of rateLimitMap.entries()) {
    if (ahora - datos.inicioVentana > 60000) {
      rateLimitMap.delete(ip)
    }
  }
}, 60000)

export function rateLimiter(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress || "desconocido"
  const ahora = Date.now()
  const VENTANA_MS = 60000 // 1 minuto
  const MAX_PETICIONES = 180 // máximo 180 requests/minuto por IP

  let registro = rateLimitMap.get(ip)
  if (!registro || ahora - registro.inicioVentana > VENTANA_MS) {
    registro = { inicioVentana: ahora, cuenta: 1 }
    rateLimitMap.set(ip, registro)
  } else {
    registro.cuenta += 1
  }

  if (registro.cuenta > MAX_PETICIONES) {
    return res.status(429).json({
      error: "Demasiadas solicitudes desde esta dirección IP. Intente de nuevo en un minuto.",
    })
  }

  return next()
}

export function securityHeaders(req, res, next) {
  // Prevenir MIME type sniffing
  res.setHeader("X-Content-Type-Options", "nosniff")
  // Protección contra Clickjacking
  res.setHeader("X-Frame-Options", "DENY")
  // Protección básica contra XSS reflejado en navegadores heredados
  res.setHeader("X-XSS-Protection", "1; mode=block")
  // Referrer Policy estricto
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  // HSTS (HTTP Strict Transport Security)
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  // Ocultar tecnología del backend
  res.removeHeader("X-Powered-By")
  return next()
}

// Bloqueo de Prototype Pollution en query y body
export function sanitizeRequest(req, res, next) {
  const checkObjeto = (obj) => {
    if (!obj || typeof obj !== "object") return false
    for (const clave of Object.keys(obj)) {
      if (clave === "__proto__" || clave === "constructor" || clave === "prototype") {
        return true
      }
      if (typeof obj[clave] === "object" && checkObjeto(obj[clave])) {
        return true
      }
    }
    return false
  }

  if (checkObjeto(req.body) || checkObjeto(req.query) || checkObjeto(req.params)) {
    return res.status(400).json({ error: "Solicitud inválida: parámetros no permitidos" })
  }

  return next()
}
