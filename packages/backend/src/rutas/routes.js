import { Router } from "express"
import { getHealth } from "../controllers/HealthController.js"
import crearCompradorRoutes from "./compradorRoutes.js"
import crearOrganizadorRoutes from "./organizadorRoutes.js"

export default function crearRoutes({ compradorController, organizadorController }) {
  const routes = Router()

  routes.get("/health", getHealth)
  routes.get("/usuarios", compradorController.listarUsuarios)
  routes.get("/categorias", compradorController.listarCategorias)
  routes.get("/eventos", compradorController.buscarEventos)
  routes.get("/eventos/:eventoId", compradorController.obtenerEvento)
  routes.use("/comprador", crearCompradorRoutes(compradorController))
  routes.use("/organizador", crearOrganizadorRoutes(organizadorController))

  return routes
}
