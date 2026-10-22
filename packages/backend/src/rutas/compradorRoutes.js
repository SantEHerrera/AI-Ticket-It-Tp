import { Router } from "express"

export default function crearCompradorRoutes(controller) {
  const routes = Router()

  routes.get("/compras", controller.listarCompras)
  routes.post("/compras", controller.crearCompra)
  routes.get("/compras/:compraId", controller.obtenerCompra)
  routes.post("/compras/:compraId/pagar", controller.pagarCompra)
  routes.post("/compras/:compraId/cancelar", controller.cancelarCompra)
  routes.post("/compras/:compraId/mensajes", controller.enviarMensaje)
  routes.post("/compras/:compraId/resenia", controller.crearResenia)
  routes.get("/favoritos", controller.listarFavoritos)
  routes.post("/favoritos/:eventoId", controller.agregarFavorito)
  routes.delete("/favoritos/:eventoId", controller.quitarFavorito)

  return routes
}
