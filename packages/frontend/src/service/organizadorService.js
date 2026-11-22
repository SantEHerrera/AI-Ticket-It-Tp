import api from "./api";

export const organizadorService = {
  // Operaciones de Organizador (requiere x-user-id de rol ORGANIZADOR)
  listarEventos: async () => {
    const res = await api.get("/organizador/eventos");
    return res.data;
  },

  crearEvento: async ({ nombre, descripcion, categoriaId, fecha, tiposEntrada, multimedia }) => {
    const res = await api.post("/organizador/eventos", {
      nombre,
      descripcion,
      categoriaId,
      fecha,
      tiposEntrada,
      multimedia,
    });
    return res.data;
  },

  comprasDeEvento: async (eventoId) => {
    const res = await api.get(`/organizador/eventos/${eventoId}/compras`);
    return res.data;
  },

  marcarUtilizada: async (compraId) => {
    const res = await api.post(`/organizador/compras/${compraId}/utilizar`);
    return res.data;
  },

  enviarMensaje: async (compraId, texto) => {
    const res = await api.post(`/organizador/compras/${compraId}/mensajes`, { texto });
    return res.data;
  },
};

export default organizadorService;
