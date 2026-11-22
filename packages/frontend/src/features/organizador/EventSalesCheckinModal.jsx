import React, { useState, useEffect, useCallback } from "react";
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../theme/colors";
import StatusBadge from "../../components/common/StatusBadge";
import FeedbackModal from "../../components/common/FeedbackModal";
import organizadorService from "../../service/organizadorService";
import { useAuth } from "../../context/AuthContext";

export const EventSalesCheckinModal = ({ eventoId, visible, onClose }) => {
  const { usuarioActual } = useAuth();
  const [datos, setDatos] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [accionandoId, setAccionandoId] = useState(null);

  // Chat inline con comprador seleccionado
  const [compraChatSeleccionada, setCompraChatSeleccionada] = useState(null);
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [enviandoMensaje, setEnviandoMensaje] = useState(false);

  // Feedback modal
  const [feedback, setFeedback] = useState({
    visible: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
    textoConfirmar: "Aceptar",
    onConfirmar: null,
  });

  const cargarDatos = useCallback(async () => {
    if (!eventoId) return;
    try {
      setCargando(true);
      const res = await organizadorService.comprasDeEvento(eventoId);
      setDatos(res);
      // Actualizar compra en chat si estaba abierta
      if (compraChatSeleccionada) {
        const actualizada = res.compras?.find((c) => c.id === compraChatSeleccionada.id);
        if (actualizada) setCompraChatSeleccionada(actualizada);
      }
    } catch (err) {
      console.error("Error al cargar ventas del evento:", err);
    } finally {
      setCargando(false);
    }
  }, [eventoId, compraChatSeleccionada?.id]);

  useEffect(() => {
    if (visible && eventoId) {
      cargarDatos();
    }
  }, [visible, eventoId]);

  if (!visible) return null;

  const ejecutarValidarEntrada = async (compraId) => {
    try {
      setFeedback((prev) => ({ ...prev, visible: false }));
      setAccionandoId(compraId);
      await organizadorService.marcarUtilizada(compraId);
      setFeedback({
        visible: true,
        tipo: "success",
        titulo: "¡Entrada Validada!",
        mensaje: "La compra fue registrada como UTILIZADA exitosamente en el control de acceso.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      cargarDatos();
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al validar entrada";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Error al validar",
        mensaje: msg,
        textoConfirmar: "Cerrar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setAccionandoId(null);
    }
  };

  const handleValidarEntrada = (compra) => {
    setFeedback({
      visible: true,
      tipo: "confirm",
      titulo: "¿Validar Ingreso?",
      mensaje: `¿Deseas registrar como UTILIZADA la entrada de ${compra.comprador?.nombreCompleto || "asistente"} (${compra.cantidad} ticket(s) - ${compra.tipoEntrada?.nombre})?`,
      textoConfirmar: "Sí, registrar ingreso",
      textoCancelar: "Cancelar",
      onConfirmar: () => ejecutarValidarEntrada(compra.id),
      onCancelar: () => setFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  const handleEnviarMensajeOrganizador = async () => {
    if (!compraChatSeleccionada || !mensajeTexto.trim()) return;
    try {
      setEnviandoMensaje(true);
      await organizadorService.enviarMensaje(
        compraChatSeleccionada.id,
        mensajeTexto.trim()
      );
      setMensajeTexto("");
      cargarDatos();
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

  const compras = datos?.compras || [];
  const disponibilidad = datos?.disponibilidad || [];
  const evento = datos?.evento;

  const totalRecaudado = compras
    .filter((c) => c.estado === "CONFIRMADA" || c.estado === "UTILIZADA")
    .reduce((acc, c) => acc + (c.total || 0), 0);

  const totalEntradasVendidas = compras
    .filter((c) => c.estado === "CONFIRMADA" || c.estado === "UTILIZADA")
    .reduce((acc, c) => acc + (c.cantidad || 0), 0);

  const formatearFecha = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-AR", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return fechaStr;
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Ventas y Control de Acceso
          </Text>
          <TouchableOpacity onPress={cargarDatos} style={styles.closeBtn}>
            <Ionicons name="refresh" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {cargando ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando ventas y accesos...</Text>
          </View>
        ) : (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            {/* Header del Evento */}
            <View style={styles.eventCard}>
              <Text style={styles.eventName}>{evento?.nombre}</Text>
              <Text style={styles.eventDate}>
                <Ionicons name="calendar-outline" size={13} color={colors.primary} />{" "}
                {formatearFecha(evento?.fecha)}
              </Text>

              {/* Métricas Generales */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Entradas vendidas</Text>
                  <Text style={styles.statValue}>{totalEntradasVendidas}</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Total recaudado</Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    ${totalRecaudado.toLocaleString("es-AR")}
                  </Text>
                </View>
              </View>

              {/* Disponibilidad por Tipo */}
              <Text style={styles.subheading}>Disponibilidad por sector:</Text>
              <View style={styles.disponibilidadList}>
                {disponibilidad.map((tipo) => (
                  <View key={tipo.id} style={styles.disponibilidadItem}>
                    <Text style={styles.tipoNombre}>{tipo.nombre}</Text>
                    <Text style={styles.tipoDetalle}>
                      {tipo.cupoDisponible} libres de {tipo.cupo} (${tipo.precio.toLocaleString("es-AR")})
                    </Text>
                  </View>
                ))}
              </View>
            </View>

            {/* Listado de Compras / Asistentes */}
            <Text style={styles.sectionTitle}>
              Tickets Vendidos ({compras.length})
            </Text>

            {compras.length === 0 ? (
              <View style={styles.noSalesBox}>
                <Ionicons name="receipt-outline" size={40} color={colors.textLight} />
                <Text style={styles.noSalesText}>
                  Aún no se registraron ventas para este evento.
                </Text>
              </View>
            ) : (
              compras.map((compra) => {
                const esConfirmada = compra.estado === "CONFIRMADA";
                const esUtilizada = compra.estado === "UTILIZADA";
                const isChatActive = compraChatSeleccionada?.id === compra.id;

                return (
                  <View key={compra.id} style={styles.compraCard}>
                    <View style={styles.compraHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.compradorNombre}>
                          {compra.comprador?.nombreCompleto || "Comprador"}
                        </Text>
                        <Text style={styles.compraMeta}>
                          {compra.tipoEntrada?.nombre} • {compra.cantidad} entrada(s) • ${compra.total?.toLocaleString("es-AR")}
                        </Text>
                      </View>
                      <StatusBadge estado={compra.estado} />
                    </View>

                    {/* Botones de Acción para Organizador */}
                    <View style={styles.compraActions}>
                      {esConfirmada && (
                        <TouchableOpacity
                          style={styles.checkinBtn}
                          disabled={accionandoId === compra.id}
                          onPress={() => handleValidarEntrada(compra)}
                        >
                          {accionandoId === compra.id ? (
                            <ActivityIndicator size="small" color={colors.surface} />
                          ) : (
                            <>
                              <Ionicons name="checkmark-done" size={16} color={colors.surface} />
                              <Text style={styles.checkinBtnText}>
                                Marcar Utilizada (Check-in)
                              </Text>
                            </>
                          )}
                        </TouchableOpacity>
                      )}

                      {esUtilizada && (
                        <View style={styles.checkedInBadge}>
                          <Ionicons name="checkmark-circle" size={16} color={colors.success} />
                          <Text style={styles.checkedInText}>
                            Entrada ya utilizada en puerta
                          </Text>
                        </View>
                      )}

                      <TouchableOpacity
                        style={[
                          styles.chatToggleBtn,
                          isChatActive && styles.chatToggleBtnActive,
                        ]}
                        onPress={() =>
                          setCompraChatSeleccionada(isChatActive ? null : compra)
                        }
                      >
                        <Ionicons
                          name="chatbubble-ellipses-outline"
                          size={15}
                          color={isChatActive ? colors.surface : colors.primary}
                        />
                        <Text
                          style={[
                            styles.chatToggleBtnText,
                            isChatActive && { color: colors.surface },
                          ]}
                        >
                          {isChatActive
                            ? "Cerrar Chat"
                            : `Chat (${compra.mensajes?.length || 0})`}
                        </Text>
                      </TouchableOpacity>
                    </View>

                    {/* Sección de Chat si está abierto para este ticket */}
                    {isChatActive && (
                      <View style={styles.chatSection}>
                        <Text style={styles.chatSectionTitle}>
                          Canal con {compra.comprador?.nombreCompleto}:
                        </Text>
                        <View style={styles.chatHistory}>
                          {!compra.mensajes || compra.mensajes.length === 0 ? (
                            <Text style={styles.noChatText}>
                              No hay mensajes previos.
                            </Text>
                          ) : (
                            compra.mensajes.map((m) => {
                              const esMio = m.usuario?.id === usuarioActual?.id;
                              return (
                                <View
                                  key={m.id}
                                  style={[
                                    styles.msgBubble,
                                    esMio ? styles.myMsg : styles.theirMsg,
                                  ]}
                                >
                                  <Text
                                    style={[
                                      styles.msgSender,
                                      esMio && { color: "rgba(255,255,255,0.7)" },
                                    ]}
                                  >
                                    {m.usuario?.nombreCompleto}
                                  </Text>
                                  <Text
                                    style={[
                                      styles.msgText,
                                      esMio && { color: colors.surface },
                                    ]}
                                  >
                                    {m.texto}
                                  </Text>
                                </View>
                              );
                            })
                          )}
                        </View>

                        <View style={styles.chatInputRow}>
                          <TextInput
                            style={styles.chatInputField}
                            placeholder="Responder al comprador..."
                            placeholderTextColor={colors.textLight}
                            value={mensajeTexto}
                            onChangeText={setMensajeTexto}
                            maxLength={1000}
                          />
                          <TouchableOpacity
                            style={[
                              styles.sendMsgBtn,
                              (!mensajeTexto.trim() || enviandoMensaje) &&
                                styles.sendMsgBtnDisabled,
                            ]}
                            onPress={handleEnviarMensajeOrganizador}
                            disabled={!mensajeTexto.trim() || enviandoMensaje}
                          >
                            {enviandoMensaje ? (
                              <ActivityIndicator size="small" color={colors.surface} />
                            ) : (
                              <Ionicons name="send" size={16} color={colors.surface} />
                            )}
                          </TouchableOpacity>
                        </View>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>
        )}

        {/* Modal de Feedback */}
        <FeedbackModal
          visible={feedback.visible}
          tipo={feedback.tipo}
          titulo={feedback.titulo}
          mensaje={feedback.mensaje}
          textoConfirmar={feedback.textoConfirmar}
          onConfirmar={feedback.onConfirmar}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: colors.textMuted,
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  eventName: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  eventDate: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 14,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    padding: 12,
    borderRadius: 12,
  },
  statLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginTop: 4,
  },
  subheading: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 8,
  },
  disponibilidadList: {
    gap: 6,
  },
  disponibilidadItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tipoNombre: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  tipoDetalle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  noSalesBox: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 30,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  noSalesText: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 8,
    textAlign: "center",
  },
  compraCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 12,
  },
  compraHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 10,
  },
  compradorNombre: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  compraMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  compraActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  checkinBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: colors.success,
    paddingVertical: 8,
    borderRadius: 10,
  },
  checkinBtnText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  checkedInBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: colors.successLight,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  checkedInText: {
    color: colors.success,
    fontSize: 12,
    fontWeight: "700",
  },
  chatToggleBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
  },
  chatToggleBtnActive: {
    backgroundColor: colors.primary,
  },
  chatToggleBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  chatSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  chatSectionTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 8,
  },
  chatHistory: {
    maxHeight: 180,
    marginBottom: 8,
  },
  noChatText: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
    paddingVertical: 6,
  },
  msgBubble: {
    padding: 8,
    borderRadius: 12,
    marginBottom: 6,
    maxWidth: "85%",
  },
  myMsg: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  theirMsg: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
  },
  msgSender: {
    fontSize: 9,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 2,
  },
  msgText: {
    fontSize: 12,
    color: colors.text,
  },
  chatInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  chatInputField: {
    flex: 1,
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: colors.text,
  },
  sendMsgBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  sendMsgBtnDisabled: {
    backgroundColor: colors.textLight,
  },
});

export default EventSalesCheckinModal;
