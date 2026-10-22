import CambioEstadoCompra from "./CambioEstadoCompra.js"
import Mensaje from "./Mensaje.js"
import { EstadoCompra } from "./enums/EstadoCompra.js"
import ErrorDeNegocio from "./errores/ErrorDeNegocio.js"

export default class Compra {
  constructor(usuario, evento, tipoEntrada, cantidad, total, estadoEntrada) {
    this.usuario = usuario
    this.evento = evento
    this.tipoEntrada = tipoEntrada
    this.cantidad = Number(cantidad)
    this.total = Number(total)
    this.estadoEntrada = estadoEntrada
    this.mensajes = []
    this.historial = []
    this.resenia = null
  }

  registrarCambioEstado(estado, quien) {
    this.estadoEntrada = estado
    this.historial.push(new CambioEstadoCompra(this, estado, quien))
  }

  diasHastaEvento() {
    return this.evento.diasHastaRealizacion()
  }

  esDeComprador(usuarioId) {
    return String(this.usuario?.id) === String(usuarioId)
  }

  esDelOrganizador(usuarioId) {
    return this.evento.esOrganizadoPor(usuarioId)
  }

  puedeCancelarse() {
    if (this.estadoEntrada === EstadoCompra.UTILIZADA) {
      return false
    }
    if (this.estadoEntrada === EstadoCompra.CANCELADA || this.estadoEntrada === EstadoCompra.REEMBOLSADA) {
      return false
    }
    if (this.evento.yaSeRealizo()) {
      return false
    }
    return true
  }

  cancelar(quien) {
    if (!this.puedeCancelarse()) {
      throw new ErrorDeNegocio(
        "La compra no puede cancelarse: debe no estar utilizada y el evento aún no realizarse",
      )
    }
    const estabaConfirmada = this.estadoEntrada === EstadoCompra.CONFIRMADA
    this.tipoEntrada.liberar(this.cantidad)
    this.registrarCambioEstado(EstadoCompra.CANCELADA, quien)
    if (estabaConfirmada) {
      this.registrarCambioEstado(EstadoCompra.REEMBOLSADA, quien)
    }
  }

  confirmarPago(quien) {
    if (this.estadoEntrada !== EstadoCompra.PENDIENTE) {
      throw new ErrorDeNegocio("Solo se puede confirmar el pago de una compra pendiente")
    }
    if (this.evento.yaSeRealizo()) {
      throw new ErrorDeNegocio("No se puede pagar una compra de un evento que ya se realizó")
    }
    this.registrarCambioEstado(EstadoCompra.CONFIRMADA, quien)
  }

  marcarUtilizada(quien) {
    if (this.estadoEntrada !== EstadoCompra.CONFIRMADA) {
      throw new ErrorDeNegocio("Solo se puede utilizar una compra confirmada")
    }
    this.registrarCambioEstado(EstadoCompra.UTILIZADA, quien)
  }

  puedeReseniarse() {
    return this.estadoEntrada === EstadoCompra.UTILIZADA && !this.resenia
  }

  agregarMensaje(usuario, texto) {
    if (!texto || !String(texto).trim()) {
      throw new ErrorDeNegocio("El mensaje no puede estar vacío")
    }
    const mensaje = new Mensaje(usuario, String(texto).trim())
    mensaje.id = `${this.id ?? "nueva"}-${this.mensajes.length + 1}`
    this.mensajes.push(mensaje)
    return mensaje
  }
}
