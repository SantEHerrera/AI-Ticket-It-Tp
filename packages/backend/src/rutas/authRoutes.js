import { Router } from "express"

export default function crearAuthRoutes(controller) {
  const routes = Router()

  routes.post("/login", controller.login)
  routes.get("/perfil", controller.perfil)

  return routes
}
