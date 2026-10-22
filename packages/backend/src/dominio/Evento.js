export default class Evento {
  constructor(
    nombre,
    descripcion,
    categoria,
    fecha,
    tiposEntrada = [],
    multimedia = [],
    organizador,
  ) {
    this.nombre = nombre
    this.descripcion = descripcion
    this.categoria = categoria
    this.fecha = new Date(fecha)
    this.tiposEntrada = tiposEntrada
    this.multimedia = multimedia
    this.organizador = organizador
  }

  precioMinimo() {
    if (!this.tiposEntrada.length) {
      return 0
    }
    return Math.min(...this.tiposEntrada.map((tipo) => tipo.precio))
  }

  tuPrecioEstaEntre(precio1, precio2) {
    const minimo = Math.min(Number(precio1), Number(precio2))
    const maximo = Math.max(Number(precio1), Number(precio2))
    return this.tiposEntrada.some((tipo) => tipo.precio >= minimo && tipo.precio <= maximo)
  }

  coincideConBusqueda(texto) {
    if (!texto) {
      return true
    }
    const normalizado = String(texto).trim().toLowerCase()
    return (
      this.nombre.toLowerCase().includes(normalizado) ||
      this.descripcion.toLowerCase().includes(normalizado)
    )
  }

  perteneceACategoria(categoriaId) {
    if (!categoriaId) {
      return true
    }
    return String(this.categoria?.id) === String(categoriaId)
  }

  yaSeRealizo() {
    return this.fecha.getTime() < Date.now()
  }

  diasHastaRealizacion() {
    const milisegundos = this.fecha.getTime() - Date.now()
    return Math.ceil(milisegundos / (1000 * 60 * 60 * 24))
  }

  obtenerTipoEntrada(tipoEntradaId) {
    return this.tiposEntrada.find((tipo) => String(tipo.id) === String(tipoEntradaId))
  }

  esOrganizadoPor(usuarioId) {
    return String(this.organizador?.id) === String(usuarioId)
  }
}
