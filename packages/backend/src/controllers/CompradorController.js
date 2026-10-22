import { idUsuarioDesde, manejarError } from "./manejarError.js"

export default class CompradorController {
  constructor(compradorService) {
    this.compradorService = compradorService
  }

  listarUsuarios = (req, res) => {
    try {
      return res.json(this.compradorService.listarUsuarios())
    } catch (error) {
      return manejarError(res, error)
    }
  }

  listarCategorias = (req, res) => {
    try {
      return res.json(this.compradorService.listarCategorias())
    } catch (error) {
      return manejarError(res, error)
    }
  }

  buscarEventos = (req, res) => {
    try {
      const { q, categoriaId, orden } = req.query
      return res.json(this.compradorService.buscarEventos({ texto: q, categoriaId, orden }))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  obtenerEvento = (req, res) => {
    try {
      return res.json(this.compradorService.obtenerEvento(req.params.eventoId))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  listarCompras = (req, res) => {
    try {
      return res.json(this.compradorService.listarCompras(idUsuarioDesde(req)))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  obtenerCompra = (req, res) => {
    try {
      return res.json(this.compradorService.obtenerCompra(idUsuarioDesde(req), req.params.compraId))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  crearCompra = (req, res) => {
    try {
      const compra = this.compradorService.crearCompra(idUsuarioDesde(req), req.body)
      return res.status(201).json(compra)
    } catch (error) {
      return manejarError(res, error)
    }
  }

  pagarCompra = (req, res) => {
    try {
      return res.json(this.compradorService.pagarCompra(idUsuarioDesde(req), req.params.compraId))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  cancelarCompra = (req, res) => {
    try {
      return res.json(this.compradorService.cancelarCompra(idUsuarioDesde(req), req.params.compraId))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  enviarMensaje = (req, res) => {
    try {
      return res.status(201).json(
        this.compradorService.enviarMensaje(idUsuarioDesde(req), req.params.compraId, req.body?.texto),
      )
    } catch (error) {
      return manejarError(res, error)
    }
  }

  crearResenia = (req, res) => {
    try {
      return res.status(201).json(
        this.compradorService.crearResenia(idUsuarioDesde(req), req.params.compraId, req.body),
      )
    } catch (error) {
      return manejarError(res, error)
    }
  }

  listarFavoritos = (req, res) => {
    try {
      return res.json(this.compradorService.listarFavoritos(idUsuarioDesde(req)))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  agregarFavorito = (req, res) => {
    try {
      return res.json(this.compradorService.agregarFavorito(idUsuarioDesde(req), req.params.eventoId))
    } catch (error) {
      return manejarError(res, error)
    }
  }

  quitarFavorito = (req, res) => {
    try {
      return res.json(this.compradorService.quitarFavorito(idUsuarioDesde(req), req.params.eventoId))
    } catch (error) {
      return manejarError(res, error)
    }
  }
}
