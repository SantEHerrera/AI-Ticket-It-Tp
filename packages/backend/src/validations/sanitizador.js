import ErrorDeNegocio from "../dominio/errores/ErrorDeNegocio.js"

export function sanitizarTexto(texto, maxLongitud = 1000, campo = "campo") {
  if (texto === undefined || texto === null) {
    return ""
  }
  if (typeof texto !== "string") {
    throw new ErrorDeNegocio(`El valor de ${campo} debe ser texto`, 400)
  }
  let limpio = texto.trim()
  // Eliminar etiquetas de script o html potencialmente peligrosas
  limpio = limpio.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
  limpio = limpio.replace(/<\/?(?:iframe|object|embed|applet|form|input|button)[^>]*>/gi, "")
  // Truncar si excede la longitud máxima
  if (limpio.length > maxLongitud) {
    throw new ErrorDeNegocio(`El campo ${campo} excede la longitud máxima permitida (${maxLongitud} caracteres)`, 400)
  }
  return limpio
}

export function validarIdSeguro(id, campo = "ID") {
  if (!id || typeof id !== "string") {
    throw new ErrorDeNegocio(`${campo} inválido o no proporcionado`, 400)
  }
  const idLimpio = String(id).trim()
  // IDs válidos: alfanuméricos, guiones y guiones bajos, entre 1 y 64 caracteres
  if (!/^[a-zA-Z0-9_\-:.]{1,64}$/.test(idLimpio)) {
    throw new ErrorDeNegocio(`${campo} contiene caracteres no permitidos`, 400)
  }
  return idLimpio
}

export function validarEnteroSeguro(valor, min = 1, max = 1000000, campo = "Número") {
  const num = Number(valor)
  if (!Number.isInteger(num) || num < min || num > max) {
    throw new ErrorDeNegocio(`${campo} debe ser un número entero entre ${min} y ${max}`, 400)
  }
  return num
}

export function validarUrlOMultimedia(url) {
  if (!url || typeof url !== "string") return false
  const limpio = url.trim()
  // Denegar esquemas peligrosos
  if (/^(?:javascript|vbscript|data:text\/html|file):/i.test(limpio)) {
    return false
  }
  // Permitir HTTP, HTTPS o Data URI de imágenes válidas
  if (/^https?:\/\//i.test(limpio)) {
    return true
  }
  if (/^data:image\/(?:jpeg|png|webp|gif|svg\+xml);base64,/i.test(limpio)) {
    return true
  }
  return false
}
