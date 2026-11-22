import Compra from "../dominio/Compra.js"
import Resenia from "../dominio/Resenia.js"
import { EstadoCompra } from "../dominio/enums/EstadoCompra.js"
import ErrorDeNegocio from "../dominio/errores/ErrorDeNegocio.js"
import {
  sanitizarTexto,
  validarEnteroSeguro,
  validarIdSeguro,
} from "../validations/sanitizador.js"
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

  buscarEventos({ texto, categoriaId, orden, temporal, pagina, limite } = {}) {
    const textoSanitizado = texto ? sanitizarTexto(texto, 100, "texto de búsqueda") : ""
    const catIdSanitizado = categoriaId ? validarIdSeguro(categoriaId, "categoriaId") : null

    let eventos = this.eventos.obtenerTodos().filter((evento) => {
      return (
        evento.coincideConBusqueda(textoSanitizado) &&
        evento.perteneceACategoria(catIdSanitizado)
      )
    })

    const proximosCount = eventos.filter((e) => !e.yaSeRealizo()).length
    const finalizadosCount = eventos.filter((e) => e.yaSeRealizo()).length

    if (temporal) {
      const t = String(temporal).toUpperCase().trim()
      if (t === "PROXIMOS") {
        eventos = eventos.filter((e) => !e.yaSeRealizo())
      } else if (t === "FINALIZADOS") {
        eventos = eventos.filter((e) => e.yaSeRealizo())
      }
    }

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

    if (pagina !== undefined || limite !== undefined) {
      // Limitar estrictamente los valores para evitar desbordes de memoria y CPU
      const numLimite = Math.min(50, Math.max(1, parseInt(limite, 10) || 5))
      const numPagina = Math.min(10000, Math.max(1, parseInt(pagina, 10) || 1))
      const total = eventos.length
      const totalPaginas = Math.ceil(total / numLimite) || 1
      const inicio = (numPagina - 1) * numLimite
      const paginados = eventos.slice(inicio, inicio + numLimite)

      return {
        eventos: paginados.map((evento) => serializarEvento(evento, resenias)),
        total,
        pagina: numPagina,
        limite: numLimite,
        totalPaginas,
        proximosCount,
        finalizadosCount,
      }
    }

    return eventos.map((evento) => serializarEvento(evento, resenias))
  }

  obtenerEvento(eventoId) {
    const idValido = validarIdSeguro(eventoId, "eventoId")
    const evento = this.#evento(idValido)
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
    const eId = validarIdSeguro(eventoId, "eventoId")
    const tId = validarIdSeguro(tipoEntradaId, "tipoEntradaId")

    // Validación estricta anti acaparamiento y desborde numérico (máximo 10 entradas por compra)
    const pedida = validarEnteroSeguro(cantidad, 1, 10, "cantidad de entradas")

    const evento = this.#evento(eId)
    if (evento.yaSeRealizo()) {
      throw new ErrorDeNegocio("No se pueden comprar entradas de un evento que ya se realizó")
    }

    const tipo = evento.obtenerTipoEntrada(tId)
    if (!tipo) {
      throw new ErrorDeNegocio("El tipo de entrada no pertenece a este evento", 404)
    }

    // Reservar entradas (valida cupo disponible internamente)
    tipo.reservar(pedida)

    const compra = new Compra(
      usuario,
      evento,
      tipo,
      pedida,
      tipo.precio * pedida,
      EstadoCompra.PENDIENTE,
    )
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
    const textoSanitizado = sanitizarTexto(texto, 1000, "mensaje")
    if (!textoSanitizado) {
      throw new ErrorDeNegocio("El mensaje no puede estar vacío")
    }
    compra.agregarMensaje(compra.usuario, textoSanitizado)
    return serializarCompra(compra, { paraComprador: true })
  }

  crearResenia(usuarioId, compraId, { puntuacion, detalle }) {
    const compra = this.#compraDelComprador(usuarioId, compraId)
    if (!compra.puedeReseniarse()) {
      throw new ErrorDeNegocio("Solo se puede reseñar una compra utilizada que aún no tenga reseña")
    }

    const puntajeSeguro = validarEnteroSeguro(puntuacion, 1, 5, "puntuación")
    const detalleSanitizado = sanitizarTexto(detalle, 1000, "comentario de la reseña")
    if (!detalleSanitizado) {
      throw new ErrorDeNegocio("El comentario de la reseña no puede estar vacío")
    }

    const resenia = new Resenia(compra.usuario, compra.evento, detalleSanitizado, puntajeSeguro)
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
    const eId = validarIdSeguro(eventoId, "eventoId")
    this.#evento(eId)
    usuario.agregarFavorito(eId)
    return this.listarFavoritos(usuarioId)
  }

  quitarFavorito(usuarioId, eventoId) {
    const usuario = this.#comprador(usuarioId)
    const eId = validarIdSeguro(eventoId, "eventoId")
    usuario.quitarFavorito(eId)
    return this.listarFavoritos(usuarioId)
  }

  #usuario(usuarioId) {
    const idValido = validarIdSeguro(usuarioId, "usuarioId")
    const usuario = this.usuarios.obtenerPorId(idValido)
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
    const idValido = validarIdSeguro(eventoId, "eventoId")
    const evento = this.eventos.obtenerPorId(idValido)
    if (!evento) {
      throw new ErrorDeNegocio("Evento no encontrado", 404)
    }
    return evento
  }

  #compraDelComprador(usuarioId, compraId) {
    const usuario = this.#comprador(usuarioId)
    const cId = validarIdSeguro(compraId, "compraId")
    const compra = this.compras.obtenerPorId(cId)
    if (!compra) {
      throw new ErrorDeNegocio("Compra no encontrada", 404)
    }
    if (!compra.esDeComprador(usuario.id)) {
      throw new ErrorDeNegocio("La compra no pertenece al comprador", 403)
    }
    return compra
  }
}
