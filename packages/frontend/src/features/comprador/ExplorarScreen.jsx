import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import colors from "../../theme/colors";
import EventCard from "../../components/EventCard";
import EventDetailModal from "./EventDetailModal";
import compradorService from "../../service/compradorService";
import { useAuth } from "../../context/AuthContext";

export const ExplorarScreen = ({ navigation }) => {
  const { usuarioActual, isComprador } = useAuth();
  const [eventos, setEventos] = useState([]);
  const [categorias, setCategorias] = useState([]);
  const [favoritosIds, setFavoritosIds] = useState({});
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  // Pestaña temporal: "PROXIMOS" o "FINALIZADOS"
  const [filtroTemporal, setFiltroTemporal] = useState("PROXIMOS");

  // Filtros
  const [busqueda, setBusqueda] = useState("");
  const [categoriaSeleccionada, setCategoriaSeleccionada] = useState(null); // null = todas
  const [orden, setOrden] = useState("fecha"); // fecha | precio | puntaje

  // Paginación (5 eventos por página)
  const [pagina, setPagina] = useState(1);
  const [totalPaginas, setTotalPaginas] = useState(1);
  const [totalEventos, setTotalEventos] = useState(0);
  const [proximosCount, setProximosCount] = useState(0);
  const [finalizadosCount, setFinalizadosCount] = useState(0);

  // Modal de Detalle
  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);

  const cargarDatos = useCallback(async () => {
    try {
      const [cats, evtsData] = await Promise.all([
        compradorService.listarCategorias(),
        compradorService.buscarEventos({
          texto: busqueda,
          categoriaId: categoriaSeleccionada,
          orden,
          temporal: filtroTemporal,
          pagina,
          limite: 5,
        }),
      ]);
      setCategorias(cats || []);

      if (Array.isArray(evtsData)) {
        // En caso de que el backend retorne array directo
        setEventos(evtsData);
        setTotalEventos(evtsData.length);
        setTotalPaginas(Math.ceil(evtsData.length / 5) || 1);
        setProximosCount(evtsData.filter((e) => !e.yaSeRealizo).length);
        setFinalizadosCount(evtsData.filter((e) => e.yaSeRealizo).length);
      } else if (evtsData) {
        setEventos(evtsData.eventos || []);
        setTotalEventos(evtsData.total || 0);
        setTotalPaginas(evtsData.totalPaginas || 1);
        if (evtsData.proximosCount !== undefined) setProximosCount(evtsData.proximosCount);
        if (evtsData.finalizadosCount !== undefined) setFinalizadosCount(evtsData.finalizadosCount);
      }

      if (isComprador) {
        try {
          const favs = await compradorService.listarFavoritos();
          const obj = {};
          (favs || []).forEach((f) => {
            obj[f.id] = true;
          });
          setFavoritosIds(obj);
        } catch (e) {
          console.warn("No se pudieron cargar favoritos:", e);
        }
      }
    } catch (err) {
      console.error("Error al cargar eventos:", err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [busqueda, categoriaSeleccionada, orden, filtroTemporal, pagina, isComprador, usuarioActual?.id]);

  // Recargar datos al enfocar la pantalla
  useFocusEffect(
    useCallback(() => {
      cargarDatos();
    }, [cargarDatos])
  );

  useEffect(() => {
    cargarDatos();
  }, [cargarDatos]);

  const handleRefresh = () => {
    setRefrescando(true);
    setPagina(1);
    cargarDatos();
  };

  const handleCambiarFiltroTemporal = (nuevoFiltro) => {
    if (filtroTemporal !== nuevoFiltro) {
      setFiltroTemporal(nuevoFiltro);
      setPagina(1);
    }
  };

  const handleCambiarBusqueda = (texto) => {
    setBusqueda(texto);
    setPagina(1);
  };

  const handleCambiarCategoria = (catId) => {
    setCategoriaSeleccionada(catId);
    setPagina(1);
  };

  const handleCambiarOrden = (nuevoOrden) => {
    setOrden(nuevoOrden);
    setPagina(1);
  };

  const handleToggleFavorito = async (eventoId) => {
    if (!isComprador) return;
    try {
      const esFav = !!favoritosIds[eventoId];
      if (esFav) {
        await compradorService.quitarFavorito(eventoId);
        setFavoritosIds((prev) => {
          const next = { ...prev };
          delete next[eventoId];
          return next;
        });
      } else {
        await compradorService.agregarFavorito(eventoId);
        setFavoritosIds((prev) => ({ ...prev, [eventoId]: true }));
      }
    } catch (err) {
      console.error("Error al alternar favorito:", err);
    }
  };

  const abrirDetalle = (evento) => {
    setEventoSeleccionado(evento);
    setModalDetalleVisible(true);
  };

  const opcionesOrden = [
    { id: "fecha", label: "Próximos" },
    { id: "precio", label: "Menor precio" },
    { id: "puntaje", label: "Mejor reputación" },
  ];

  return (
    <View style={styles.container}>
      {/* Pestañas Principales: Próximos vs Finalizados */}
      <View style={styles.mainTabsContainer}>
        <TouchableOpacity
          style={[
            styles.mainTabBtn,
            filtroTemporal === "PROXIMOS" && styles.mainTabBtnActive,
          ]}
          onPress={() => handleCambiarFiltroTemporal("PROXIMOS")}
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
            Próximos ({proximosCount})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.mainTabBtn,
            filtroTemporal === "FINALIZADOS" && styles.mainTabBtnActive,
          ]}
          onPress={() => handleCambiarFiltroTemporal("FINALIZADOS")}
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

      {/* Barra de Búsqueda */}
      <View style={styles.searchSection}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={18} color={colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder={
              filtroTemporal === "PROXIMOS"
                ? "Buscar recital, obra, festival..."
                : "Buscar eventos finalizados y reseñas..."
            }
            placeholderTextColor={colors.textLight}
            value={busqueda}
            onChangeText={handleCambiarBusqueda}
            returnKeyType="search"
          />
          {busqueda.length > 0 && (
            <TouchableOpacity onPress={() => handleCambiarBusqueda("")}>
              <Ionicons name="close-circle" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorías deslizables */}
      <View style={styles.categoriesWrapper}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          <TouchableOpacity
            style={[
              styles.categoryChip,
              categoriaSeleccionada === null && styles.categoryChipActive,
            ]}
            onPress={() => handleCambiarCategoria(null)}
          >
            <Text
              style={[
                styles.categoryChipText,
                categoriaSeleccionada === null && styles.categoryChipTextActive,
              ]}
            >
              Todos
            </Text>
          </TouchableOpacity>

          {categorias.map((cat) => {
            const activa = categoriaSeleccionada === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                style={[styles.categoryChip, activa && styles.categoryChipActive]}
                onPress={() => handleCambiarCategoria(activa ? null : cat.id)}
              >
                <Text
                  style={[
                    styles.categoryChipText,
                    activa && styles.categoryChipTextActive,
                  ]}
                >
                  {cat.nombre}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Selector de Orden */}
      <View style={styles.ordenRow}>
        <Text style={styles.ordenLabel}>Ordenar por:</Text>
        <View style={styles.ordenOptions}>
          {opcionesOrden.map((op) => (
            <TouchableOpacity
              key={op.id}
              style={[
                styles.ordenBtn,
                orden === op.id && styles.ordenBtnActive,
              ]}
              onPress={() => handleCambiarOrden(op.id)}
            >
              <Text
                style={[
                  styles.ordenBtnText,
                  orden === op.id && styles.ordenBtnTextActive,
                ]}
              >
                {op.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Lista de Eventos Paginada (5 por página) */}
      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando eventos...</Text>
        </View>
      ) : eventos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons
            name={filtroTemporal === "PROXIMOS" ? "ticket-outline" : "archive-outline"}
            size={48}
            color={colors.textLight}
          />
          <Text style={styles.emptyTitle}>
            {filtroTemporal === "PROXIMOS"
              ? "No se encontraron eventos próximos"
              : "No se encontraron eventos finalizados"}
          </Text>
          <Text style={styles.emptySubtitle}>
            Prueba ajustando los filtros de búsqueda o categoría
          </Text>
        </View>
      ) : (
        <FlatList
          data={eventos}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EventCard
              evento={item}
              esFavorito={!!favoritosIds[item.id]}
              onPress={() => abrirDetalle(item)}
              onToggleFavorito={handleToggleFavorito}
              mostrarFavorito={isComprador && !item.yaSeRealizo}
            />
          )}
          contentContainerStyle={styles.eventsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refrescando}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            totalEventos > 0 ? (
              <View style={styles.paginationFooter}>
                {totalPaginas > 1 ? (
                  <View style={styles.paginationControls}>
                    <TouchableOpacity
                      style={[
                        styles.pageBtn,
                        pagina <= 1 && styles.pageBtnDisabled,
                      ]}
                      onPress={() => setPagina((p) => Math.max(1, p - 1))}
                      disabled={pagina <= 1}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name="chevron-back"
                        size={18}
                        color={pagina <= 1 ? colors.textLight : colors.primary}
                      />
                      <Text
                        style={[
                          styles.pageBtnText,
                          pagina <= 1 && styles.pageBtnTextDisabled,
                        ]}
                      >
                        Anterior
                      </Text>
                    </TouchableOpacity>

                    <View style={styles.pageIndicator}>
                      <Text style={styles.pageIndicatorText}>
                        Página{" "}
                        <Text style={styles.pageIndicatorBold}>{pagina}</Text> de{" "}
                        {totalPaginas}
                      </Text>
                      <Text style={styles.pageTotalText}>
                        ({totalEventos} {totalEventos === 1 ? "evento" : "eventos"})
                      </Text>
                    </View>

                    <TouchableOpacity
                      style={[
                        styles.pageBtn,
                        pagina >= totalPaginas && styles.pageBtnDisabled,
                      ]}
                      onPress={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
                      disabled={pagina >= totalPaginas}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.pageBtnText,
                          pagina >= totalPaginas && styles.pageBtnTextDisabled,
                        ]}
                      >
                        Siguiente
                      </Text>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color={pagina >= totalPaginas ? colors.textLight : colors.primary}
                      />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.singlePageIndicator}>
                    <Text style={styles.pageTotalText}>
                      Mostrando {eventos.length} de {totalEventos} {totalEventos === 1 ? "evento" : "eventos"}
                    </Text>
                  </View>
                )}
              </View>
            ) : null
          }
        />
      )}

      {/* Modal de Detalle y Compra */}
      <EventDetailModal
        evento={eventoSeleccionado}
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        esFavorito={eventoSeleccionado ? !!favoritosIds[eventoSeleccionado.id] : false}
        onToggleFavorito={handleToggleFavorito}
        onCompraExitosa={(compra, irACompras) => {
          cargarDatos();
          if (irACompras && navigation?.navigate) {
            navigation.navigate("Mis Compras");
          }
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
  mainTabsContainer: {
    flexDirection: "row",
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: 16,
    marginTop: 12,
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
    paddingVertical: 10,
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
    fontSize: 13,
    fontWeight: "700",
    color: colors.textMuted,
  },
  mainTabTextActive: {
    color: colors.surface,
  },
  searchSection: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 6,
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
  categoriesWrapper: {
    marginBottom: 8,
  },
  categoriesList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  categoryChipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.textMuted,
  },
  categoryChipTextActive: {
    color: colors.surface,
  },
  ordenRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  ordenLabel: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  ordenOptions: {
    flexDirection: "row",
    gap: 6,
  },
  ordenBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
  },
  ordenBtnActive: {
    backgroundColor: colors.primaryLight,
  },
  ordenBtnText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
  ordenBtnTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  eventsList: {
    paddingHorizontal: 16,
    paddingBottom: 120, // Suficiente espacio para no solapar con la barra de navegación del celular
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
    marginTop: 4,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
  },
  paginationFooter: {
    marginTop: 10,
    marginBottom: 20,
  },
  paginationControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  pageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
  },
  pageBtnDisabled: {
    backgroundColor: colors.surfaceAlt,
  },
  pageBtnText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  pageBtnTextDisabled: {
    color: colors.textLight,
  },
  pageIndicator: {
    alignItems: "center",
  },
  pageIndicatorText: {
    fontSize: 13,
    color: colors.text,
  },
  pageIndicatorBold: {
    fontWeight: "800",
    color: colors.primary,
  },
  pageTotalText: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  singlePageIndicator: {
    alignItems: "center",
    paddingVertical: 8,
  },
});

export default ExplorarScreen;
