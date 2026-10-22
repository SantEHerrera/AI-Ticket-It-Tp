import "dotenv/config"
import { crearApp } from "./src/app.js"
import { crearDependencias } from "./src/dependencias.js"
import { iniciarServidor } from "./src/server.js"

const dependencias = crearDependencias()
const app = crearApp(dependencias)
iniciarServidor(app)
