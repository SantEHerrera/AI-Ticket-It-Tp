export default class Usuario {
  constructor(nombre, apellido, favoritos = [], rol = "COMPRADOR") {
    this.nombre = nombre
    this.apellido = apellido
    this.favoritos = favoritos
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
