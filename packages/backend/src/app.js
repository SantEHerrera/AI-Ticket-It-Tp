import cors from "cors"
import express from "express"
import { rateLimiter, securityHeaders, sanitizeRequest } from "./middlewares/seguridad.js"
import crearRoutes from "./rutas/routes.js"

export function crearApp(dependencias) {
  const app = express()

  // 1. Headers de seguridad (OWASP)
  app.use(securityHeaders)

  // 2. Limitador de tasa (Anti-DoS / Brute-force)
  app.use(rateLimiter)

  // 3. Parser con límite razonable y reviver anti Prototype Pollution
  app.use(
    express.json({
      limit: "15mb",
      reviver: (key, value) => {
        if (key === "__proto__" || key === "constructor" || key === "prototype") {
          const err = new Error("Intento de Prototype Pollution bloqueado")
          err.status = 400
          throw err
        }
        return value
      },
    }),
  )
  app.use(express.urlencoded({ extended: true, limit: "15mb" }))
  app.use(sanitizeRequest)

  // 4. CORS configurado
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((origen) => origen.trim())
        : true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "x-user-id", "Authorization"],
    }),
  )

  // 5. Rutas de la API
  app.use("/api", crearRoutes(dependencias))

  // 6. Manejador de rutas no encontradas
  app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" })
  })

  // 7. Manejador global de errores (por ejemplo, errores arrojados en el reviver de JSON)
  app.use((err, req, res, _next) => {
    const status = err.status || 400
    return res.status(status).json({ error: err.message || "Error procesando solicitud" })
  })

  return app
}
