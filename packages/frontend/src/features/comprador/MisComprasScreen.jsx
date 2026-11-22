import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../theme/colors";
import StatusBadge from "../../components/common/StatusBadge";
import PurchaseDetailModal from "./PurchaseDetailModal";
import ReviewModal from "./ReviewModal";
import compradorService from "../../service/compradorService";
import { useAuth } from "../../context/AuthContext";

export const MisComprasScreen = ({ navigation }) => {
  const { usuarioActual, isComprador } = useAuth();
  const [compras, setCompras] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [filtroEstado, setFiltroEstado] = useState("TODAS"); // TODAS | PENDIENTE | CONFIRMADA | UTILIZADA

  // Modales
  const [compraSeleccionada, setCompraSeleccionada] = useState(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);
  const [modalReseniaVisible, setModalReseniaVisible] = useState(false);

  const cargarCompras = useCallback(async () => {
    if (!isComprador) {
      setCargando(false);
      setRefrescando(false);
      return;
    }
    try {
      const data = await compradorService.listarCompras();
      setCompras(data || []);
    } catch (err) {
      console.error("Error al cargar compras:", err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [isComprador, usuarioActual?.id]);

  // Recargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarCompras();
    }, [cargarCompras])
  );

  useEffect(() => {
    cargarCompras();
  }, [cargarCompras]);

  const handleRefresh = () => {
    setRefrescando(true);
    cargarCompras();
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

  const abrirDetalle = (compra) => {
    setCompraSeleccionada(compra);
    setModalDetalleVisible(true);
  };

  const abrirResenia = (compra) => {
    setCompraSeleccionada(compra);
    setModalReseniaVisible(true);
  };

  const comprasFiltradas = compras.filter((c) => {
    if (filtroEstado === "TODAS") return true;
    return c.estado === filtroEstado;
  });

  if (!isComprador) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
        <Text style={styles.emptyTitle}>Modo Organizador Activo</Text>
        <Text style={styles.emptySubtitle}>
          Cambia al usuario comprador en la barra superior para ver tus compras y tickets.
        </Text>
      </View>
    );
  }

  const tabs = [
    { id: "TODAS", label: "Todas" },
    { id: "PENDIENTE", label: "Pendientes" },
    { id: "CONFIRMADA", label: "Confirmadas" },
    { id: "UTILIZADA", label: "Utilizadas" },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Mis Compras</Text>
        <Text style={styles.subtitle}>
          Seguimiento de tickets y canal de comunicación
        </Text>
      </View>

      {/* Tabs de Filtro de Estado */}
      <View style={styles.tabsRow}>
        {tabs.map((tab) => {
          const activa = filtroEstado === tab.id;
          return (
            <TouchableOpacity
              key={tab.id}
              style={[styles.tabBtn, activa && styles.tabBtnActive]}
              onPress={() => setFiltroEstado(tab.id)}
            >
              <Text
                style={[styles.tabBtnText, activa && styles.tabBtnTextActive]}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tus compras...</Text>
        </View>
      ) : comprasFiltradas.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="ticket-outline" size={54} color={colors.textLight} />
          <Text style={styles.emptyTitle}>No hay compras aquí</Text>
          <Text style={styles.emptySubtitle}>
            {filtroEstado === "TODAS"
              ? "Aún no compraste entradas. Explora los eventos disponibles para adquirir la tuya."
              : `No tienes compras en estado "${filtroEstado}".`}
          </Text>
          {navigation?.navigate && (
            <TouchableOpacity
              style={styles.explorarBtn}
              onPress={() => navigation.navigate("Explorar")}
            >
              <Text style={styles.explorarBtnText}>Ver Catálogo</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={comprasFiltradas}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              activeOpacity={0.8}
              onPress={() => abrirDetalle(item)}
            >
              <View style={styles.cardHeader}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.cardTitle}>{item.evento?.nombre}</Text>
                  <Text style={styles.cardDate}>
                    {formatearFecha(item.evento?.fecha)}
                  </Text>
                </View>
                <StatusBadge estado={item.estado} />
              </View>

              <View style={styles.cardMeta}>
                <Text style={styles.cardMetaItem}>
                  <Text style={{ fontWeight: "700" }}>Entrada:</Text>{" "}
                  {item.tipoEntrada?.nombre} (x{item.cantidad})
                </Text>
                <Text style={styles.cardTotal}>
                  ${item.total?.toLocaleString("es-AR")}
                </Text>
              </View>

              {item.diasHastaEvento !== null && item.estado === "CONFIRMADA" && (
                <View style={styles.daysBadge}>
                  <Ionicons name="time-outline" size={13} color={colors.primary} />
                  <Text style={styles.daysBadgeText}>
                    {item.diasHastaEvento === 0
                      ? "¡El evento es hoy!"
                      : `Faltan ${item.diasHastaEvento} días`}
                  </Text>
                </View>
              )}

              {/* Acciones Rápidas */}
              <View style={styles.cardFooter}>
                <View style={styles.messagesCount}>
                  <Ionicons name="chatbubbles-outline" size={14} color={colors.textMuted} />
                  <Text style={styles.messagesCountText}>
                    {item.mensajes?.length || 0} mensajes
                  </Text>
                </View>

                <View style={styles.actionButtonsRow}>
                  {item.puedeReseniarse && (
                    <TouchableOpacity
                      style={styles.miniReviewBtn}
                      onPress={(e) => {
                        e.stopPropagation();
                        abrirResenia(item);
                      }}
                    >
                      <Ionicons name="star" size={13} color="#F59E0B" />
                      <Text style={styles.miniReviewBtnText}>Calificar</Text>
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity
                    style={styles.verTicketBtn}
                    onPress={() => abrirDetalle(item)}
                  >
                    <Text style={styles.verTicketBtnText}>Ver Ticket</Text>
                    <Ionicons name="chevron-forward" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          )}
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

      {/* Modal de Ticket y Chat */}
      <PurchaseDetailModal
        compra={compraSeleccionada}
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        onCompraActualizada={() => cargarCompras()}
        onAbrirResenia={(compra) => {
          setModalDetalleVisible(false);
          abrirResenia(compra);
        }}
      />

      {/* Modal de Reseña */}
      <ReviewModal
        compra={compraSeleccionada}
        visible={modalReseniaVisible}
        onClose={() => setModalReseniaVisible(false)}
        onReseniaEnviada={() => cargarCompras()}
      />
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
  tabsRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 10,
    gap: 8,
  },
  tabBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  tabBtnTextActive: {
    color: colors.surface,
  },
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  cardMetaItem: {
    fontSize: 13,
    color: colors.text,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  daysBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
    marginBottom: 8,
  },
  daysBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
  },
  messagesCount: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  messagesCountText: {
    fontSize: 12,
    color: colors.textMuted,
  },
  actionButtonsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  miniReviewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.warningLight,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  miniReviewBtnText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
  },
  verTicketBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  verTicketBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
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
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  explorarBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  explorarBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default MisComprasScreen;
