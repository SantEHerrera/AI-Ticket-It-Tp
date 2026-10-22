import ErrorDeNegocio from "./errores/ErrorDeNegocio.js"

export default class TipoEntrada {
  constructor(nombre, descripcion, precio, cupo) {
    this.nombre = nombre
    this.descripcion = descripcion
    this.precio = Number(precio)
    this.cupo = Number(cupo)
    this.cupoDisponible = Number(cupo)
  }

  hayCupoPara(cantidad) {
    return Number(cantidad) > 0 && this.cupoDisponible >= Number(cantidad)
  }

  reservar(cantidad) {
    const pedida = Number(cantidad)
    if (!this.hayCupoPara(pedida)) {
      throw new ErrorDeNegocio(
        `No hay cupo suficiente para "${this.nombre}". Disponibles: ${this.cupoDisponible}`,
      )
    }
    this.cupoDisponible -= pedida
  }

  liberar(cantidad) {
    this.cupoDisponible = Math.min(this.cupo, this.cupoDisponible + Number(cantidad))
  }
}
