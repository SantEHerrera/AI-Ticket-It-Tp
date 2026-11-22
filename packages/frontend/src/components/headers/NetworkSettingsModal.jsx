import React, { useState } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../theme/colors";
import { getApiBaseURL, setApiBaseURL } from "../../service/api";
import axios from "axios";

export const NetworkSettingsModal = ({ visible, onClose, onUrlChanged }) => {
  const [url, setUrl] = useState(getApiBaseURL());
  const [probando, setProbando] = useState(false);
  const [resultado, setResultado] = useState(null); // { exito: boolean, mensaje: string }

  const handleProbarConexion = async () => {
    try {
      setProbando(true);
      setResultado(null);
      const cleanUrl = url.trim().replace(/\/+$/, "");
      const testUrl = cleanUrl.endsWith("/api")
        ? `${cleanUrl}/health`
        : `${cleanUrl}/api/health`;

      await axios.get(testUrl, { timeout: 4000 });
      setResultado({
        exito: true,
        mensaje: "¡Conexión exitosa con el servidor backend!",
      });
    } catch (err) {
      setResultado({
        exito: false,
        mensaje: `No se pudo conectar: ${err.message}. Verifica que la PC y el celular estén en la misma red Wi-Fi.`,
      });
    } finally {
      setProbando(false);
    }
  };

  const handleGuardar = () => {
    const cleanUrl = url.trim().replace(/\/+$/, "");
    const finalUrl = cleanUrl.endsWith("/api") ? cleanUrl : `${cleanUrl}/api`;
    setApiBaseURL(finalUrl);
    if (onUrlChanged) onUrlChanged(finalUrl);
    onClose();
  };

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
            <View style={{ flex: 1 }}>
              <Text style={styles.title}>Conexión con el Servidor</Text>
              <Text style={styles.subtitle}>
                Configura la IP de tu PC para probar en Expo Go
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.label}>URL Base del Backend:</Text>
          <TextInput
            style={styles.input}
            value={url}
            onChangeText={(txt) => {
              setUrl(txt);
              setResultado(null);
            }}
            placeholder="http://192.168.0.XX:8000/api"
            placeholderTextColor={colors.textLight}
            autoCapitalize="none"
            autoCorrect={false}
          />

          <View style={styles.infoBox}>
            <Ionicons name="wifi-outline" size={16} color={colors.primary} />
            <Text style={styles.infoText}>
              Para usar Expo Go en tu celular, ambos dispositivos deben estar conectados al mismo Wi-Fi.
            </Text>
          </View>

          {resultado && (
            <View
              style={[
                styles.resultBox,
                resultado.exito ? styles.resultSuccess : styles.resultError,
              ]}
            >
              <Ionicons
                name={resultado.exito ? "checkmark-circle" : "alert-circle"}
                size={18}
                color={resultado.exito ? colors.success : colors.danger}
              />
              <Text
                style={[
                  styles.resultText,
                  { color: resultado.exito ? colors.success : colors.danger },
                ]}
              >
                {resultado.mensaje}
              </Text>
            </View>
          )}

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.testBtn}
              onPress={handleProbarConexion}
              disabled={probando}
            >
              {probando ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="flash-outline" size={16} color={colors.primary} />
                  <Text style={styles.testBtnText}>Probar</Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar}>
              <Text style={styles.saveBtnText}>Guardar URL</Text>
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
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 22,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
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
  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: colors.primaryDark,
    lineHeight: 16,
  },
  resultBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  resultSuccess: {
    backgroundColor: colors.successLight,
  },
  resultError: {
    backgroundColor: colors.dangerLight,
  },
  resultText: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
  },
  actionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  testBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  testBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  saveBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default NetworkSettingsModal;
