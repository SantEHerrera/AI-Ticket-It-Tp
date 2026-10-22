import Compra from "../dominio/Compra.js"
import Resenia from "../dominio/Resenia.js"
import { EstadoCompra } from "../dominio/enums/EstadoCompra.js"
import ErrorDeNegocio from "../dominio/errores/ErrorDeNegocio.js"
import {
  reputacionOrganizador,
  serializarCategoria,
  serializarCompra,
  serializarEvento,
  serializarUsuario,
} from "./serializacion.js"

const ORDENES_VALIDOS = new Set(["precio", "fecha", "puntaje"])

export default class CompradorService {
  constructor(repos) {
    this.usuarios = repos.usuarios
    this.eventos = repos.eventos
    this.compras = repos.compras
    this.resenias = repos.resenias
    this.categorias = repos.categorias
  }

  listarCategorias() {
    return this.categorias.obtenerTodos().map(serializarCategoria)
  }

  listarUsuarios() {
    return this.usuarios.obtenerTodos().map(serializarUsuario)
  }

  buscarEventos({ texto, categoriaId, orden } = {}) {
    let eventos = this.eventos.obtenerTodos().filter((evento) => {
      return evento.coincideConBusqueda(texto) && evento.perteneceACategoria(categoriaId)
    })

    const criterio = ORDENES_VALIDOS.has(orden) ? orden : "fecha"
    const resenias = this.resenias.obtenerTodos()

    eventos = [...eventos].sort((a, b) => {
      if (criterio === "precio") {
        return a.precioMinimo() - b.precioMinimo()
      }
      if (criterio === "puntaje") {
        const puntajeA = reputacionOrganizador(a.organizador, resenias).puntajePromedio
        const puntajeB = reputacionOrganizador(b.organizador, resenias).puntajePromedio
        return puntajeB - puntajeA
      }
      return a.fecha.getTime() - b.fecha.getTime()
    })

    return eventos.map((evento) => serializarEvento(evento, resenias))
  }

  obtenerEvento(eventoId) {
    const evento = this.#evento(eventoId)
    return serializarEvento(evento, this.resenias.obtenerTodos())
  }

  listarCompras(usuarioId) {
    const usuario = this.#comprador(usuarioId)
    return this.compras
      .buscar((compra) => compra.esDeComprador(usuario.id))
      .map((compra) => serializarCompra(compra, { paraComprador: true }))
  }

  obtenerCompra(usuarioId, compraId) {
    const compra = this.#compraDelComprador(usuarioId, compraId)
    return serializarCompra(compra, { paraComprador: true })
  }

  crearCompra(usuarioId, { eventoId, tipoEntradaId, cantidad }) {
    const usuario = this.#comprador(usuarioId)
    const evento = this.#evento(eventoId)
    if (evento.yaSeRealizo()) {
      throw new ErrorDeNegocio("No se pueden comprar entradas de un evento que ya se realizó")
    }
    const pedida = Number(cantidad)
    if (!Number.isInteger(pedida) || pedida < 1) {
      throw new ErrorDeNegocio("La cantidad debe ser un entero mayor a 0")
    }
    const tipo = evento.obtenerTipoEntrada(tipoEntradaId)
    if (!tipo) {
      throw new ErrorDeNegocio("El tipo de entrada no pertenece a este evento", 404)
    }
    tipo.reservar(pedida)
    const compra = new Compra(usuario, evento, tipo, pedida, tipo.precio * pedida, EstadoCompra.PENDIENTE)
    this.compras.guardar(compra)
    compra.registrarCambioEstado(EstadoCompra.PENDIENTE, usuario)
    return serializarCompra(compra, { paraComprador: true })
  }

  pagarCompra(usuarioId, compraId) {
    const compra = this.#compraDelComprador(usuarioId, compraId)
    compra.confirmarPago(compra.usuario)
    return serializarCompra(compra, { paraComprador: true })
  }

  cancelarCompra(usuarioId, compraId) {
    const compra = this.#compraDelComprador(usuarioId, compraId)
    compra.cancelar(compra.usuario)
    return serializarCompra(compra, { paraComprador: true })
  }

  enviarMensaje(usuarioId, compraId, texto) {
    const compra = this.#compraDelComprador(usuarioId, compraId)
    compra.agregarMensaje(compra.usuario, texto)
    return serializarCompra(compra, { paraComprador: true })
  }

  crearResenia(usuarioId, compraId, { puntuacion, detalle }) {
    const compra = this.#compraDelComprador(usuarioId, compraId)
    if (!compra.puedeReseniarse()) {
      throw new ErrorDeNegocio("Solo se puede reseñar una compra utilizada que aún no tenga reseña")
    }
    const resenia = new Resenia(compra.usuario, compra.evento, detalle, puntuacion)
    this.resenias.guardar(resenia)
    compra.resenia = resenia
    return serializarCompra(compra, { paraComprador: true })
  }

  listarFavoritos(usuarioId) {
    const usuario = this.#comprador(usuarioId)
    const resenias = this.resenias.obtenerTodos()
    return usuario.favoritos
      .map((eventoId) => this.eventos.obtenerPorId(eventoId))
      .filter(Boolean)
      .map((evento) => serializarEvento(evento, resenias))
  }

  agregarFavorito(usuarioId, eventoId) {
    const usuario = this.#comprador(usuarioId)
    this.#evento(eventoId)
    usuario.agregarFavorito(eventoId)
    return this.listarFavoritos(usuarioId)
  }

  quitarFavorito(usuarioId, eventoId) {
    const usuario = this.#comprador(usuarioId)
    usuario.quitarFavorito(eventoId)
    return this.listarFavoritos(usuarioId)
  }

  #usuario(usuarioId) {
    const usuario = this.usuarios.obtenerPorId(usuarioId)
    if (!usuario) {
      throw new ErrorDeNegocio("Usuario no encontrado", 404)
    }
    return usuario
  }

  #comprador(usuarioId) {
    const usuario = this.#usuario(usuarioId)
    if (!usuario.esComprador()) {
      throw new ErrorDeNegocio("La operación requiere un usuario comprador", 403)
    }
    return usuario
  }

  #evento(eventoId) {
    const evento = this.eventos.obtenerPorId(eventoId)
    if (!evento) {
      throw new ErrorDeNegocio("Evento no encontrado", 404)
    }
    return evento
  }

  #compraDelComprador(usuarioId, compraId) {
    const usuario = this.#comprador(usuarioId)
    const compra = this.compras.obtenerPorId(compraId)
    if (!compra) {
      throw new ErrorDeNegocio("Compra no encontrada", 404)
    }
    if (!compra.esDeComprador(usuario.id)) {
      throw new ErrorDeNegocio("La compra no pertenece al comprador", 403)
    }
    return compra
  }
}
