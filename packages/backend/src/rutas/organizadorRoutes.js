import { Router } from "express"

export default function crearOrganizadorRoutes(controller) {
  const routes = Router()

  routes.get("/eventos", controller.listarEventos)
  routes.post("/eventos", controller.crearEvento)
  routes.get("/eventos/:eventoId/compras", controller.comprasDeEvento)
  routes.post("/compras/:compraId/utilizar", controller.marcarUtilizada)
  routes.post("/compras/:compraId/mensajes", controller.enviarMensaje)

  return routes
}
