import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import StatusBadge from "../../components/common/StatusBadge";
import RatingStars from "../../components/common/RatingStars";
import FeedbackModal from "../../components/common/FeedbackModal";
import compradorService from "../../service/compradorService";
import { useAuth } from "../../context/AuthContext";

export const PurchaseDetailModal = ({
  compra,
  visible,
  onClose,
  onCompraActualizada,
  onAbrirResenia,
}) => {
  const { usuarioActual } = useAuth();
  const insets = useSafeAreaInsets();
  const [compraActual, setCompraActual] = useState(compra);
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);
  const [procesandoAccion, setProcesandoAccion] = useState(false);

  // Feedback modal
  const [feedback, setFeedback] = useState({
    visible: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
    textoConfirmar: "Aceptar",
    textoCancelar: "Cancelar",
    onConfirmar: null,
    onCancelar: null,
    destructivo: false,
    cargando: false,
  });

  useEffect(() => {
    setCompraActual(compra);
  }, [compra]);

  if (!visible || !compraActual) return null;

  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  const ejecutarPago = async () => {
    try {
      setFeedback((prev) => ({ ...prev, cargando: true }));
      setProcesandoAccion(true);
      const actualizada = await compradorService.pagarCompra(compraActual.id);
      setCompraActual(actualizada);
      if (onCompraActualizada) onCompraActualizada(actualizada);

      setFeedback({
        visible: true,
        tipo: "success",
        titulo: "¡Pago Confirmado!",
        mensaje: "Tu compra ha sido confirmada exitosamente. Tu entrada está lista para el evento.",
        textoConfirmar: "Genial",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al procesar el pago";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Error al pagar",
        mensaje: msg,
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handlePagar = () => {
    setFeedback({
      visible: true,
      tipo: "confirm",
      titulo: "¿Confirmar Pago de Entradas?",
      mensaje: `¿Deseas confirmar el pago de $${compraActual.total?.toLocaleString("es-AR")} para tus entradas de "${compraActual.evento?.nombre}"?`,
      textoConfirmar: "Sí, pagar ahora",
      textoCancelar: "Volver",
      onConfirmar: ejecutarPago,
      onCancelar: () => setFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  const ejecutarCancelacion = async () => {
    try {
      setFeedback((prev) => ({ ...prev, cargando: true }));
      setProcesandoAccion(true);
      const actualizada = await compradorService.cancelarCompra(compraActual.id);
      setCompraActual(actualizada);
      if (onCompraActualizada) onCompraActualizada(actualizada);

      setFeedback({
        visible: true,
        tipo: "success",
        titulo: "Compra Cancelada",
        mensaje: "La compra fue cancelada exitosamente y los cupos reservados fueron liberados.",
        textoConfirmar: "Entendido",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al cancelar";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "No se pudo cancelar",
        mensaje: msg,
        textoConfirmar: "Cerrar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setProcesandoAccion(false);
    }
  };

  const handleSolicitarCancelacion = () => {
    setFeedback({
      visible: true,
      tipo: "confirm",
      titulo: "¿Cancelar Compra?",
      mensaje: `¿Estás seguro de que deseas cancelar la compra para "${compraActual.evento?.nombre}"? Se liberará el cupo reservado.`,
      textoConfirmar: "Sí, cancelar",
      textoCancelar: "No cancelar",
      destructivo: true,
      onConfirmar: ejecutarCancelacion,
      onCancelar: () => setFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  const handleEnviarMensaje = async () => {
    const texto = mensajeTexto.trim();
    if (!texto) return;

    try {
      setEnviandoMensaje(true);
      const actualizada = await compradorService.enviarMensaje(compraActual.id, texto);
      setCompraActual(actualizada);
      setMensajeTexto("");
      if (onCompraActualizada) onCompraActualizada(actualizada);
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al enviar mensaje";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Error al enviar mensaje",
        mensaje: msg,
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setEnviandoMensaje(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle}>Ticket #{compraActual.id}</Text>
          <View style={{ width: 32 }} />
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Tarjeta Tipo Ticket */}
          <View style={styles.ticketCard}>
            <View style={styles.ticketHeader}>
              <View style={{ flex: 1, marginRight: 8 }}>
                <Text style={styles.eventName}>{compraActual.evento?.nombre}</Text>
                <Text style={styles.eventDate}>
                  <Ionicons name="calendar-outline" size={13} color={colors.primary} />{" "}
                  {formatearFecha(compraActual.evento?.fecha)}
                </Text>
              </View>
              <StatusBadge estado={compraActual.estado} />
            </View>

            <View style={styles.ticketDivider}>
              <View style={styles.notchLeft} />
              <View style={styles.dashedLine} />
              <View style={styles.notchRight} />
            </View>

            <View style={styles.ticketDetails}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo de entrada</Text>
                <Text style={styles.detailValue}>
                  {compraActual.tipoEntrada?.nombre}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Cantidad</Text>
                <Text style={styles.detailValue}>
                  {compraActual.cantidad} ticket(s)
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Total</Text>
                <Text style={styles.totalValue}>
                  ${compraActual.total?.toLocaleString("es-AR")}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Organizador</Text>
                <Text style={styles.detailValue}>
                  {compraActual.evento?.organizador?.nombreCompleto}
                </Text>
              </View>

              {compraActual.diasHastaEvento !== null && (
                <View style={styles.countdownBox}>
                  <Ionicons name="time" size={16} color={colors.primaryDark} />
                  <Text style={styles.countdownText}>
                    {compraActual.diasHastaEvento === 0
                      ? "¡El evento es hoy!"
                      : `Faltan ${compraActual.diasHastaEvento} días para el evento`}
                  </Text>
                </View>
              )}
            </View>

            {/* Acciones de la Compra */}
            <View style={styles.ticketActions}>
              {compraActual.estado === "PENDIENTE" && (
                <TouchableOpacity
                  style={styles.payBtn}
                  onPress={handlePagar}
                  disabled={procesandoAccion}
                  activeOpacity={0.8}
                >
                  {procesandoAccion ? (
                    <ActivityIndicator color={colors.surface} />
                  ) : (
                    <>
                      <Ionicons name="card-outline" size={18} color={colors.surface} />
                      <Text style={styles.payBtnText}>Confirmar y Pagar</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {compraActual.puedeCancelarse && (
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={handleSolicitarCancelacion}
                  disabled={procesandoAccion}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cancelBtnText}>Cancelar Compra</Text>
                </TouchableOpacity>
              )}

              {compraActual.puedeReseniarse && (
                <TouchableOpacity
                  style={styles.reviewBtn}
                  onPress={() => {
                    if (onAbrirResenia) onAbrirResenia(compraActual);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="star" size={16} color="#F59E0B" />
                  <Text style={styles.reviewBtnText}>Calificar Experiencia</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Reseña Existente */}
          {compraActual.resenia && (
            <View style={styles.reseniaCard}>
              <View style={styles.reseniaHeader}>
                <Text style={styles.reseniaTitle}>Tu reseña sobre el evento</Text>
                <RatingStars puntuacion={compraActual.resenia.puntuacion} size={15} />
              </View>
              <Text style={styles.reseniaComment}>
                &ldquo;{compraActual.resenia.detalle}&rdquo;
              </Text>
            </View>
          )}

          {/* Historial de Cambios de Estado */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Historial del ticket</Text>
            <View style={styles.timeline}>
              {compraActual.historial?.map((h, idx) => (
                <View key={idx} style={styles.timelineItem}>
                  <View style={styles.timelineDot} />
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineEstado}>
                      Estado: {h.estado}
                    </Text>
                    <Text style={styles.timelineFecha}>
                      {formatearFecha(h.fechaHora)} • Por {h.quien?.nombreCompleto || "Sistema"}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>

          {/* Canal de Comunicación con el Organizador */}
          <View style={styles.section}>
            <View style={styles.chatHeader}>
              <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
              <View style={{ flex: 1, marginLeft: 8 }}>
                <Text style={styles.sectionTitle}>Comunicación con Organizador</Text>
                <Text style={styles.chatSubtitle}>
                  Preguntas sobre accesos, horarios o cambios
                </Text>
              </View>
            </View>

            <View style={styles.messagesBox}>
              {!compraActual.mensajes || compraActual.mensajes.length === 0 ? (
                <View style={styles.noMessages}>
                  <Text style={styles.noMessagesText}>
                    No hay mensajes aún. Escribe al organizador si tienes alguna duda.
                  </Text>
                </View>
              ) : (
                compraActual.mensajes.map((m) => {
                  const esMio = m.usuario?.id === usuarioActual?.id;
                  return (
                    <View
                      key={m.id}
                      style={[
                        styles.messageBubble,
                        esMio ? styles.myMessage : styles.theirMessage,
                      ]}
                    >
                      <Text
                        style={[
                          styles.messageSender,
                          esMio ? styles.myMessageSender : styles.theirMessageSender,
                        ]}
                      >
                        {m.usuario?.nombreCompleto} ({m.usuario?.rol})
                      </Text>
                      <Text
                        style={[
                          styles.messageText,
                          esMio ? styles.myMessageText : styles.theirMessageText,
                        ]}
                      >
                        {m.texto}
                      </Text>
                      <Text
                        style={[
                          styles.messageTime,
                          esMio ? styles.myMessageTime : styles.theirMessageTime,
                        ]}
                      >
                        {formatearFecha(m.enviado)}
                      </Text>
                    </View>
                  );
                })
              )}
            </View>
          </View>
        </ScrollView>

        {/* Input de Mensaje de Chat */}
        <View
          style={[
            styles.chatInputBar,
            { paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 26 : 10) },
          ]}
        >
          <TextInput
            style={styles.chatInput}
            placeholder="Escribe un mensaje al organizador..."
            placeholderTextColor={colors.textLight}
            value={mensajeTexto}
            onChangeText={setMensajeTexto}
            maxLength={1000}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendBtn,
              (!mensajeTexto.trim() || enviandoMensaje) && styles.sendBtnDisabled,
            ]}
            onPress={handleEnviarMensaje}
            disabled={!mensajeTexto.trim() || enviandoMensaje}
          >
            {enviandoMensaje ? (
              <ActivityIndicator size="small" color={colors.surface} />
            ) : (
              <Ionicons name="send" size={18} color={colors.surface} />
            )}
          </TouchableOpacity>
        </View>

        {/* Modal de Feedback personalizado */}
        <FeedbackModal
          visible={feedback.visible}
          tipo={feedback.tipo}
          titulo={feedback.titulo}
          mensaje={feedback.mensaje}
          textoConfirmar={feedback.textoConfirmar}
          textoCancelar={feedback.textoCancelar}
          destructivo={feedback.destructivo}
          cargando={feedback.cargando}
          onConfirmar={feedback.onConfirmar}
          onCancelar={feedback.onCancelar}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  closeBtn: {
    padding: 4,
  },
  scroll: {
    flex: 1,
    padding: 16,
  },
  ticketCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  ticketHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    padding: 16,
  },
  eventName: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
  },
  ticketDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 4,
    position: "relative",
  },
  notchLeft: {
    width: 14,
    height: 28,
    backgroundColor: colors.background,
    borderTopRightRadius: 14,
    borderBottomRightRadius: 14,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: colors.border,
  },
  dashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: "dashed",
  },
  notchRight: {
    width: 14,
    height: 28,
    backgroundColor: colors.background,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
    borderWidth: 1,
    borderRightWidth: 0,
    borderColor: colors.border,
  },
  ticketDetails: {
    padding: 16,
    gap: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  detailLabel: {
    fontSize: 13,
    color: colors.textMuted,
  },
  detailValue: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.primaryLight,
    padding: 8,
    borderRadius: 8,
    marginTop: 6,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  ticketActions: {
    padding: 16,
    paddingTop: 8,
    gap: 8,
  },
  payBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.success,
    paddingVertical: 12,
    borderRadius: 12,
  },
  payBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  cancelBtn: {
    alignItems: "center",
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: colors.dangerLight,
    borderWidth: 1,
    borderColor: "rgba(239, 68, 68, 0.2)",
  },
  cancelBtnText: {
    color: colors.danger,
    fontSize: 13,
    fontWeight: "700",
  },
  reviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.warningLight,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  reviewBtnText: {
    color: "#B45309",
    fontSize: 14,
    fontWeight: "700",
  },
  reseniaCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  reseniaHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  reseniaTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  reseniaComment: {
    fontSize: 13,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },
  timeline: {
    paddingLeft: 4,
  },
  timelineItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
    marginTop: 4,
    marginRight: 10,
  },
  timelineContent: {
    flex: 1,
  },
  timelineEstado: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  timelineFecha: {
    fontSize: 11,
    color: colors.textMuted,
  },
  chatHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  chatSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
  },
  messagesBox: {
    maxHeight: 250,
  },
  noMessages: {
    padding: 16,
    alignItems: "center",
  },
  noMessagesText: {
    fontSize: 12,
    color: colors.textMuted,
    textAlign: "center",
  },
  messageBubble: {
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    maxWidth: "85%",
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  messageSender: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
  },
  myMessageSender: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  theirMessageSender: {
    color: colors.primary,
  },
  messageText: {
    fontSize: 13,
    lineHeight: 18,
  },
  myMessageText: {
    color: colors.surface,
  },
  theirMessageText: {
    color: colors.text,
  },
  messageTime: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myMessageTime: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  theirMessageTime: {
    color: colors.textMuted,
  },
  chatInputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  chatInput: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
    maxHeight: 100,
  },
  sendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendBtnDisabled: {
    backgroundColor: colors.textLight,
  },
});

export default PurchaseDetailModal;
