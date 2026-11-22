export default class Usuario {
  constructor(nombre, apellido, email = "", password = "password123", favoritos = [], rol = "COMPRADOR") {
    this.nombre = nombre
    this.apellido = apellido
    this.email = String(email || `${nombre.toLowerCase()}@aiticket.com`).trim().toLowerCase()
    this.password = password
    this.favoritos = Array.isArray(favoritos) ? favoritos : []
    this.rol = rol
  }

  nombreCompleto() {
    return `${this.nombre} ${this.apellido}`
  }

  esOrganizador() {
    return this.rol === "ORGANIZADOR"
  }

  esComprador() {
    return this.rol === "COMPRADOR"
  }

  validarPassword(passwordIngresada) {
    if (!this.password || !passwordIngresada) return false
    return String(this.password) === String(passwordIngresada)
  }

  tieneFavorito(eventoId) {
    return this.favoritos.some((id) => String(id) === String(eventoId))
  }

  agregarFavorito(eventoId) {
    if (!this.tieneFavorito(eventoId)) {
      this.favoritos.push(String(eventoId))
    }
  }

  quitarFavorito(eventoId) {
    this.favoritos = this.favoritos.filter((id) => String(id) !== String(eventoId))
  }
}
