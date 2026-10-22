export default class CambioEstadoCompra {
  constructor(compra, estadoCompra, quien) {
    this.compra = compra
    this.estadoCompra = estadoCompra
    this.quien = quien
    this.fechaHora = new Date()
  }
}
