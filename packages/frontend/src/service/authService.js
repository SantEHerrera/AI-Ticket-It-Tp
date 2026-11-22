import api, { setAuthToken, setApiUserId } from "./api";

export const authService = {
  login: async ({ email, password }) => {
    const res = await api.post("/auth/login", { email, password });
    if (res.data?.token) {
      setAuthToken(res.data.token);
      if (res.data?.usuario?.id) {
        setApiUserId(res.data.usuario.id);
      }
    }
    return res.data;
  },

  obtenerPerfil: async () => {
    const res = await api.get("/auth/perfil");
    return res.data;
  },

  logout: () => {
    setAuthToken(null);
    setApiUserId(null);
  },
};

export default authService;
