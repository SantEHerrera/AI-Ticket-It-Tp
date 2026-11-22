import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../theme/colors";
import EventCard from "../../components/EventCard";
import EventDetailModal from "./EventDetailModal";
import compradorService from "../../service/compradorService";
import { useAuth } from "../../context/AuthContext";

export const FavoritosScreen = ({ navigation }) => {
  const { usuarioActual, isComprador } = useAuth();
  const [favoritos, setFavoritos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const [eventoSeleccionado, setEventoSeleccionado] = useState(null);
  const [modalDetalleVisible, setModalDetalleVisible] = useState(false);

  const cargarFavoritos = useCallback(async () => {
    if (!isComprador) {
      setCargando(false);
      setRefrescando(false);
      return;
    }
    try {
      const data = await compradorService.listarFavoritos();
      setFavoritos(data || []);
    } catch (err) {
      console.error("Error al cargar favoritos:", err);
    } finally {
      setCargando(false);
      setRefrescando(false);
    }
  }, [isComprador, usuarioActual?.id]);

  useEffect(() => {
    cargarFavoritos();
  }, [cargarFavoritos]);

  const handleRefresh = () => {
    setRefrescando(true);
    cargarFavoritos();
  };

  const handleQuitarFavorito = async (eventoId) => {
    try {
      await compradorService.quitarFavorito(eventoId);
      setFavoritos((prev) => prev.filter((e) => e.id !== eventoId));
    } catch (err) {
      console.error("Error al quitar favorito:", err);
    }
  };

  const abrirDetalle = (evento) => {
    setEventoSeleccionado(evento);
    setModalDetalleVisible(true);
  };

  if (!isComprador) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
        <Text style={styles.emptyTitle}>Modo Organizador Activo</Text>
        <Text style={styles.emptySubtitle}>
          Cambia al usuario comprador en la barra superior para ver tus favoritos guardados.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Tus Favoritos</Text>
        <Text style={styles.subtitle}>
          Eventos guardados para seguir de cerca
        </Text>
      </View>

      {cargando ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Cargando favoritos...</Text>
        </View>
      ) : favoritos.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="heart-dislike-outline" size={54} color={colors.textLight} />
          <Text style={styles.emptyTitle}>Aún no guardaste favoritos</Text>
          <Text style={styles.emptySubtitle}>
            Explora los eventos y presiona el corazón en los que más te interesen.
          </Text>
          {navigation?.navigate && (
            <TouchableOpacity
              style={styles.explorarBtn}
              onPress={() => navigation.navigate("Explorar")}
            >
              <Text style={styles.explorarBtnText}>Ir al catálogo</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={favoritos}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <EventCard
              evento={item}
              esFavorito={true}
              onPress={() => abrirDetalle(item)}
              onToggleFavorito={handleQuitarFavorito}
              mostrarFavorito={true}
            />
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

      <EventDetailModal
        evento={eventoSeleccionado}
        visible={modalDetalleVisible}
        onClose={() => setModalDetalleVisible(false)}
        esFavorito={true}
        onToggleFavorito={handleQuitarFavorito}
        onCompraExitosa={() => {
          cargarFavoritos();
          if (navigation?.navigate) {
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
  list: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
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

export default FavoritosScreen;
