import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../../context/AuthContext";
import colors from "../../theme/colors";

export const UserSwitcherModal = ({ visible, onClose, onLogoutPrompt }) => {
  const { usuarioActual, login } = useAuth();

  const usuariosPrueba = [
    {
      nombre: "Sofía Ruiz",
      email: "sofia@aiticket.com",
      password: "password123",
      rol: "COMPRADOR",
    },
    {
      nombre: "Diego Alonso",
      email: "diego@aiticket.com",
      password: "password123",
      rol: "COMPRADOR",
    },
    {
      nombre: "Lucía Gómez",
      email: "lucia@aiticket.com",
      password: "password123",
      rol: "ORGANIZADOR",
    },
    {
      nombre: "Martín Pérez",
      email: "martin@aiticket.com",
      password: "password123",
      rol: "ORGANIZADOR",
    },
  ];

  const handleCambiarAUsuario = async (u) => {
    try {
      await login(u.email, u.password);
      onClose();
    } catch (e) {
      console.warn("Error al cambiar cuenta:", e);
    }
  };

  const isOrganizador = usuarioActual?.rol === "ORGANIZADOR";

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Cuenta Actual</Text>
              <Text style={styles.subtitle}>Sesión autenticada con JWT</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Tarjeta de usuario activo */}
          <View style={styles.currentCard}>
            <View
              style={[
                styles.currentAvatar,
                {
                  backgroundColor: isOrganizador
                    ? colors.primaryLight
                    : colors.secondary + "25",
                },
              ]}
            >
              <Ionicons
                name={isOrganizador ? "briefcase" : "person"}
                size={24}
                color={isOrganizador ? colors.primary : colors.secondary}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.currentName}>{usuarioActual?.nombreCompleto}</Text>
              <Text style={styles.currentEmail}>{usuarioActual?.email || "Sin email"}</Text>
              <View style={styles.roleTag}>
                <Text
                  style={[
                    styles.roleTagText,
                    { color: isOrganizador ? colors.primary : colors.secondary },
                  ]}
                >
                  ROL: {usuarioActual?.rol}
                </Text>
              </View>
            </View>
          </View>

          {/* Botón para Cerrar Sesión */}
          <TouchableOpacity
            style={styles.logoutBtn}
            onPress={() => {
              onClose();
              if (onLogoutPrompt) onLogoutPrompt();
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutBtnText}>Cerrar Sesión</Text>
          </TouchableOpacity>

          {/* Opciones de cambio rápido autenticado */}
          <Text style={styles.sectionHeading}>Cambiar a otra cuenta de prueba:</Text>
          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {usuariosPrueba.map((u) => {
              const isSelected =
                usuarioActual?.email?.toLowerCase() === u.email.toLowerCase();
              const esOrg = u.rol === "ORGANIZADOR";

              return (
                <TouchableOpacity
                  key={u.email}
                  style={[
                    styles.userItem,
                    isSelected && styles.userItemSelected,
                  ]}
                  onPress={() => handleCambiarAUsuario(u)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.avatarMini,
                      {
                        backgroundColor: esOrg
                          ? colors.primaryLight
                          : colors.secondary + "20",
                      },
                    ]}
                  >
                    <Ionicons
                      name={esOrg ? "briefcase-outline" : "person-outline"}
                      size={16}
                      color={esOrg ? colors.primary : colors.secondary}
                    />
                  </View>

                  <View style={styles.userInfo}>
                    <Text style={styles.userNameMini}>{u.nombre}</Text>
                    <Text style={styles.userRoleMini}>{u.rol}</Text>
                  </View>

                  {isSelected && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={colors.primary}
                    />
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    zIndex: 999,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    maxHeight: "85%",
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  currentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  currentAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  currentName: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.text,
  },
  currentEmail: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 1,
  },
  roleTag: {
    alignSelf: "flex-start",
    marginTop: 4,
  },
  roleTagText: {
    fontSize: 10,
    fontWeight: "800",
  },
  logoutBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.dangerLight,
    paddingVertical: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  logoutBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  list: {
    maxHeight: 180,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  userItemSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  avatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 10,
  },
  userInfo: {
    flex: 1,
  },
  userNameMini: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  userRoleMini: {
    fontSize: 11,
    color: colors.textMuted,
  },
});

export default UserSwitcherModal;
