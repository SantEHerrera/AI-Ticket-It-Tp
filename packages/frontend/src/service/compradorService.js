import api from "./api";

export const compradorService = {
  // Públicos / generales
  listarUsuarios: async () => {
    const res = await api.get("/usuarios");
    return res.data;
  },

  listarCategorias: async () => {
    const res = await api.get("/categorias");
    return res.data;
  },

  buscarEventos: async ({ texto, categoriaId, orden, pagina, limite, temporal } = {}) => {
    const params = {};
    if (texto) params.q = texto;
    if (categoriaId) params.categoriaId = categoriaId;
    if (orden) params.orden = orden;
    if (pagina !== undefined) params.pagina = pagina;
    if (limite !== undefined) params.limite = limite;
    if (temporal) params.temporal = temporal;
    const res = await api.get("/eventos", { params });
    return res.data;
  },

  obtenerEvento: async (eventoId) => {
    const res = await api.get(`/eventos/${eventoId}`);
    return res.data;
  },

  // Operaciones de Comprador (requiere x-user-id de rol COMPRADOR)
  listarCompras: async () => {
    const res = await api.get("/comprador/compras");
    return res.data;
  },

  obtenerCompra: async (compraId) => {
    const res = await api.get(`/comprador/compras/${compraId}`);
    return res.data;
  },

  crearCompra: async ({ eventoId, tipoEntradaId, cantidad }) => {
    const res = await api.post("/comprador/compras", {
      eventoId,
      tipoEntradaId,
      cantidad,
    });
    return res.data;
  },

  pagarCompra: async (compraId) => {
    const res = await api.post(`/comprador/compras/${compraId}/pagar`);
    return res.data;
  },

  cancelarCompra: async (compraId) => {
    const res = await api.post(`/comprador/compras/${compraId}/cancelar`);
    return res.data;
  },

  enviarMensaje: async (compraId, texto) => {
    const res = await api.post(`/comprador/compras/${compraId}/mensajes`, { texto });
    return res.data;
  },

  crearResenia: async (compraId, { puntuacion, detalle }) => {
    const res = await api.post(`/comprador/compras/${compraId}/resenia`, {
      puntuacion,
      detalle,
    });
    return res.data;
  },

  listarFavoritos: async () => {
    const res = await api.get("/comprador/favoritos");
    return res.data;
  },

  agregarFavorito: async (eventoId) => {
    const res = await api.post(`/comprador/favoritos/${eventoId}`);
    return res.data;
  },

  quitarFavorito: async (eventoId) => {
    const res = await api.delete(`/comprador/favoritos/${eventoId}`);
    return res.data;
  },
};

export default compradorService;
