import { EstadoCompra } from "../dominio/enums/EstadoCompra.js"

export function serializarUsuario(usuario) {
  if (!usuario) {
    return null
  }
  return {
    id: usuario.id,
    nombre: usuario.nombre,
    apellido: usuario.apellido,
    nombreCompleto: usuario.nombreCompleto(),
    rol: usuario.rol,
    favoritos: [...usuario.favoritos],
  }
}

export function serializarCategoria(categoria) {
  if (!categoria) {
    return null
  }
  return {
    id: categoria.id,
    nombre: categoria.nombre,
    descripcion: categoria.descripcion,
  }
}

export function serializarTipoEntrada(tipo) {
  return {
    id: tipo.id,
    nombre: tipo.nombre,
    descripcion: tipo.descripcion,
    precio: tipo.precio,
    cupo: tipo.cupo,
    cupoDisponible: tipo.cupoDisponible,
  }
}

export function serializarMensaje(mensaje) {
  return {
    id: mensaje.id,
    texto: mensaje.mensaje,
    enviado: mensaje.enviado,
    usuario: serializarUsuario(mensaje.usuario),
  }
}

export function serializarCambioEstado(cambio) {
  return {
    estado: cambio.estadoCompra,
    fechaHora: cambio.fechaHora,
    quien: serializarUsuario(cambio.quien),
  }
}

export function serializarResenia(resenia) {
  return {
    id: resenia.id,
    detalle: resenia.detalle,
    puntuacion: resenia.puntuacion,
    fecha: resenia.fecha,
    comprador: serializarUsuario(resenia.comprador),
    evento: {
      id: resenia.evento.id,
      nombre: resenia.evento.nombre,
      fecha: resenia.evento.fecha,
    },
  }
}

export function reputacionOrganizador(organizador, resenias) {
  const delOrganizador = resenias.filter((resenia) => resenia.evento.esOrganizadoPor(organizador.id))
  if (!delOrganizador.length) {
    return { puntajePromedio: 0, cantidadResenias: 0 }
  }
  const suma = delOrganizador.reduce((acum, resenia) => acum + resenia.puntuacion, 0)
  return {
    puntajePromedio: Math.round((suma / delOrganizador.length) * 10) / 10,
    cantidadResenias: delOrganizador.length,
  }
}

export function serializarEvento(evento, resenias = []) {
  const reputacion = reputacionOrganizador(evento.organizador, resenias)
  return {
    id: evento.id,
    nombre: evento.nombre,
    descripcion: evento.descripcion,
    fecha: evento.fecha,
    yaSeRealizo: evento.yaSeRealizo(),
    diasHastaEvento: evento.diasHastaRealizacion(),
    multimedia: [...evento.multimedia],
    categoria: serializarCategoria(evento.categoria),
    tiposEntrada: evento.tiposEntrada.map(serializarTipoEntrada),
    precioDesde: evento.precioMinimo(),
    organizador: {
      ...serializarUsuario(evento.organizador),
      ...reputacion,
    },
    reseniasOrganizador: resenias
      .filter((resenia) => resenia.evento.esOrganizadoPor(evento.organizador.id))
      .map(serializarResenia),
  }
}

export function serializarCompra(compra, opciones = {}) {
  const { paraComprador = false } = opciones
  const confirmada = compra.estadoEntrada === EstadoCompra.CONFIRMADA
  return {
    id: compra.id,
    estado: compra.estadoEntrada,
    cantidad: compra.cantidad,
    total: compra.total,
    tipoEntrada: serializarTipoEntrada(compra.tipoEntrada),
    evento: {
      id: compra.evento.id,
      nombre: compra.evento.nombre,
      fecha: compra.evento.fecha,
      yaSeRealizo: compra.evento.yaSeRealizo(),
      organizador: serializarUsuario(compra.evento.organizador),
    },
    comprador: serializarUsuario(compra.usuario),
    diasHastaEvento: paraComprador && confirmada ? compra.diasHastaEvento() : null,
    puedeCancelarse: compra.puedeCancelarse(),
    puedeReseniarse: compra.puedeReseniarse(),
    historial: compra.historial.map(serializarCambioEstado),
    mensajes: compra.mensajes.map(serializarMensaje),
    resenia: compra.resenia ? serializarResenia(compra.resenia) : null,
  }
}
