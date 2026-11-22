import React from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../theme/colors";

export const FeedbackModal = ({
  visible,
  tipo = "info", // "success" | "error" | "confirm" | "info"
  titulo,
  mensaje,
  detalles,
  textoConfirmar = "Aceptar",
  textoCancelar = "Cancelar",
  onConfirmar,
  onCancelar,
  destructivo = false,
  cargando = false,
}) => {
  if (!visible) return null;

  const getIcon = () => {
    switch (tipo) {
      case "success":
        return {
          name: "checkmark-circle",
          color: colors.success,
          bg: colors.successLight,
        };
      case "error":
        return {
          name: "alert-circle",
          color: colors.danger,
          bg: colors.dangerLight,
        };
      case "confirm":
        return {
          name: destructivo ? "trash" : "help-circle",
          color: destructivo ? colors.danger : colors.primary,
          bg: destructivo ? colors.dangerLight : colors.primaryLight,
        };
      case "info":
      default:
        return {
          name: "information-circle",
          color: colors.info,
          bg: colors.infoLight,
        };
    }
  };

  const iconConfig = getIcon();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancelar || onConfirmar}
    >
      <Pressable
        style={styles.overlay}
        onPress={tipo === "confirm" ? onCancelar : onConfirmar}
      >
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {/* Icono central */}
          <View style={[styles.iconContainer, { backgroundColor: iconConfig.bg }]}>
            <Ionicons name={iconConfig.name} size={40} color={iconConfig.color} />
          </View>

          {/* Título y Mensaje */}
          {titulo ? <Text style={styles.titulo}>{titulo}</Text> : null}
          {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

          {/* Detalles adicionales opcionales */}
          {detalles ? <View style={styles.detallesBox}>{detalles}</View> : null}

          {/* Botones de acción */}
          <View style={styles.buttonsRow}>
            {tipo === "confirm" && onCancelar ? (
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onCancelar}
                disabled={cargando}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelBtnText}>{textoCancelar}</Text>
              </TouchableOpacity>
            ) : null}

            <TouchableOpacity
              style={[
                styles.confirmBtn,
                destructivo
                  ? styles.confirmBtnDestructive
                  : tipo === "success"
                  ? styles.confirmBtnSuccess
                  : styles.confirmBtnPrimary,
                tipo === "confirm" && { flex: 1 },
              ]}
              onPress={onConfirmar}
              disabled={cargando}
              activeOpacity={0.8}
            >
              {cargando ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <Text style={styles.confirmBtnText}>{textoConfirmar}</Text>
              )}
            </TouchableOpacity>
          </View>
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
    padding: 24,
    zIndex: 9999,
  },
  card: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 10,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  titulo: {
    fontSize: 19,
    fontWeight: "800",
    color: colors.text,
    textAlign: "center",
    marginBottom: 8,
  },
  mensaje: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 16,
  },
  detallesBox: {
    width: "100%",
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    marginBottom: 18,
  },
  buttonsRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 14,
    backgroundColor: colors.surfaceAlt,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.textMuted,
  },
  confirmBtn: {
    width: "100%",
    paddingVertical: 13,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnPrimary: {
    backgroundColor: colors.primary,
  },
  confirmBtnSuccess: {
    backgroundColor: colors.success,
  },
  confirmBtnDestructive: {
    backgroundColor: colors.danger,
  },
  confirmBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default FeedbackModal;
