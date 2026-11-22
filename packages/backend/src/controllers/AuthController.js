import { idUsuarioDesde, manejarError } from "./manejarError.js"

export default class AuthController {
  constructor(authService) {
    this.authService = authService
  }

  login = (req, res) => {
    try {
      const { email, password } = req.body || {}
      const resultado = this.authService.login({ email, password })
      return res.json(resultado)
    } catch (error) {
      return manejarError(res, error)
    }
  }

  perfil = (req, res) => {
    try {
      const usuarioId = idUsuarioDesde(req)
      const perfil = this.authService.obtenerPerfil(usuarioId)
      return res.json(perfil)
    } catch (error) {
      return manejarError(res, error)
    }
  }
}
