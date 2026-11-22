import jwt from "jsonwebtoken"
import { JWT_SECRET } from "../servicios/AuthService.js"
import { validarIdSeguro } from "../validations/sanitizador.js"

export function manejarError(res, error) {
  const status = error.status || 500
  if (status >= 500) {
    console.error("[Error del Servidor]", error)
    // No filtrar detalles internos ni stack traces en respuestas 500
    return res.status(status).json({
      error: "Ocurrió un error interno en el servidor. Por favor intente más tarde.",
    })
  }
  return res.status(status).json({ error: error.message || "Solicitud incorrecta" })
}

export function idUsuarioDesde(req) {
  // 1. Extraer y verificar JWT desde el header Authorization: Bearer <token>
  const authHeader = req.header("authorization")
  if (authHeader && authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim()
    try {
      const decodificado = jwt.verify(token, JWT_SECRET)
      if (decodificado && decodificado.id) {
        req.usuario = decodificado
        return String(decodificado.id)
      }
    } catch (err) {
      const error = new Error("Token de autenticación inválido o expirado. Por favor inicie sesión nuevamente.")
      error.status = 401
      throw error
    }
  }

  // 2. Soporte para header x-user-id como fallback verificado
  const idHeader = req.header("x-user-id")
  if (idHeader) {
    return validarIdSeguro(String(idHeader), "x-user-id")
  }

  const error = new Error("Se requiere autenticación: inicie sesión para obtener un token JWT")
  error.status = 401
  throw error
}
