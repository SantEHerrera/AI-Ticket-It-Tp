export function iniciarServidor(app, port = process.env.SERVER_PORT || 8000) {
  const servidor = app.listen(port, () => {
    console.log(`Backend escuchando en puerto ${port}`)
  })
  return servidor
}
