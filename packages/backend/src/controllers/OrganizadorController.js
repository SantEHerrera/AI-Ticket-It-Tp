import { idUsuarioDesde, manejarError } from "./manejarError.js"

export default class OrganizadorController {
  constructor(organizadorService) {
    this.organizadorService = organizadorService
  }

  listarEventos = (req, res) => {
    try {
      return res.json(this.organizadorService.listarEventos(idUsuarioDesde(req)))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  crearEvento = (req, res) => {
    try {
      const evento = this.organizadorService.crearEvento(idUsuarioDesde(req), req.body)
      return res.status(201).json(evento)
    } catch (error) {
      return manejarError(res, error)
    }
  }

  comprasDeEvento = (req, res) => {
    try {
      return res.json(this.organizadorService.comprasDeEvento(idUsuarioDesde(req), req.params.eventoId))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  marcarUtilizada = (req, res) => {
    try {
      return res.json(this.organizadorService.marcarUtilizada(idUsuarioDesde(req), req.params.compraId))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  enviarMensaje = (req, res) => {
    try {
      return res.status(201).json(
        this.organizadorService.enviarMensaje(idUsuarioDesde(req), req.params.compraId, req.body?.texto),
      )
    } catch (error) {
      return manejarError(res, error)
    }
  }
}
