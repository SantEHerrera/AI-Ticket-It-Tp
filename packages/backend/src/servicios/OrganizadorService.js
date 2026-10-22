import Evento from "../dominio/Evento.js"
import TipoEntrada from "../dominio/TipoEntrada.js"
import ErrorDeNegocio from "../dominio/errores/ErrorDeNegocio.js"
import RepositorioMemoria from "../repositorios/RepositorioMemoria.js"
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

    if (!nombre || !descripcion || !fecha) {
      throw new ErrorDeNegocio("Nombre, descripción y fecha son obligatorios")
    }
    const categoria = this.categorias.obtenerPorId(categoriaId)
    if (!categoria) {
      throw new ErrorDeNegocio("Categoría no encontrada", 404)
    }
    const fechaEvento = new Date(fecha)
    if (Number.isNaN(fechaEvento.getTime())) {
      throw new ErrorDeNegocio("La fecha del evento no es válida")
    }
    if (fechaEvento.getTime() <= Date.now()) {
      throw new ErrorDeNegocio("La fecha del evento debe ser futura")
    }
    if (!Array.isArray(tiposEntrada) || tiposEntrada.length === 0) {
      throw new ErrorDeNegocio("El evento debe ofrecer al menos un tipo de entrada")
    }

    const tipos = tiposEntrada.map((tipo) => this.#crearTipoEntrada(tipo))
    const evento = new Evento(
      String(nombre).trim(),
      String(descripcion).trim(),
      categoria,
      fechaEvento,
      tipos,
      Array.isArray(multimedia) ? multimedia : [],
      organizador,
    )
    this.eventos.guardar(evento)
    return serializarEvento(evento, this.resenias.obtenerTodos())
  }

  comprasDeEvento(usuarioId, eventoId) {
    const evento = this.#eventoDelOrganizador(usuarioId, eventoId)
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
    const compra = this.#compraDelOrganizador(usuarioId, compraId)
    compra.marcarUtilizada(compra.evento.organizador)
    return serializarCompra(compra)
  }

  enviarMensaje(usuarioId, compraId, texto) {
    const compra = this.#compraDelOrganizador(usuarioId, compraId)
    compra.agregarMensaje(compra.evento.organizador, texto)
    return serializarCompra(compra)
  }

  #crearTipoEntrada(datos) {
    const { nombre, descripcion = "", precio, cupo } = datos
    if (!nombre) {
      throw new ErrorDeNegocio("Cada tipo de entrada necesita un nombre")
    }
    const precioNumero = Number(precio)
    const cupoNumero = Number(cupo)
    if (!Number.isFinite(precioNumero) || precioNumero < 0) {
      throw new ErrorDeNegocio("El precio de cada tipo de entrada debe ser un número mayor o igual a 0")
    }
    if (!Number.isInteger(cupoNumero) || cupoNumero < 1) {
      throw new ErrorDeNegocio("El cupo de cada tipo de entrada debe ser un entero mayor a 0")
    }
    const tipo = new TipoEntrada(String(nombre).trim(), String(descripcion).trim(), precioNumero, cupoNumero)
    tipo.id = RepositorioMemoria.nuevoId()
    return tipo
  }

  #usuario(usuarioId) {
    const usuario = this.usuarios.obtenerPorId(usuarioId)
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
    const evento = this.eventos.obtenerPorId(eventoId)
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
    const compra = this.compras.obtenerPorId(compraId)
    if (!compra) {
      throw new ErrorDeNegocio("Compra no encontrada", 404)
    }
    if (!compra.esDelOrganizador(organizador.id)) {
      throw new ErrorDeNegocio("La compra no corresponde a un evento del organizador", 403)
    }
    return compra
  }
}
