import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import authService from "../service/authService";
import compradorService from "../service/compradorService";
import { setAuthToken, setApiUserId } from "../service/api";

const TOKEN_KEY = "@aiticket_jwt_token";
const USER_KEY = "@aiticket_user_data";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [usuarios, setUsuarios] = useState([]);
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [token, setToken] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const inicializarAuth = async () => {
    try {
      setCargando(true);
      setError(null);

      // Cargar lista de usuarios para sugerencias de inicio rápido
      try {
        const lista = await compradorService.listarUsuarios();
        setUsuarios(lista || []);
      } catch (e) {
        console.warn("No se pudo obtener lista de usuarios de prueba:", e);
      }

      // Cargar token y usuario previamente guardados
      const storedToken = await AsyncStorage.getItem(TOKEN_KEY);
      const storedUser = await AsyncStorage.getItem(USER_KEY);

      if (storedToken && storedUser) {
        setAuthToken(storedToken);
        const parsedUser = JSON.parse(storedUser);
        setApiUserId(parsedUser.id);
        setToken(storedToken);
        setUsuarioActual(parsedUser);

        // Verificar validez del token con el perfil en el backend
        try {
          const perfil = await authService.obtenerPerfil();
          if (perfil) {
            setUsuarioActual(perfil);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(perfil));
          }
        } catch {
          // Token expirado o inválido
          await logout();
        }
      }
    } catch (err) {
      console.error("Error al inicializar sesión:", err);
      setError("No se pudo conectar con el servidor backend. Verifica la IP del servidor.");
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => {
    inicializarAuth();
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    if (data?.token && data?.usuario) {
      setToken(data.token);
      setUsuarioActual(data.usuario);
      await AsyncStorage.setItem(TOKEN_KEY, data.token);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(data.usuario));
      return data.usuario;
    }
    throw new Error("Respuesta inválida del servidor");
  };

  const logout = async () => {
    authService.logout();
    setToken(null);
    setUsuarioActual(null);
    try {
      await AsyncStorage.removeItem(TOKEN_KEY);
      await AsyncStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn("Error al remover credenciales de almacenamiento:", e);
    }
  };

  const isComprador = usuarioActual?.rol === "COMPRADOR";
  const isOrganizador = usuarioActual?.rol === "ORGANIZADOR";
  const isAutenticado = !!usuarioActual && !!token;

  return (
    <AuthContext.Provider
      value={{
        usuarios,
        usuarioActual,
        token,
        isAutenticado,
        isComprador,
        isOrganizador,
        cargando,
        error,
        login,
        logout,
        inicializarAuth,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

export default AuthContext;
