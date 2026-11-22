import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import colors from "../../theme/colors";
import StatusBadge from "../../components/common/StatusBadge";
import organizadorService from "../../service/organizadorService";
import { useAuth } from "../../context/AuthContext";

export const MensajesOrganizadorScreen = () => {
  const { usuarioActual, isOrganizador } = useAuth();
  const insets = useSafeAreaInsets();
  const [conversaciones, setConversaciones] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [busqueda, setBusqueda] = useState("");
  const [soloConMensajes, setSoloConMensajes] = useState(true);

  // Modal de Chat activo
  const [chatActivo, setChatActivo] = useState(null); // compra seleccionada
  const [mensajeTexto, setMensajeTexto] = useState("");
  const [enviando, setEnviando] = useState(false);

  const cargarConversaciones = useCallback(async () => {
    if (!isOrganizador) {
      setCargando(false);
      setRefrescando(false);
      return;
    }
    try {
      const eventos = await organizadorService.listarEventos();
      const todasLasCompras = [];

      // Obtener compras de cada evento del organizador
      await Promise.all(
        (eventos || []).map(async (ev) => {
          try {
            const dataVentas = await organizadorService.comprasDeEvento(ev.id);
            if (dataVentas?.compras) {
              dataVentas.compras.forEach((c) => {
                todasLasCompras.push({
                  ...c,
                  eventoNombre: ev.nombre,
                  eventoFecha: ev.fecha,
                });
              });
            }
          } catch (e) {
            console.warn("Error cargando compras para evento", ev.id, e);
          }
        })
      );

      // Ordenar por último mensaje o fecha de compra
      todasLasCompras.sort((a, b) => {
        const ultA = a.mensajes?.length
          ? new Date(a.mensajes[a.mensajes.length - 1].enviado).getTime()
          : 0;
        const ultB = b.mensajes?.length
          ? new Date(b.mensajes[b.mensajes.length - 1].enviado).getTime()
          : 0;
        return ultB - ultA;
      });

      setConversaciones(todasLasCompras);

      // Si había un chat abierto, actualizarlo
      if (chatActivo) {
        const actual = todasLasCompras.find((c) => c.id === chatActivo.id);
        if (actual) setChatActivo(actual);
      }
    } catch (err) {
      console.error("Error al cargar mensajes del organizador:", err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [isOrganizador, usuarioActual?.id, chatActivo?.id]);

  useFocusEffect(
    useCallback(() => {
      cargarConversaciones();
    }, [cargarConversaciones])
  );

  useEffect(() => {
    cargarConversaciones();
  }, [cargarConversaciones]);

  const handleRefresh = () => {
    setRefrescando(true);
    cargarConversaciones();
  };

  const handleEnviarRespuesta = async () => {
    if (!chatActivo || !mensajeTexto.trim()) return;
    try {
      setEnviando(true);
      const compraActualizada = await organizadorService.enviarMensaje(
        chatActivo.id,
        mensajeTexto.trim()
      );
      setMensajeTexto("");
      setChatActivo((prev) => ({
        ...prev,
        ...compraActualizada,
      }));
      cargarConversaciones();
    } catch (err) {
      console.error("Error al enviar respuesta:", err);
    } finally {
      setEnviando(false);
    }
  };

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

  if (!isOrganizador) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
        <Text style={styles.emptyTitle}>Modo Comprador Activo</Text>
        <Text style={styles.emptySubtitle}>
          Cambia al usuario organizador en la barra superior para acceder a los chats de tus eventos.
        </Text>
      </View>
    );
  }

  const conversacionesFiltradas = conversaciones.filter((c) => {
    if (soloConMensajes && (!c.mensajes || c.mensajes.length === 0)) {
      return false;
    }
    if (busqueda.trim()) {
      const b = busqueda.toLowerCase();
      const coincideComprador = c.comprador?.nombreCompleto?.toLowerCase().includes(b);
      const coincideEvento = c.eventoNombre?.toLowerCase().includes(b);
      return coincideComprador || coincideEvento;
    }
    return true;
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mensajes con Asistentes</Text>
        <Text style={styles.subtitle}>
          Canal directo para resolver dudas de acceso, horarios o cambios
        </Text>
      </View>

      {/* Buscador */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar por comprador o evento..."
            placeholderTextColor={colors.textLight}
            value={busqueda}
            onChangeText={setBusqueda}
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => setBusqueda("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filtros de Mensajes */}
      <View style={styles.filterRow}>
        <TouchableOpacity
          style={[styles.filterChip, soloConMensajes && styles.filterChipActive]}
          onPress={() => setSoloConMensajes(true)}
        >
          <Text
            style={[styles.filterChipText, soloConMensajes && styles.filterChipTextActive]}
          >
            Con mensajes activos
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.filterChip, !soloConMensajes && styles.filterChipActive]}
          onPress={() => setSoloConMensajes(false)}
        >
          <Text
            style={[styles.filterChipText, !soloConMensajes && styles.filterChipTextActive]}
          >
            Todos los compradores ({conversaciones.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Listado de Conversaciones */}
      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando conversaciones...</Text>
        </View>
      ) : conversacionesFiltradas.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="chatbubbles-outline" size={54} color={colors.textLight} />
          <Text style={styles.emptyTitle}>
            {soloConMensajes
              ? "No tienes mensajes nuevos de compradores"
              : "No se encontraron compradores"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {soloConMensajes
              ? "Cuando los asistentes de tus eventos envíen consultas sobre entradas o accesos, aparecerán aquí para que respondas al instante."
              : "Prueba modificando la búsqueda."}
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversacionesFiltradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const tieneMensajes = item.mensajes && item.mensajes.length > 0;
            const ultimoMensaje = tieneMensajes
              ? item.mensajes[item.mensajes.length - 1]
              : null;

            return (
              <TouchableOpacity
                style={styles.chatCard}
                activeOpacity={0.8}
                onPress={() => setChatActivo(item)}
              >
                <View style={styles.avatarCircle}>
                  <Ionicons name="person" size={20} color={colors.primary} />
                </View>

                <View style={styles.chatContent}>
                  <View style={styles.chatHeaderRow}>
                    <Text style={styles.buyerName}>
                      {item.comprador?.nombreCompleto || "Comprador"}
                    </Text>
                    {ultimoMensaje && (
                      <Text style={styles.chatTime}>
                        {formatearFecha(ultimoMensaje.enviado)}
                      </Text>
                    )}
                  </View>

                  <View style={styles.eventPill}>
                    <Text style={styles.eventPillText} numberOfLines={1}>
                      {item.eventoNombre} • {item.tipoEntrada?.nombre}
                    </Text>
                  </View>

                  <Text style={styles.lastMessageText} numberOfLines={2}>
                    {ultimoMensaje
                      ? `${ultimoMensaje.usuario?.nombre}: ${ultimoMensaje.texto}`
                      : "Sin mensajes previos. Toca para iniciar conversación."}
                  </Text>
                </View>

                <View style={styles.metaColumn}>
                  <StatusBadge estado={item.estado} />
                  {tieneMensajes && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadBadgeText}>
                        {item.mensajes.length}
                      </Text>
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          }}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
        />
      )}

      {/* Modal de Chat Directo */}
      <Modal
        visible={!!chatActivo}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setChatActivo(null)}
      >
        <KeyboardAvoidingView
          style={styles.modalContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          {/* Header del Chat */}
          <View style={styles.chatModalHeader}>
            <TouchableOpacity
              onPress={() => setChatActivo(null)}
              style={styles.closeBtn}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>

            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.chatModalTitle}>
                {chatActivo?.comprador?.nombreCompleto}
              </Text>
              <Text style={styles.chatModalSubtitle} numberOfLines={1}>
                {chatActivo?.eventoNombre} ({chatActivo?.tipoEntrada?.nombre})
              </Text>
            </View>

            {chatActivo && <StatusBadge estado={chatActivo.estado} />}
          </View>

          {/* Historial de Mensajes */}
          <ScrollView style={styles.chatScroll} showsVerticalScrollIndicator={false}>
            {!chatActivo?.mensajes || chatActivo.mensajes.length === 0 ? (
              <View style={styles.emptyChatBox}>
                <Ionicons name="chatbubble-outline" size={36} color={colors.textLight} />
                <Text style={styles.emptyChatText}>
                  No hay mensajes intercambiados todavía. Escribe una respuesta o mensaje al comprador abajo.
                </Text>
              </View>
            ) : (
              chatActivo.mensajes.map((m) => {
                const esMio = m.usuario?.id === usuarioActual?.id;
                return (
                  <View
                    key={m.id}
                    style={[
                      styles.msgBubble,
                      esMio ? styles.myMsgBubble : styles.theirMsgBubble,
                    ]}
                  >
                    <Text
                      style={[
                        styles.msgAuthor,
                        esMio ? styles.myMsgAuthor : styles.theirMsgAuthor,
                      ]}
                    >
                      {m.usuario?.nombreCompleto} ({m.usuario?.rol})
                    </Text>
                    <Text
                      style={[
                        styles.msgContent,
                        esMio ? styles.myMsgContent : styles.theirMsgContent,
                      ]}
                    >
                      {m.texto}
                    </Text>
                    <Text
                      style={[
                        styles.msgTimestamp,
                        esMio ? styles.myMsgTimestamp : styles.theirMsgTimestamp,
                      ]}
                    >
                      {formatearFecha(m.enviado)}
                    </Text>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Barra de Entrada de Texto */}
          <View
            style={[
              styles.inputBar,
              { paddingBottom: Math.max(insets.bottom, Platform.OS === "android" ? 26 : 10) },
            ]}
          >
            <TextInput
              style={styles.textInput}
              placeholder="Responder al asistente..."
              placeholderTextColor={colors.textLight}
              value={mensajeTexto}
              onChangeText={setMensajeTexto}
              maxLength={1000}
              multiline
            />
            <TouchableOpacity
              style={[
                styles.sendBtn,
                (!mensajeTexto.trim() || enviando) && styles.sendBtnDisabled,
              ]}
              onPress={handleEnviarRespuesta}
              disabled={!mensajeTexto.trim() || enviando}
            >
              {enviando ? (
                <ActivityIndicator size="small" color={colors.surface} />
              ) : (
                <Ionicons name="send" size={18} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: colors.text,
    padding: 0,
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 10,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  filterChipTextActive: {
    color: colors.surface,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  chatCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  chatContent: {
    flex: 1,
    marginRight: 8,
  },
  chatHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  buyerName: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
  },
  chatTime: {
    fontSize: 11,
    color: colors.textMuted,
  },
  eventPill: {
    alignSelf: "flex-start",
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    marginVertical: 4,
  },
  eventPillText: {
    fontSize: 11,
    color: colors.primary,
    fontWeight: "600",
  },
  lastMessageText: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 16,
  },
  metaColumn: {
    alignItems: "flex-end",
    gap: 6,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  unreadBadgeText: {
    color: colors.surface,
    fontSize: 10,
    fontWeight: "700",
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
  emptyTitle: {
    marginTop: 12,
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
    textAlign: "center",
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  chatModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  closeBtn: {
    padding: 4,
  },
  chatModalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  chatModalSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
  },
  chatScroll: {
    flex: 1,
    padding: 16,
  },
  emptyChatBox: {
    alignItems: "center",
    padding: 30,
  },
  emptyChatText: {
    marginTop: 10,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  msgBubble: {
    padding: 10,
    borderRadius: 14,
    marginBottom: 8,
    maxWidth: "85%",
  },
  myMsgBubble: {
    alignSelf: "flex-end",
    backgroundColor: colors.primary,
  },
  theirMsgBubble: {
    alignSelf: "flex-start",
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  msgAuthor: {
    fontSize: 10,
    fontWeight: "700",
    marginBottom: 2,
  },
  myMsgAuthor: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  theirMsgAuthor: {
    color: colors.primary,
  },
  msgContent: {
    fontSize: 13,
    lineHeight: 18,
  },
  myMsgContent: {
    color: colors.surface,
  },
  theirMsgContent: {
    color: colors.text,
  },
  msgTimestamp: {
    fontSize: 9,
    marginTop: 4,
    alignSelf: "flex-end",
  },
  myMsgTimestamp: {
    color: "rgba(255, 255, 255, 0.6)",
  },
  theirMsgTimestamp: {
    color: colors.textMuted,
  },
  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
  },
  textInput: {
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

export default MensajesOrganizadorScreen;
