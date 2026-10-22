import Categoria from "../dominio/Categoria.js"
import Compra from "../dominio/Compra.js"
import Evento from "../dominio/Evento.js"
import Resenia from "../dominio/Resenia.js"
import TipoEntrada from "../dominio/TipoEntrada.js"
import Usuario from "../dominio/Usuario.js"
import { EstadoCompra } from "../dominio/enums/EstadoCompra.js"
import RepositorioMemoria from "./RepositorioMemoria.js"

function enDias(dias) {
  const fecha = new Date()
  fecha.setDate(fecha.getDate() + dias)
  fecha.setHours(21, 0, 0, 0)
  return fecha
}

function crearTipo(nombre, descripcion, precio, cupo) {
  const tipo = new TipoEntrada(nombre, descripcion, precio, cupo)
  tipo.id = RepositorioMemoria.nuevoId()
  return tipo
}

export function cargarDatosIniciales(repos) {
  const musica = repos.categorias.guardar(new Categoria("Música", "Recitales, festivales y shows en vivo"))
  const teatro = repos.categorias.guardar(new Categoria("Teatro", "Obras, comedia y musicales"))
  const deportes = repos.categorias.guardar(new Categoria("Deportes", "Partidos y competencias"))
  const gastronomia = repos.categorias.guardar(
    new Categoria("Gastronomía", "Ferias, degustaciones y experiencias culinarias"),
  )

  const lucia = repos.usuarios.guardar(new Usuario("Lucía", "Gómez", [], "ORGANIZADOR"))
  const martin = repos.usuarios.guardar(new Usuario("Martín", "Pérez", [], "ORGANIZADOR"))
  const sofia = repos.usuarios.guardar(new Usuario("Sofía", "Ruiz", [], "COMPRADOR"))
  const diego = repos.usuarios.guardar(new Usuario("Diego", "Alonso", [], "COMPRADOR"))

  const festival = repos.eventos.guardar(
    new Evento(
      "Festival Río Sonoro",
      "Jornada de bandas emergentes a orillas del río, con food trucks y dos escenarios.",
      musica,
      enDias(18),
      [
        crearTipo("General", "Acceso a parque y escenario principal", 12000, 200),
        crearTipo("VIP", "Zona elevada, bar exclusivo y merchandising", 28000, 40),
      ],
      ["https://picsum.photos/seed/riosonoro/800/400"],
      lucia,
    ),
  )

  const obra = repos.eventos.guardar(
    new Evento(
      "Noche de Títeres",
      "Función familiar de marionetas con dos intervalos y taller posterior.",
      teatro,
      enDias(7),
      [
        crearTipo("Platea", "Filas centrales", 8000, 80),
        crearTipo("Pullman", "Sector superior", 5000, 60),
      ],
      ["https://picsum.photos/seed/titeres/800/400"],
      lucia,
    ),
  )

  const clasico = repos.eventos.guardar(
    new Evento(
      "Clásico del Barrio",
      "Partido amistoso con previa, hinchada y puesto de empanadas.",
      deportes,
      enDias(30),
      [
        crearTipo("Popular", "Tribuna visitante y local", 4500, 300),
        crearTipo("Platea cubierta", "Asiento numerado", 9000, 120),
      ],
      ["https://picsum.photos/seed/clasico/800/400"],
      martin,
    ),
  )

  const feriaPasada = repos.eventos.guardar(
    new Evento(
      "Feria de Sabores del Sur",
      "Encuentro gastronómico ya realizado, con productores regionales.",
      gastronomia,
      enDias(-12),
      [
        crearTipo("Entrada general", "Acceso a stands y shows de cocina", 6000, 150),
        crearTipo("Pase degustación", "Incluye 6 tickets de cata", 14000, 50),
      ],
      ["https://picsum.photos/seed/feria/800/400"],
      martin,
    ),
  )

  const tipoFestivalGeneral = festival.tiposEntrada[0]
  const tipoObraPlatea = obra.tiposEntrada[0]
  const tipoClasicoPopular = clasico.tiposEntrada[0]
  const tipoFeriaGeneral = feriaPasada.tiposEntrada[0]
  const tipoFeriaCata = feriaPasada.tiposEntrada[1]

  tipoFestivalGeneral.reservar(2)
  const compraPendiente = new Compra(
    sofia,
    festival,
    tipoFestivalGeneral,
    2,
    tipoFestivalGeneral.precio * 2,
    EstadoCompra.PENDIENTE,
  )
  repos.compras.guardar(compraPendiente)
  compraPendiente.registrarCambioEstado(EstadoCompra.PENDIENTE, sofia)

  tipoObraPlatea.reservar(1)
  const compraConfirmada = new Compra(
    sofia,
    obra,
    tipoObraPlatea,
    1,
    tipoObraPlatea.precio,
    EstadoCompra.CONFIRMADA,
  )
  repos.compras.guardar(compraConfirmada)
  compraConfirmada.registrarCambioEstado(EstadoCompra.PENDIENTE, sofia)
  compraConfirmada.registrarCambioEstado(EstadoCompra.CONFIRMADA, sofia)
  compraConfirmada.agregarMensaje(sofia, "¿Hay estacionamiento cerca del teatro?")
  compraConfirmada.agregarMensaje(lucia, "Sí, a dos cuadras hay un playón cubierto.")

  tipoClasicoPopular.reservar(3)
  const compraDiego = new Compra(
    diego,
    clasico,
    tipoClasicoPopular,
    3,
    tipoClasicoPopular.precio * 3,
    EstadoCompra.CONFIRMADA,
  )
  repos.compras.guardar(compraDiego)
  compraDiego.registrarCambioEstado(EstadoCompra.PENDIENTE, diego)
  compraDiego.registrarCambioEstado(EstadoCompra.CONFIRMADA, diego)

  tipoFeriaCata.reservar(2)
  const compraUtilizada = new Compra(
    sofia,
    feriaPasada,
    tipoFeriaCata,
    2,
    tipoFeriaCata.precio * 2,
    EstadoCompra.UTILIZADA,
  )
  repos.compras.guardar(compraUtilizada)
  compraUtilizada.registrarCambioEstado(EstadoCompra.PENDIENTE, sofia)
  compraUtilizada.registrarCambioEstado(EstadoCompra.CONFIRMADA, sofia)
  compraUtilizada.registrarCambioEstado(EstadoCompra.UTILIZADA, martin)

  const reseniaSofia = new Resenia(
    sofia,
    feriaPasada,
    "Excelente organización y muy buena variedad de puestos. Repetiría.",
    5,
  )
  repos.resenias.guardar(reseniaSofia)
  compraUtilizada.resenia = reseniaSofia

  tipoFeriaGeneral.reservar(1)
  const compraDiegoFeria = new Compra(
    diego,
    feriaPasada,
    tipoFeriaGeneral,
    1,
    tipoFeriaGeneral.precio,
    EstadoCompra.UTILIZADA,
  )
  repos.compras.guardar(compraDiegoFeria)
  compraDiegoFeria.registrarCambioEstado(EstadoCompra.PENDIENTE, diego)
  compraDiegoFeria.registrarCambioEstado(EstadoCompra.CONFIRMADA, diego)
  compraDiegoFeria.registrarCambioEstado(EstadoCompra.UTILIZADA, martin)

  const reseniaDiego = new Resenia(diego, feriaPasada, "Muy rico, aunque hubo bastante cola al mediodía.", 4)
  repos.resenias.guardar(reseniaDiego)
  compraDiegoFeria.resenia = reseniaDiego

  sofia.agregarFavorito(festival.id)
  diego.agregarFavorito(clasico.id)
}
