import cors from "cors"
import express from "express"
import crearRoutes from "./rutas/routes.js"

export function crearApp(dependencias) {
  const app = express()

  app.use(express.json())
  app.use(
    cors({
      origin: process.env.ALLOWED_ORIGINS
        ? process.env.ALLOWED_ORIGINS.split(",").map((origen) => origen.trim())
        : true,
    }),
  )

  app.use("/api", crearRoutes(dependencias))

  app.use((req, res) => {
    res.status(404).json({ error: "Ruta no encontrada" })
  })

  return app
}
