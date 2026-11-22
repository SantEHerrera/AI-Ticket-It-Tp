import jwt from "jsonwebtoken"
import ErrorDeNegocio from "../dominio/errores/ErrorDeNegocio.js"
import { serializarUsuario } from "./serializacion.js"

export const JWT_SECRET = process.env.JWT_SECRET || "ai-ticket-it-super-secret-jwt-key-2026"

export default class AuthService {
  constructor(repos) {
    this.usuarios = repos.usuarios
  }

  login({ email, password }) {
    if (!email || !password) {
      throw new ErrorDeNegocio("El email y la contraseña son requeridos", 400)
    }

    const busqueda = String(email).trim().toLowerCase()
    const passwordIngresada = String(password).trim()

    // Buscar por email o por nombre de usuario (ej: "sofia", "lucia")
    const usuario = this.usuarios
      .obtenerTodos()
      .find(
        (u) =>
          u.email.toLowerCase() === busqueda ||
          u.nombre.toLowerCase() === busqueda ||
          `${u.nombre.toLowerCase()}.${u.apellido.toLowerCase()}` === busqueda,
      )

    if (!usuario) {
      throw new ErrorDeNegocio("Credenciales inválidas: usuario no encontrado", 401)
    }

    if (!usuario.validarPassword(passwordIngresada)) {
      throw new ErrorDeNegocio("Credenciales inválidas: contraseña incorrecta", 401)
    }

    const payload = {
      id: usuario.id,
      email: usuario.email,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
      nombreCompleto: usuario.nombreCompleto(),
      rol: usuario.rol,
    }

    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "7d" })

    return {
      token,
      usuario: serializarUsuario(usuario),
    }
  }

  obtenerPerfil(usuarioId) {
    const usuario = this.usuarios.obtenerPorId(usuarioId)
    if (!usuario) {
      throw new ErrorDeNegocio("Usuario no encontrado", 404)
    }
    return serializarUsuario(usuario)
  }
}
