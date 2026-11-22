import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../theme/colors";
import RatingStars from "../../components/common/RatingStars";
import EventSalesCheckinModal from "./EventSalesCheckinModal";
import organizadorService from "../../service/organizadorService";
import { useAuth } from "../../context/AuthContext";

export const MisEventosScreen = ({ navigation }) => {
  const { usuarioActual, isOrganizador } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Filtro temporal: "PROXIMOS" vs "FINALIZADOS"
  const [filtroTemporal, setFiltroTemporal] = useState("PROXIMOS");

  // Modal de Ventas y Check-in
  const [eventoSeleccionadoId, setEventoSeleccionadoId] = useState(null);
  const [modalVentasVisible, setModalVentasVisible] = useState(false);

  const cargarEventos = useCallback(async () => {
    if (!isOrganizador) {
      setCargando(false);
      setRefrescando(false);
      return;
    }
    try {
      const data = await organizadorService.listarEventos();
      setEventos(data || []);
    } catch (err) {
      console.error("Error al cargar eventos del organizador:", err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [isOrganizador, usuarioActual?.id]);

  // Recargar al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarEventos();
    }, [cargarEventos])
  );

  useEffect(() => {
    cargarEventos();
  }, [cargarEventos]);

  const handleRefresh = () => {
    setRefrescando(true);
    cargarEventos();
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

  const abrirVentas = (eventoId) => {
    setEventoSeleccionadoId(eventoId);
    setModalVentasVisible(true);
  };

  if (!isOrganizador) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
        <Text style={styles.emptyTitle}>Modo Comprador Activo</Text>
        <Text style={styles.emptySubtitle}>
          Cambia al usuario organizador (ej: Lucía Gómez o Martín Pérez) en la barra superior para ver tus eventos creados.
        </Text>
      </View>
    );
  }

  // Separar eventos por estado de realización
  const proximosCount = eventos.filter((e) => !e.yaSeRealizo).length;
  const finalizadosCount = eventos.filter((e) => e.yaSeRealizo).length;

  const eventosFiltrados = eventos.filter((e) => {
    if (filtroTemporal === "PROXIMOS") {
      return !e.yaSeRealizo;
    } else {
      return e.yaSeRealizo;
    }
  });

  // Obtener reputación desde el primer evento o calculada
  const reputacion = eventos[0]?.organizador || {};

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Mis Eventos Publicados</Text>
          <Text style={styles.subtitle}>
            Administra tus ventas, accesos y consultas
          </Text>
        </View>

        {navigation?.navigate && (
          <TouchableOpacity
            style={styles.nuevoBtn}
            onPress={() => navigation.navigate("Publicar")}
          >
            <Ionicons name="add" size={18} color={colors.surface} />
            <Text style={styles.nuevoBtnText}>Nuevo</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tarjeta de Reputación del Organizador */}
      <View style={styles.reputacionCard}>
        <View style={styles.reputacionInfo}>
          <Text style={styles.reputacionLabel}>Tu reputación como productor:</Text>
          <RatingStars
            puntuacion={reputacion.puntajePromedio || 0}
            cantidadResenias={reputacion.cantidadResenias}
            size={16}
            mostrarNumero
          />
        </View>
        <Text style={styles.reputacionDetalle}>
          Basada en las opiniones de asistentes en eventos ya realizados
        </Text>
      </View>

      {/* Pestañas: Próximos vs Finalizados */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          style={[
            styles.mainTabBtn,
            filtroTemporal === "PROXIMOS" && styles.mainTabBtnActive,
          ]}
          onPress={() => setFiltroTemporal("PROXIMOS")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="calendar-outline"
            size={16}
            color={filtroTemporal === "PROXIMOS" ? colors.surface : colors.textMuted}
          />
          <Text
            style={[
              styles.mainTabText,
              filtroTemporal === "PROXIMOS" && styles.mainTabTextActive,
            ]}
          >
            Próximos / Activos ({proximosCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainTabBtn,
            filtroTemporal === "FINALIZADOS" && styles.mainTabBtnActive,
          ]}
          onPress={() => setFiltroTemporal("FINALIZADOS")}
          activeOpacity={0.8}
        >
          <Ionicons
            name="checkmark-done-circle-outline"
            size={16}
            color={filtroTemporal === "FINALIZADOS" ? colors.surface : colors.textMuted}
          />
          <Text
            style={[
              styles.mainTabText,
              filtroTemporal === "FINALIZADOS" && styles.mainTabTextActive,
            ]}
          >
            Finalizados ({finalizadosCount})
          </Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando tus eventos...</Text>
        </View>
      ) : eventosFiltrados.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name={filtroTemporal === "PROXIMOS" ? "calendar-outline" : "archive-outline"}
            size={54}
            color={colors.textLight}
          />
          <Text style={styles.emptyTitle}>
            {filtroTemporal === "PROXIMOS"
              ? "No tienes eventos activos en venta"
              : "No tienes eventos finalizados todavía"}
          </Text>
          <Text style={styles.emptySubtitle}>
            {filtroTemporal === "PROXIMOS"
              ? "Crea un nuevo espectáculo o recital para comenzar a vender entradas."
              : "Los eventos cuya fecha ya haya pasado figurarán en esta sección para consultar su historial."}
          </Text>
          {filtroTemporal === "PROXIMOS" && navigation?.navigate && (
            <TouchableOpacity
              style={styles.crearPrimeroBtn}
              onPress={() => navigation.navigate("Publicar")}
            >
              <Text style={styles.crearPrimeroBtnText}>Crear Evento</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={eventosFiltrados}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const imagenUrl =
              item.multimedia && item.multimedia.length > 0
                ? item.multimedia[0]
                : "https://picsum.photos/seed/eventodefault/800/400";

            return (
              <View style={styles.eventCard}>
                <Image source={{ uri: imagenUrl }} style={styles.cardImg} />
                <View style={styles.cardContent}>
                  <View style={styles.cardCategoryRow}>
                    <Text style={styles.cardCategory}>
                      {item.categoria?.nombre || "Evento"}
                    </Text>
                    {item.yaSeRealizo ? (
                      <View style={styles.pastPill}>
                        <Text style={styles.pastPillText}>Realizado</Text>
                      </View>
                    ) : (
                      <Text style={styles.diasRestantes}>
                        En {item.diasHastaEvento} días
                      </Text>
                    )}
                  </View>

                  <Text style={styles.cardTitle}>{item.nombre}</Text>
                  <Text style={styles.cardDate}>
                    {formatearFecha(item.fecha)}
                  </Text>

                  {/* Sectores y Precios */}
                  <View style={styles.sectoresRow}>
                    <Text style={styles.sectoresText}>
                      {item.tiposEntrada?.length} tipo(s) de entrada • Desde ${item.precioDesde?.toLocaleString("es-AR")}
                    </Text>
                  </View>

                  {/* Botón de Gestión */}
                  <TouchableOpacity
                    style={styles.ventasBtn}
                    onPress={() => abrirVentas(item.id)}
                  >
                    <Ionicons name="people-outline" size={16} color={colors.surface} />
                    <Text style={styles.ventasBtnText}>
                      {item.yaSeRealizo
                        ? "Ver Resumen de Ventas y Asistencia"
                        : "Ver Ventas y Control de Acceso"}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
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

      {/* Modal de Ventas y Check-in */}
      <EventSalesCheckinModal
        eventoId={eventoSeleccionadoId}
        visible={modalVentasVisible}
        onClose={() => {
          setModalVentasVisible(false);
          cargarEventos();
        }}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  nuevoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  nuevoBtnText: {
    color: colors.surface,
    fontSize: 13,
    fontWeight: "700",
  },
  reputacionCard: {
    marginHorizontal: 16,
    marginBottom: 10,
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reputacionInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  reputacionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  reputacionDetalle: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
  },
  mainTabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  mainTabBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 9,
    borderRadius: 10,
  },
  mainTabBtnActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  mainTabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.textMuted,
  },
  mainTabTextActive: {
    color: colors.surface,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Espacio suficiente para no chocar con la barra de navegación del celular
  },
  eventCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 14,
    overflow: "hidden",
  },
  cardImg: {
    width: "100%",
    height: 120,
    backgroundColor: colors.surfaceAlt,
  },
  cardContent: {
    padding: 14,
  },
  cardCategoryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardCategory: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primary,
    textTransform: "uppercase",
  },
  diasRestantes: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
  },
  pastPill: {
    backgroundColor: colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  pastPillText: {
    fontSize: 10,
    fontWeight: "700",
    color: colors.textMuted,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  cardDate: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  sectoresRow: {
    marginBottom: 12,
  },
  sectoresText: {
    fontSize: 12,
    color: colors.text,
    fontWeight: "500",
  },
  ventasBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 10,
    borderRadius: 12,
  },
  ventasBtnText: {
    color: colors.surface,
    fontSize: 13,
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
  },
  emptySubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
  },
  crearPrimeroBtn: {
    marginTop: 16,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  crearPrimeroBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
});

export default MisEventosScreen;
