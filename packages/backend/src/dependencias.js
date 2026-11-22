import AuthController from "./controllers/AuthController.js"
import CompradorController from "./controllers/CompradorController.js"
import OrganizadorController from "./controllers/OrganizadorController.js"
import { cargarDatosIniciales } from "./repositorios/datosIniciales.js"
import RepositorioMemoria from "./repositorios/RepositorioMemoria.js"
import AuthService from "./servicios/AuthService.js"
import CompradorService from "./servicios/CompradorService.js"
import OrganizadorService from "./servicios/OrganizadorService.js"

export function crearDependencias() {
  const repos = {
    usuarios: new RepositorioMemoria(),
    categorias: new RepositorioMemoria(),
    eventos: new RepositorioMemoria(),
    compras: new RepositorioMemoria(),
    resenias: new RepositorioMemoria(),
  }

  cargarDatosIniciales(repos)

  const authService = new AuthService(repos)
  const compradorService = new CompradorService(repos)
  const organizadorService = new OrganizadorService(repos)

  return {
    repos,
    authService,
    compradorService,
    organizadorService,
    authController: new AuthController(authService),
    compradorController: new CompradorController(compradorService),
    organizadorController: new OrganizadorController(organizadorService),
  }
}
