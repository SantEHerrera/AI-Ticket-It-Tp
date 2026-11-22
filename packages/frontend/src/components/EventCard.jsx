import React from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../theme/colors";
import RatingStars from "./common/RatingStars";

export const EventCard = ({
  evento,
  esFavorito = false,
  onPress,
  onToggleFavorito,
  mostrarFavorito = true,
}) => {
  const imagenUrl =
    evento.multimedia && evento.multimedia.length > 0
      ? evento.multimedia[0]
      : "https://picsum.photos/seed/eventodefault/800/400";

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
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={onPress}
    >
      {/* Imagen y Badges superiores */}
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imagenUrl }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.categoryBadge}>
          <Text style={styles.categoryText}>
            {evento.categoria?.nombre || "Evento"}
          </Text>
        </View>

        {mostrarFavorito && onToggleFavorito && (
          <Pressable
            style={styles.favoriteButton}
            onPress={(e) => {
              e.stopPropagation();
              onToggleFavorito(evento.id);
            }}
          >
            <Ionicons
              name={esFavorito ? "heart" : "heart-outline"}
              size={20}
              color={esFavorito ? colors.danger : colors.text}
            />
          </Pressable>
        )}

        {evento.yaSeRealizo ? (
          <View style={styles.pastBadge}>
            <Text style={styles.pastBadgeText}>Finalizado</Text>
          </View>
        ) : (
          evento.diasHastaEvento !== null && (
            <View style={styles.dateBadge}>
              <Ionicons name="time-outline" size={12} color={colors.surface} />
              <Text style={styles.dateBadgeText}>
                {evento.diasHastaEvento === 0
                  ? "¡Hoy!"
                  : `En ${evento.diasHastaEvento} días`}
              </Text>
            </View>
          )
        )}
      </View>

      {/* Contenido */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {evento.nombre}
        </Text>

        <Text style={styles.fechaText}>
          <Ionicons name="calendar-outline" size={13} color={colors.primary} />{" "}
          {formatearFecha(evento.fecha)}
        </Text>

        <Text style={styles.description} numberOfLines={2}>
          {evento.descripcion}
        </Text>

        {/* Organizador y Calificación */}
        <View style={styles.organizerRow}>
          <View style={styles.organizerInfo}>
            <Ionicons name="person-circle-outline" size={16} color={colors.textMuted} />
            <Text style={styles.organizerName} numberOfLines={1}>
              {evento.organizador?.nombreCompleto || "Organizador"}
            </Text>
          </View>
          <RatingStars
            puntuacion={evento.organizador?.puntajePromedio || 0}
            cantidadResenias={evento.organizador?.cantidadResenias}
            size={13}
            mostrarNumero
          />
        </View>

        {/* Footer: Precios y Tipos */}
        <View style={styles.footer}>
          <View>
            <Text style={styles.precioLabel}>Desde</Text>
            <Text style={styles.precioValor}>
              ${evento.precioDesde ? evento.precioDesde.toLocaleString("es-AR") : "Gratis"}
            </Text>
          </View>

          <View style={styles.ticketTypesCount}>
            <Text style={styles.ticketTypesText}>
              {evento.tiposEntrada?.length || 0} tipos de entrada
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    width: "100%",
    height: 160,
    backgroundColor: colors.surfaceAlt,
    position: "relative",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  categoryBadge: {
    position: "absolute",
    top: 12,
    left: 12,
    backgroundColor: "rgba(15, 23, 42, 0.75)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "700",
    textTransform: "uppercase",
  },
  favoriteButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: colors.surface,
    width: 34,
    height: 34,
    borderRadius: 17,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  dateBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  dateBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "700",
  },
  pastBadge: {
    position: "absolute",
    bottom: 12,
    left: 12,
    backgroundColor: colors.textMuted,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pastBadgeText: {
    color: colors.surface,
    fontSize: 11,
    fontWeight: "700",
  },
  body: {
    padding: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 4,
  },
  fechaText: {
    fontSize: 12,
    color: colors.primary,
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  organizerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.surfaceAlt,
    marginBottom: 12,
  },
  organizerInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  organizerName: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    backgroundColor: colors.surfaceAlt,
    marginHorizontal: -16,
    marginBottom: -16,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  precioLabel: {
    fontSize: 10,
    color: colors.textMuted,
    fontWeight: "600",
    textTransform: "uppercase",
  },
  precioValor: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.primary,
  },
  ticketTypesCount: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketTypesText: {
    fontSize: 11,
    color: colors.textMuted,
    fontWeight: "600",
  },
});

export default EventCard;
