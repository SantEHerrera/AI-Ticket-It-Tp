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
import RatingStars from "../../components/common/RatingStars";
import FeedbackModal from "../../components/common/FeedbackModal";
import compradorService from "../../service/compradorService";

export const ReviewModal = ({ compra, visible, onClose, onReseniaEnviada }) => {
  const [puntuacion, setPuntuacion] = useState(5);
  const [detalle, setDetalle] = useState("");
  const [enviando, setEnviando] = useState(false);

  const [feedback, setFeedback] = useState({
    visible: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
    textoConfirmar: "Aceptar",
    onConfirmar: null,
  });

  if (!visible || !compra) return null;

  const handleSubmit = async () => {
    if (!detalle.trim()) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Comentario requerido",
        mensaje: "Por favor escribe unas líneas contando tu experiencia en el evento.",
        textoConfirmar: "Entendido",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    try {
      setEnviando(true);
      const compraActualizada = await compradorService.crearResenia(compra.id, {
        puntuacion,
        detalle: detalle.trim(),
      });

      setFeedback({
        visible: true,
        tipo: "success",
        titulo: "¡Gracias por tu opinión!",
        mensaje: "Tu reseña y puntuación fueron registradas con éxito.",
        textoConfirmar: "Genial",
        onConfirmar: () => {
          setFeedback((prev) => ({ ...prev, visible: false }));
          setDetalle("");
          onClose();
          if (onReseniaEnviada) onReseniaEnviada(compraActualizada);
        },
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al enviar la reseña";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Error al calificar",
        mensaje: msg,
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setEnviando(false);
    }
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
            <Text style={styles.title}>Calificar Experiencia</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={colors.textMuted} />
            </TouchableOpacity>
          </View>

          <Text style={styles.eventName}>{compra.evento?.nombre}</Text>
          <Text style={styles.subtitle}>
            ¿Cómo estuvo el evento y la organización?
          </Text>

          {/* Selector de Estrellas */}
          <View style={styles.starsContainer}>
            <RatingStars
              puntuacion={puntuacion}
              size={36}
              interactivo
              onChange={(val) => setPuntuacion(val)}
            />
            <Text style={styles.puntuacionLabel}>
              {puntuacion === 5
                ? "¡Excelente!"
                : puntuacion === 4
                ? "Muy bueno"
                : puntuacion === 3
                ? "Regular"
                : puntuacion === 2
                ? "Malo"
                : "Muy malo"}
            </Text>
          </View>

          {/* Campo de Comentario */}
          <TextInput
            style={styles.input}
            placeholder="Cuenta qué tal fue el acceso, la puntualidad, el sonido..."
            placeholderTextColor={colors.textLight}
            value={detalle}
            onChangeText={setDetalle}
            maxLength={1000}
            multiline
            numberOfLines={4}
          />

          {/* Botón de Envío */}
          <TouchableOpacity
            style={[styles.submitBtn, enviando && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={enviando}
          >
            {enviando ? (
              <ActivityIndicator color={colors.surface} />
            ) : (
              <Text style={styles.submitBtnText}>Publicar Calificación</Text>
            )}
          </TouchableOpacity>
        </Pressable>
      </Pressable>

      <FeedbackModal
        visible={feedback.visible}
        tipo={feedback.tipo}
        titulo={feedback.titulo}
        mensaje={feedback.mensaje}
        textoConfirmar={feedback.textoConfirmar}
        onConfirmar={feedback.onConfirmar}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  title: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  eventName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  starsContainer: {
    alignItems: "center",
    paddingVertical: 10,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    marginBottom: 16,
  },
  puntuacionLabel: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: "700",
    color: "#B45309",
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 12,
    fontSize: 14,
    color: colors.text,
    textAlignVertical: "top",
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  submitBtnDisabled: {
    backgroundColor: colors.textLight,
  },
  submitBtnText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
});

export default ReviewModal;
