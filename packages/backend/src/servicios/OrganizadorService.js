import Evento from "../dominio/Evento.js"
import TipoEntrada from "../dominio/TipoEntrada.js"
import ErrorDeNegocio from "../dominio/errores/ErrorDeNegocio.js"
import RepositorioMemoria from "../repositorios/RepositorioMemoria.js"
import {
  sanitizarTexto,
  validarEnteroSeguro,
  validarIdSeguro,
  validarUrlOMultimedia,
} from "../validations/sanitizador.js"
import { serializarCompra, serializarEvento, serializarTipoEntrada } from "./serializacion.js"

export default class OrganizadorService {
  constructor(repos) {
    this.usuarios = repos.usuarios
    this.eventos = repos.eventos
    this.compras = repos.compras
    this.resenias = repos.resenias
    this.categorias = repos.categorias
  }

  listarEventos(usuarioId) {
    const organizador = this.#organizador(usuarioId)
    const resenias = this.resenias.obtenerTodos()
    return this.eventos
      .buscar((evento) => evento.esOrganizadoPor(organizador.id))
      .map((evento) => serializarEvento(evento, resenias))
  }

  crearEvento(usuarioId, datos) {
    const organizador = this.#organizador(usuarioId)
    const { nombre, descripcion, categoriaId, fecha, tiposEntrada = [], multimedia = [] } = datos

    const nombreLimpio = sanitizarTexto(nombre, 120, "nombre del evento")
    if (nombreLimpio.length < 3) {
      throw new ErrorDeNegocio("El nombre del evento debe tener al menos 3 caracteres")
    }

    const descLimpia = sanitizarTexto(descripcion, 10000, "descripción del evento")
    if (descLimpia.length < 10) {
      throw new ErrorDeNegocio("La descripción del evento debe tener al menos 10 caracteres")
    }

    if (!fecha) {
      throw new ErrorDeNegocio("La fecha del evento es obligatoria")
    }

    const catIdSeguro = validarIdSeguro(categoriaId, "categoría")
    const categoria = this.categorias.obtenerPorId(catIdSeguro)
    if (!categoria) {
      throw new ErrorDeNegocio("Categoría no encontrada", 404)
    }

    const fechaEvento = new Date(fecha)
    if (Number.isNaN(fechaEvento.getTime())) {
      throw new ErrorDeNegocio("La fecha del evento no es válida")
    }
    const ahora = Date.now()
    if (fechaEvento.getTime() <= ahora) {
      throw new ErrorDeNegocio("La fecha del evento debe ser futura")
    }
    // Límite de 5 años hacia adelante
    if (fechaEvento.getTime() > ahora + 5 * 365 * 24 * 60 * 60 * 1000) {
      throw new ErrorDeNegocio("La fecha del evento no puede superar los 5 años en el futuro")
    }

    if (!Array.isArray(tiposEntrada) || tiposEntrada.length === 0) {
      throw new ErrorDeNegocio("El evento debe ofrecer al menos un tipo de entrada")
    }
    if (tiposEntrada.length > 10) {
      throw new ErrorDeNegocio("Un evento no puede tener más de 10 tipos de entrada")
    }

    // Validar multimedia (máximo 10 imágenes, esquemas seguros)
    if (!Array.isArray(multimedia)) {
      throw new ErrorDeNegocio("El campo multimedia debe ser una lista")
    }
    if (multimedia.length > 10) {
      throw new ErrorDeNegocio("No se pueden adjuntar más de 10 imágenes por evento")
    }
    for (const item of multimedia) {
      if (!validarUrlOMultimedia(item)) {
        throw new ErrorDeNegocio(
          "Formato o esquema de imagen no permitido. Solo se aceptan URLs web seguras o imágenes válidas.",
          400,
        )
      }
    }

    const tipos = tiposEntrada.map((tipo) => this.#crearTipoEntrada(tipo))
    const evento = new Evento(
      nombreLimpio,
      descLimpia,
      categoria,
      fechaEvento,
      tipos,
      multimedia,
      organizador,
    )
    this.eventos.guardar(evento)
    return serializarEvento(evento, this.resenias.obtenerTodos())
  }

  comprasDeEvento(usuarioId, eventoId) {
    const eId = validarIdSeguro(eventoId, "eventoId")
    const evento = this.#eventoDelOrganizador(usuarioId, eId)
    const compras = this.compras
      .buscar((compra) => String(compra.evento.id) === String(evento.id))
      .map((compra) => serializarCompra(compra))

    return {
      evento: serializarEvento(evento, this.resenias.obtenerTodos()),
      disponibilidad: evento.tiposEntrada.map(serializarTipoEntrada),
      compras,
    }
  }

  marcarUtilizada(usuarioId, compraId) {
    const cId = validarIdSeguro(compraId, "compraId")
    const compra = this.#compraDelOrganizador(usuarioId, cId)
    compra.marcarUtilizada(compra.evento.organizador)
    return serializarCompra(compra)
  }

  enviarMensaje(usuarioId, compraId, texto) {
    const cId = validarIdSeguro(compraId, "compraId")
    const compra = this.#compraDelOrganizador(usuarioId, cId)
    const textoSanitizado = sanitizarTexto(texto, 1000, "mensaje")
    if (!textoSanitizado) {
      throw new ErrorDeNegocio("El mensaje no puede estar vacío")
    }
    compra.agregarMensaje(compra.evento.organizador, textoSanitizado)
    return serializarCompra(compra)
  }

  #crearTipoEntrada(datos) {
    const { nombre, descripcion = "", precio, cupo } = datos
    const nombreLimpio = sanitizarTexto(nombre, 60, "nombre del sector")
    if (!nombreLimpio) {
      throw new ErrorDeNegocio("Cada tipo de entrada necesita un nombre válido")
    }

    const descLimpia = sanitizarTexto(descripcion, 250, "descripción del sector")

    const precioNumero = Number(precio)
    if (!Number.isFinite(precioNumero) || precioNumero < 0 || precioNumero > 10000000) {
      throw new ErrorDeNegocio("El precio debe ser un número válido entre $0 y $10.000.000")
    }

    const cupoSeguro = validarEnteroSeguro(cupo, 1, 100000, "cupo")

    const tipo = new TipoEntrada(nombreLimpio, descLimpia, precioNumero, cupoSeguro)
    tipo.id = RepositorioMemoria.nuevoId()
    return tipo
  }

  #usuario(usuarioId) {
    const idValido = validarIdSeguro(usuarioId, "usuarioId")
    const usuario = this.usuarios.obtenerPorId(idValido)
    if (!usuario) {
      throw new ErrorDeNegocio("Usuario no encontrado", 404)
    }
    return usuario
  }

  #organizador(usuarioId) {
    const usuario = this.#usuario(usuarioId)
    if (!usuario.esOrganizador()) {
      throw new ErrorDeNegocio("La operación requiere un usuario organizador", 403)
    }
    return usuario
  }

  #eventoDelOrganizador(usuarioId, eventoId) {
    const organizador = this.#organizador(usuarioId)
    const eId = validarIdSeguro(eventoId, "eventoId")
    const evento = this.eventos.obtenerPorId(eId)
    if (!evento) {
      throw new ErrorDeNegocio("Evento no encontrado", 404)
    }
    if (!evento.esOrganizadoPor(organizador.id)) {
      throw new ErrorDeNegocio("El evento no pertenece al organizador", 403)
    }
    return evento
  }

  #compraDelOrganizador(usuarioId, compraId) {
    const organizador = this.#organizador(usuarioId)
    const cId = validarIdSeguro(compraId, "compraId")
    const compra = this.compras.obtenerPorId(cId)
    if (!compra) {
      throw new ErrorDeNegocio("Compra no encontrada", 404)
    }
    if (!compra.esDelOrganizador(organizador.id)) {
      throw new ErrorDeNegocio("La compra no corresponde a un evento del organizador", 403)
    }
    return compra
  }
}
