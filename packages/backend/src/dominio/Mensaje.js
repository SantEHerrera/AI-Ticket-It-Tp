export default class Mensaje {
  constructor(usuario, mensaje) {
    this.usuario = usuario
    this.mensaje = mensaje
    this.enviado = new Date()
  }
}
