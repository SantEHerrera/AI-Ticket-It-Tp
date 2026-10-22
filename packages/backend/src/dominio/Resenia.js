import ErrorDeNegocio from "./errores/ErrorDeNegocio.js"

export default class Resenia {
  constructor(comprador, evento, detalle, puntuacion) {
    const puntaje = Number(puntuacion)
    if (!Number.isInteger(puntaje) || puntaje < 1 || puntaje > 5) {
      throw new ErrorDeNegocio("La puntuación debe ser un entero entre 1 y 5")
    }
    if (!detalle || !String(detalle).trim()) {
      throw new ErrorDeNegocio("El comentario de la reseña es obligatorio")
    }
    this.comprador = comprador
    this.evento = evento
    this.detalle = String(detalle).trim()
    this.puntuacion = puntaje
    this.fecha = new Date()
  }
}
