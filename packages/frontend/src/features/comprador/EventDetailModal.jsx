import React, { useState, useEffect } from "react";
import {
  Modal,
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../theme/colors";
import RatingStars from "../../components/common/RatingStars";
import FeedbackModal from "../../components/common/FeedbackModal";
import compradorService from "../../service/compradorService";
import { useAuth } from "../../context/AuthContext";

export const EventDetailModal = ({
  evento: eventoProp,
  visible,
  onClose,
  esFavorito,
  onToggleFavorito,
  onCompraExitosa,
}) => {
  const { isComprador } = useAuth();
  const insets = useSafeAreaInsets();
  const [evento, setEvento] = useState(eventoProp);
  const [tipoSeleccionado, setTipoSeleccionado] = useState(null);
  const [cantidad, setCantidad] = useState(1);
  const [comprando, setComprando] = useState(false);

  // Estado del modal de feedback
  const [feedback, setFeedback] = useState({
    visible: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
    detalles: null,
    textoConfirmar: "Aceptar",
    textoCancelar: "Cancelar",
    onConfirmar: null,
    onCancelar: null,
  });

  // Sincronizar evento si cambian las props
  useEffect(() => {
    setEvento(eventoProp);
    if (eventoProp?.tiposEntrada && eventoProp.tiposEntrada.length > 0) {
      setTipoSeleccionado(eventoProp.tiposEntrada[0]);
      setCantidad(1);
    } else {
      setTipoSeleccionado(null);
    }
  }, [eventoProp]);

  if (!visible || !evento) return null;

  const imagenUrl =
    evento.multimedia && evento.multimedia.length > 0
      ? evento.multimedia[0]
      : "https://picsum.photos/seed/detail/800/400";

  const total = (tipoSeleccionado?.precio || 0) * cantidad;

  const handleIncrementar = () => {
    if (tipoSeleccionado && cantidad < tipoSeleccionado.cupoDisponible) {
      setCantidad((prev) => prev + 1);
    }
  };

  const handleDecrementar = () => {
    if (cantidad > 1) {
      setCantidad((prev) => prev - 1);
    }
  };

  const ejecutarCompra = async () => {
    try {
      setComprando(true);
      const compra = await compradorService.crearCompra({
        eventoId: evento.id,
        tipoEntradaId: tipoSeleccionado.id,
        cantidad,
      });

      // Actualizar visualmente el cupo en el estado local de forma inmediata
      const nuevoCupo = Math.max(0, tipoSeleccionado.cupoDisponible - cantidad);
      setTipoSeleccionado((prev) => (prev ? { ...prev, cupoDisponible: nuevoCupo } : prev));
      setEvento((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tiposEntrada: prev.tiposEntrada.map((t) =>
            t.id === tipoSeleccionado.id ? { ...t, cupoDisponible: nuevoCupo } : t
          ),
        };
      });

      // Resetear selector de cantidad
      setCantidad(1);

      // Mostrar modal de confirmación enriquecido
      setFeedback({
        visible: true,
        tipo: "success",
        titulo: "¡Reserva Creada con Éxito!",
        mensaje: `Has adquirido tus entradas para "${evento.nombre}". Tu compra se encuentra registrada como PENDIENTE de pago.`,
        detalles: (
          <View>
            <Text style={styles.feedbackItem}>
              <Text style={{ fontWeight: "700" }}>Sector:</Text> {tipoSeleccionado.nombre}
            </Text>
            <Text style={styles.feedbackItem}>
              <Text style={{ fontWeight: "700" }}>Cantidad:</Text> {cantidad} ticket(s)
            </Text>
            <Text style={styles.feedbackItem}>
              <Text style={{ fontWeight: "700" }}>Total:</Text> ${total.toLocaleString("es-AR")}
            </Text>
            <Text style={styles.feedbackItem}>
              <Text style={{ fontWeight: "700" }}>Cupo restante:</Text> {nuevoCupo} disponibles
            </Text>
          </View>
        ),
        textoConfirmar: "Ir a Mis Compras y Pagar",
        textoCancelar: "Seguir Explorando",
        onConfirmar: () => {
          setFeedback((prev) => ({ ...prev, visible: false }));
          onClose();
          if (onCompraExitosa) onCompraExitosa(compra, true);
        },
        onCancelar: () => {
          // Sólo cierra el FeedbackModal, el usuario sigue en el detalle del evento
          setFeedback((prev) => ({ ...prev, visible: false }));
          if (onCompraExitosa) onCompraExitosa(compra, false);
        },
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al realizar la compra";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "No se pudo completar la compra",
        mensaje: msg,
        textoConfirmar: "Cerrar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setComprando(false);
    }
  };

  const handleComprar = () => {
    if (!isComprador) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Acción no permitida",
        mensaje: "Debes iniciar sesión con un usuario de rol COMPRADOR para adquirir entradas.",
        textoConfirmar: "Entendido",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (!tipoSeleccionado) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Selección requerida",
        mensaje: "Por favor elige un tipo de entrada antes de continuar.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (tipoSeleccionado.cupoDisponible < cantidad) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Cupo insuficiente",
        mensaje: `Solo quedan ${tipoSeleccionado.cupoDisponible} entrada(s) disponibles para este sector.`,
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    // Modal de confirmación previa para evitar compras accidentales
    setFeedback({
      visible: true,
      tipo: "confirm",
      titulo: "¿Confirmar Compra de Entradas?",
      mensaje: `¿Deseas confirmar la compra de tus entradas para "${evento.nombre}"?`,
      detalles: (
        <View>
          <Text style={styles.feedbackItem}>
            <Text style={{ fontWeight: "700" }}>Sector:</Text> {tipoSeleccionado.nombre}
          </Text>
          <Text style={styles.feedbackItem}>
            <Text style={{ fontWeight: "700" }}>Cantidad:</Text> {cantidad} entrada(s)
          </Text>
          <Text style={styles.feedbackItem}>
            <Text style={{ fontWeight: "700" }}>Precio unitario:</Text> ${tipoSeleccionado.precio.toLocaleString("es-AR")}
          </Text>
          <Text style={[styles.feedbackItem, { fontSize: 14, marginTop: 4 }]}>
            <Text style={{ fontWeight: "800", color: colors.primary }}>Total a pagar:</Text>{" "}
            ${total.toLocaleString("es-AR")}
          </Text>
        </View>
      ),
      textoConfirmar: "Sí, confirmar compra",
      textoCancelar: "Revisar",
      onConfirmar: ejecutarCompra,
      onCancelar: () => setFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  const formatearFechaCompleta = (fechaStr) => {
    try {
      const fecha = new Date(fechaStr);
      return fecha.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
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
        {/* Header de la Modal */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onClose} style={styles.iconBtn}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            Detalle del Evento
          </Text>
          {onToggleFavorito && (
            <TouchableOpacity
              onPress={() => onToggleFavorito(evento.id)}
              style={styles.iconBtn}
            >
              <Ionicons
                name={esFavorito ? "heart" : "heart-outline"}
                size={24}
                color={esFavorito ? colors.danger : colors.text}
              />
            </TouchableOpacity>
          )}
        </View>

        <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Imagen Principal */}
          <View style={styles.imageBox}>
            <Image
              source={{ uri: imagenUrl }}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryBadgeText}>
                {evento.categoria?.nombre || "Evento"}
              </Text>
            </View>
          </View>

          {/* Información Principal */}
          <View style={styles.content}>
            <Text style={styles.title}>{evento.nombre}</Text>

            <View style={styles.metaRow}>
              <Ionicons name="calendar" size={16} color={colors.primary} />
              <Text style={styles.metaText}>
                {formatearFechaCompleta(evento.fecha)}
              </Text>
            </View>

            {evento.diasHastaEvento !== null && !evento.yaSeRealizo && (
              <View style={styles.countdownBox}>
                <Ionicons name="alarm-outline" size={18} color={colors.primaryDark} />
                <Text style={styles.countdownText}>
                  Faltan {evento.diasHastaEvento} días para el inicio
                </Text>
              </View>
            )}

            <Text style={styles.sectionHeading}>Descripción</Text>
            <Text style={styles.description}>{evento.descripcion}</Text>

            {/* Organizador y Reputación */}
            <View style={styles.organizerCard}>
              <View style={styles.organizerHeader}>
                <View style={styles.organizerAvatar}>
                  <Ionicons name="briefcase" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.organizerSubtitle}>Organizado por</Text>
                  <Text style={styles.organizerName}>
                    {evento.organizador?.nombreCompleto}
                  </Text>
                </View>
                <RatingStars
                  puntuacion={evento.organizador?.puntajePromedio || 0}
                  cantidadResenias={evento.organizador?.cantidadResenias}
                  size={15}
                  mostrarNumero
                />
              </View>

              {/* Lista de Reseñas previas */}
              {evento.reseniasOrganizador && evento.reseniasOrganizador.length > 0 && (
                <View style={styles.reviewsList}>
                  <Text style={styles.reviewsTitle}>Opiniones de asistentes:</Text>
                  {evento.reseniasOrganizador.slice(0, 3).map((r) => (
                    <View key={r.id} style={styles.reviewItem}>
                      <View style={styles.reviewUserRow}>
                        <Text style={styles.reviewUser}>
                          {r.comprador?.nombre || "Asistente"}
                        </Text>
                        <RatingStars puntuacion={r.puntuacion} size={12} />
                      </View>
                      <Text style={styles.reviewComment}>&ldquo;{r.detalle}&rdquo;</Text>
                    </View>
                  ))}
                </View>
              )}
            </View>

            {/* Selector de Tipos de Entrada */}
            {!evento.yaSeRealizo && (
              <View style={styles.ticketsSection}>
                <Text style={styles.sectionHeading}>Selecciona tu entrada</Text>

                {evento.tiposEntrada?.map((tipo) => {
                  const isSelected = tipoSeleccionado?.id === tipo.id;
                  const agotada = tipo.cupoDisponible <= 0;

                  return (
                    <TouchableOpacity
                      key={tipo.id}
                      disabled={agotada}
                      style={[
                        styles.ticketOption,
                        isSelected && styles.ticketOptionSelected,
                        agotada && styles.ticketOptionDisabled,
                      ]}
                      onPress={() => {
                        setTipoSeleccionado(tipo);
                        setCantidad(1);
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ flex: 1 }}>
                        <View style={styles.ticketHeaderRow}>
                          <Text style={styles.ticketName}>{tipo.nombre}</Text>
                          <Text style={styles.ticketPrice}>
                            ${tipo.precio.toLocaleString("es-AR")}
                          </Text>
                        </View>
                        {tipo.descripcion ? (
                          <Text style={styles.ticketDesc}>
                            {tipo.descripcion}
                          </Text>
                        ) : null}
                        <Text
                          style={[
                            styles.cupoText,
                            agotada && { color: colors.danger, fontWeight: "700" },
                          ]}
                        >
                          {agotada
                            ? "Entradas agotadas"
                            : `Disponibles: ${tipo.cupoDisponible} de ${tipo.cupo}`}
                        </Text>
                      </View>
                      <View style={styles.radioCircle}>
                        {isSelected && <View style={styles.radioInner} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}

                {/* Cantidad */}
                {tipoSeleccionado && tipoSeleccionado.cupoDisponible > 0 && (
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityLabel}>Cantidad de entradas:</Text>
                    <View style={styles.quantityCounter}>
                      <TouchableOpacity
                        style={[
                          styles.qtyBtn,
                          cantidad <= 1 && styles.qtyBtnDisabled,
                        ]}
                        onPress={handleDecrementar}
                        disabled={cantidad <= 1}
                      >
                        <Ionicons
                          name="remove"
                          size={18}
                          color={cantidad <= 1 ? colors.textLight : colors.text}
                        />
                      </TouchableOpacity>
                      <Text style={styles.qtyText}>{cantidad}</Text>
                      <TouchableOpacity
                        style={[
                          styles.qtyBtn,
                          cantidad >= tipoSeleccionado.cupoDisponible &&
                            styles.qtyBtnDisabled,
                        ]}
                        onPress={handleIncrementar}
                        disabled={cantidad >= tipoSeleccionado.cupoDisponible}
                      >
                        <Ionicons
                          name="add"
                          size={18}
                          color={
                            cantidad >= tipoSeleccionado.cupoDisponible
                              ? colors.textLight
                              : colors.text
                          }
                        />
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Barra Inferior Fija para Comprar */}
        {!evento.yaSeRealizo && (
          <View
            style={[
              styles.checkoutBar,
              { paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 28 : 14) },
            ]}
          >
            <View>
              <Text style={styles.checkoutTotalLabel}>Total a pagar</Text>
              <Text style={styles.checkoutTotalValue}>
                ${total.toLocaleString("es-AR")}
              </Text>
            </View>

            <TouchableOpacity
              style={[
                styles.buyButton,
                (!tipoSeleccionado ||
                  tipoSeleccionado.cupoDisponible <= 0 ||
                  comprando) &&
                  styles.buyButtonDisabled,
              ]}
              disabled={
                !tipoSeleccionado ||
                tipoSeleccionado.cupoDisponible <= 0 ||
                comprando
              }
              onPress={handleComprar}
              activeOpacity={0.8}
            >
              {comprando ? (
                <ActivityIndicator color={colors.surface} />
              ) : (
                <>
                  <Ionicons name="cart-outline" size={20} color={colors.surface} />
                  <Text style={styles.buyButtonText}>Comprar Entradas</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Modal de Feedback personalizado */}
        <FeedbackModal
          visible={feedback.visible}
          tipo={feedback.tipo}
          titulo={feedback.titulo}
          mensaje={feedback.mensaje}
          detalles={feedback.detalles}
          textoConfirmar={feedback.textoConfirmar}
          textoCancelar={feedback.textoCancelar}
          onConfirmar={feedback.onConfirmar}
          onCancelar={feedback.onCancelar}
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
    paddingVertical: 12,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
    textAlign: "center",
  },
  iconBtn: {
    padding: 6,
  },
  scroll: {
    flex: 1,
  },
  imageBox: {
    width: "100%",
    height: 220,
    backgroundColor: colors.surfaceAlt,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  categoryBadgeText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  metaText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: "600",
  },
  countdownBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    padding: 10,
    borderRadius: 12,
    marginBottom: 16,
  },
  countdownText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    marginTop: 12,
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: colors.textMuted,
    lineHeight: 22,
    marginBottom: 16,
  },
  organizerCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  organizerHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  organizerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  organizerSubtitle: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "500",
  },
  organizerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  reviewsList: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  reviewsTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
    marginBottom: 8,
    textTransform: "uppercase",
  },
  reviewItem: {
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  reviewUserRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  reviewUser: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.text,
  },
  reviewComment: {
    fontSize: 12,
    color: colors.textMuted,
    fontStyle: "italic",
  },
  ticketsSection: {
    marginBottom: 20,
  },
  ticketOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
    marginBottom: 10,
  },
  ticketOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primaryLight,
  },
  ticketOptionDisabled: {
    opacity: 0.5,
    backgroundColor: colors.surfaceAlt,
  },
  ticketHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginRight: 10,
  },
  ticketName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  ticketPrice: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
  },
  ticketDesc: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  cupoText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    marginTop: 4,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.primary,
  },
  quantityContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: 6,
  },
  quantityLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: colors.text,
  },
  quantityCounter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.surfaceAlt,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  qtyBtnDisabled: {
    opacity: 0.4,
  },
  qtyText: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    minWidth: 20,
    textAlign: "center",
  },
  checkoutBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 8,
  },
  checkoutTotalLabel: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  checkoutTotalValue: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  buyButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 14,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  buyButtonDisabled: {
    backgroundColor: colors.textLight,
    shadowOpacity: 0,
    elevation: 0,
  },
  buyButtonText: {
    color: colors.surface,
    fontSize: 15,
    fontWeight: "700",
  },
  feedbackItem: {
    fontSize: 13,
    color: colors.text,
    marginBottom: 4,
  },
});

export default EventDetailModal;
