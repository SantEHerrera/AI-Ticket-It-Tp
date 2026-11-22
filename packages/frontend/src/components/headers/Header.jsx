import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Platform, StatusBar } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import colors from "../../theme/colors";
import UserSwitcherModal from "./UserSwitcherModal";
import NetworkSettingsModal from "./NetworkSettingsModal";
import FeedbackModal from "../common/FeedbackModal";

export const Header = () => {
  const { usuarioActual, logout, inicializarAuth } = useAuth();
  const [modalUserVisible, setModalUserVisible] = useState(false);
  const [modalNetworkVisible, setModalNetworkVisible] = useState(false);

  const [feedback, setFeedback] = useState({
    visible: false,
    tipo: "confirm",
    titulo: "",
    mensaje: "",
    textoConfirmar: "Aceptar",
    textoCancelar: "Cancelar",
    destructivo: false,
    onConfirmar: null,
    onCancelar: null,
  });

  const isOrganizador = usuarioActual?.rol === "ORGANIZADOR";

  const handleSolicitarLogout = () => {
    setFeedback({
      visible: true,
      tipo: "confirm",
      destructivo: true,
      titulo: "¿Cerrar Sesión?",
      mensaje: `¿Estás seguro de que deseas salir de tu cuenta (${usuarioActual?.nombreCompleto})?`,
      textoConfirmar: "Cerrar sesión",
      textoCancelar: "Permanecer",
      onConfirmar: () => {
        setFeedback((prev) => ({ ...prev, visible: false }));
        logout();
      },
      onCancelar: () => setFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  return (
    <View style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Logo / Título */}
        <View style={styles.brandRow}>
          <View style={styles.iconCircle}>
            <Ionicons name="ticket" size={20} color={colors.surface} />
          </View>
          <View>
            <Text style={styles.brandTitle}>AI Ticket It</Text>
            <Text style={styles.brandTagline}>Tu pase a los mejores eventos</Text>
          </View>
        </View>

        {/* Acciones del Header */}
        <View style={styles.actionsRight}>
          {/* Botón de Ajustes de Servidor */}
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setModalNetworkVisible(true)}
            activeOpacity={0.7}
            accessibilityLabel="Configuración de Servidor"
          >
            <Ionicons name="server-outline" size={16} color={colors.textMuted} />
          </TouchableOpacity>

          {/* Información del Usuario Activo */}
          <TouchableOpacity
            style={styles.userButton}
            onPress={() => setModalUserVisible(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.userAvatar,
                {
                  backgroundColor: isOrganizador
                    ? colors.primaryLight
                    : colors.secondary + "25",
                },
              ]}
            >
              <Ionicons
                name={isOrganizador ? "briefcase" : "person"}
                size={14}
                color={isOrganizador ? colors.primary : colors.secondary}
              />
            </View>
            <View style={styles.userMeta}>
              <Text style={styles.userName} numberOfLines={1}>
                {usuarioActual ? usuarioActual.nombre : "Cargando..."}
              </Text>
              <Text
                style={[
                  styles.userRole,
                  { color: isOrganizador ? colors.primary : colors.secondary },
                ]}
              >
                {usuarioActual?.rol || ""}
              </Text>
            </View>
          </TouchableOpacity>

          {/* Botón de Cerrar Sesión */}
          <TouchableOpacity
            style={[styles.iconButton, styles.logoutBtn]}
            onPress={handleSolicitarLogout}
            activeOpacity={0.7}
            accessibilityLabel="Cerrar Sesión"
          >
            <Ionicons name="log-out-outline" size={17} color={colors.danger} />
          </TouchableOpacity>
        </View>
      </View>

      <UserSwitcherModal
        visible={modalUserVisible}
        onClose={() => setModalUserVisible(false)}
        onLogoutPrompt={handleSolicitarLogout}
      />

      <NetworkSettingsModal
        visible={modalNetworkVisible}
        onClose={() => setModalNetworkVisible(false)}
        onUrlChanged={() => {
          if (inicializarAuth) inicializarAuth();
        }}
      />

      <FeedbackModal
        visible={feedback.visible}
        tipo={feedback.tipo}
        titulo={feedback.titulo}
        mensaje={feedback.mensaje}
        textoConfirmar={feedback.textoConfirmar}
        textoCancelar={feedback.textoCancelar}
        destructivo={feedback.destructivo}
        onConfirmar={feedback.onConfirmar}
        onCancelar={feedback.onCancelar}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingTop: Platform.OS === "android" ? (StatusBar.currentHeight || 24) + 8 : 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    zIndex: 10,
  },
  container: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  brandRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  brandTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    letterSpacing: -0.3,
  },
  brandTagline: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "500",
  },
  actionsRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutBtn: {
    backgroundColor: colors.dangerLight,
    borderColor: colors.dangerLight,
  },
  userButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    maxWidth: 130,
  },
  userAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 6,
  },
  userMeta: {
    marginRight: 2,
  },
  userName: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  userRole: {
    fontSize: 9,
    fontWeight: "700",
  },
});

export default Header;
