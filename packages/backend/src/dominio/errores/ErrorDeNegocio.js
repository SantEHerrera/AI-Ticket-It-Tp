export default class ErrorDeNegocio extends Error {
  constructor(mensaje, status = 400) {
    super(mensaje)
    this.name = "ErrorDeNegocio"
    this.status = status
  }
}
