export default class RepositorioMemoria {
  static #secuencia = 1

  static nuevoId() {
    const id = String(RepositorioMemoria.#secuencia)
    RepositorioMemoria.#secuencia += 1
    return id
  }

  constructor() {
    this.items = new Map()
  }

  guardar(entidad) {
    if (!entidad.id) {
      entidad.id = RepositorioMemoria.nuevoId()
    }
    this.items.set(String(entidad.id), entidad)
    return entidad
  }

  obtenerPorId(id) {
    return this.items.get(String(id)) ?? null
  }

  obtenerTodos() {
    return [...this.items.values()]
  }

  buscar(predicado) {
    return this.obtenerTodos().filter(predicado)
  }
}
