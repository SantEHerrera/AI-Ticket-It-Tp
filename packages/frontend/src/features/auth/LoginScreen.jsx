import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import { useAuth } from "../../context/AuthContext";
import FeedbackModal from "../../components/common/FeedbackModal";
import NetworkSettingsModal from "../../components/headers/NetworkSettingsModal";

export const LoginScreen = () => {
  const insets = useSafeAreaInsets();
  const { login, inicializarAuth } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verPassword, setVerPassword] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [modalNetworkVisible, setModalNetworkVisible] = useState(false);

  const [feedback, setFeedback] = useState({
    visible: false,
    tipo: "error",
    titulo: "",
    mensaje: "",
    textoConfirmar: "Aceptar",
    onConfirmar: null,
  });

  const usuariosPrueba = [
    {
      nombre: "Sofía Ruiz",
      email: "sofia@aiticket.com",
      password: "password123",
      rol: "COMPRADOR",
      icono: "cart-outline",
      color: colors.secondary,
    },
    {
      nombre: "Diego Alonso",
      email: "diego@aiticket.com",
      password: "password123",
      rol: "COMPRADOR",
      icono: "ticket-outline",
      color: colors.secondary,
    },
    {
      nombre: "Lucía Gómez",
      email: "lucia@aiticket.com",
      password: "password123",
      rol: "ORGANIZADOR",
      icono: "briefcase-outline",
      color: colors.primary,
    },
    {
      nombre: "Martín Pérez",
      email: "martin@aiticket.com",
      password: "password123",
      rol: "ORGANIZADOR",
      icono: "calendar-outline",
      color: colors.primary,
    },
  ];

  const handleLogin = async (emailParam, passParam) => {
    const targetEmail = (emailParam || email).trim();
    const targetPass = passParam || password;

    if (!targetEmail || !targetPass) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Campos requeridos",
        mensaje: "Por favor ingresa tu email (o nombre de usuario) y tu contraseña.",
        textoConfirmar: "Entendido",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    try {
      setEnviando(true);
      await login(targetEmail, targetPass);
    } catch (err) {
      const msg =
        err.response?.data?.error ||
        err.message ||
        "No se pudo iniciar sesión. Verifica tus credenciales o la conexión con el servidor.";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Error de Autenticación",
        mensaje: msg,
        textoConfirmar: "Reintentar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setEnviando(false);
    }
  };

  const handleSeleccionarPrueba = (u) => {
    setEmail(u.email);
    setPassword(u.password);
    handleLogin(u.email, u.password);
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: Math.max(insets.top + 16, 32), paddingBottom: Math.max(insets.bottom + 24, 32) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Botón de Ajustes de Servidor */}
        <View style={styles.topBar}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity
            style={styles.networkBtn}
            onPress={() => setModalNetworkVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="server-outline" size={16} color={colors.textMuted} />
            <Text style={styles.networkBtnText}>Configurar IP</Text>
          </TouchableOpacity>
        </View>

        {/* Logo y Encabezado */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Ionicons name="ticket" size={38} color={colors.surface} />
          </View>
          <Text style={styles.appName}>AI Ticket It</Text>
          <Text style={styles.appSubtitle}>Iniciar Sesión en tu Cuenta</Text>
          <Text style={styles.appDescription}>
            Ingresa tus credenciales para acceder a la plataforma de venta y compra de entradas.
          </Text>
        </View>

        {/* Tarjeta del Formulario */}
        <View style={styles.formCard}>
          <Text style={styles.label}>Email o Usuario</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="mail-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="ej: sofia@aiticket.com o sofia"
              placeholderTextColor={colors.textLight}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="lock-closed-outline" size={20} color={colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Tu contraseña"
              placeholderTextColor={colors.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!verPassword}
            />
            <TouchableOpacity onPress={() => setVerPassword((v) => !v)} style={styles.eyeBtn}>
              <Ionicons
                name={verPassword ? "eye-off-outline" : "eye-outline"}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, enviando && styles.loginBtnDisabled]}
            onPress={() => handleLogin()}
            disabled={enviando}
            activeOpacity={0.8}
          >
            {enviando ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <>
                <Text style={styles.loginBtnText}>Ingresar</Text>
                <Ionicons name="arrow-forward" size={18} color={colors.surface} />
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Acceso Rápido con Usuarios de Prueba */}
        <View style={styles.quickAccessSection}>
          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>O INGRESA COMO USUARIO DE PRUEBA</Text>
            <View style={styles.divider} />
          </View>

          <Text style={styles.quickAccessHelp}>
            Toca cualquiera de los usuarios preconfigurados para iniciar sesión automáticamente:
          </Text>

          <View style={styles.usersGrid}>
            {usuariosPrueba.map((u) => {
              const esOrg = u.rol === "ORGANIZADOR";
              return (
                <TouchableOpacity
                  key={u.email}
                  style={[styles.userCard, esOrg && styles.userCardOrg]}
                  onPress={() => handleSeleccionarPrueba(u)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.userIconCircle,
                      { backgroundColor: esOrg ? colors.primaryLight : colors.secondary + "20" },
                    ]}
                  >
                    <Ionicons name={u.icono} size={20} color={u.color} />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userNombre}>{u.nombre}</Text>
                    <Text style={styles.userEmail}>{u.email}</Text>
                    <View style={styles.badgeRow}>
                      <Text
                        style={[
                          styles.roleBadge,
                          {
                            color: esOrg ? colors.primaryDark : colors.secondary,
                            backgroundColor: esOrg ? colors.primaryLight : colors.secondary + "20",
                          },
                        ]}
                      >
                        {u.rol}
                      </Text>
                    </View>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textLight} />
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>

      {/* Modal de Feedback */}
      <FeedbackModal
        visible={feedback.visible}
        tipo={feedback.tipo}
        titulo={feedback.titulo}
        mensaje={feedback.mensaje}
        textoConfirmar={feedback.textoConfirmar}
        onConfirmar={feedback.onConfirmar}
      />

      {/* Modal de Ajustes de Red */}
      <NetworkSettingsModal
        visible={modalNetworkVisible}
        onClose={() => setModalNetworkVisible(false)}
        onUrlChanged={() => {
          if (inicializarAuth) inicializarAuth();
        }}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingHorizontal: 20,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 8,
  },
  networkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.surface,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  networkBtnText: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  logoContainer: {
    width: 72,
    height: 72,
    borderRadius: 24,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  appName: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginTop: 2,
  },
  appDescription: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    marginTop: 6,
    lineHeight: 18,
    maxWidth: 320,
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    marginBottom: 24,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.text,
  },
  eyeBtn: {
    padding: 6,
  },
  loginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 14,
    marginTop: 8,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  loginBtnDisabled: {
    backgroundColor: colors.textLight,
  },
  loginBtnText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.surface,
  },
  quickAccessSection: {
    marginBottom: 20,
  },
  dividerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textLight,
    textTransform: "uppercase",
  },
  quickAccessHelp: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
    marginBottom: 14,
  },
  usersGrid: {
    gap: 10,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userCardOrg: {
    borderColor: colors.primaryLight,
  },
  userIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userNombre: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  userEmail: {
    fontSize: 12,
    color: colors.textMuted,
  },
  badgeRow: {
    marginTop: 4,
  },
  roleBadge: {
    alignSelf: "flex-start",
    fontSize: 10,
    fontWeight: "800",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
});

export default LoginScreen;
