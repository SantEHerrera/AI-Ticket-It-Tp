export function manejarError(res, error) {
  const status = error.status || 500
  if (status >= 500) {
    console.error(error)
  }
  return res.status(status).json({ error: error.message || "Error interno" })
}

export function idUsuarioDesde(req) {
  const id = req.header("x-user-id") || req.query.userId || req.body?.usuarioId
  if (!id) {
    const error = new Error("Se requiere el identificador de usuario (header x-user-id)")
    error.status = 401
    throw error
  }
  return String(id)
}
