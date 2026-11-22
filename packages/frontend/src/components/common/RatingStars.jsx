import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import colors from "../../theme/colors";

export const RatingStars = ({
  puntuacion = 0,
  maxEstrellas = 5,
  size = 16,
  interactivo = false,
  onChange = () => {},
  mostrarNumero = false,
  cantidadResenias = null,
}) => {
  const estrellas = [];

  for (let i = 1; i <= maxEstrellas; i++) {
    const seleccionada = i <= puntuacion;
    const media = !seleccionada && i - 0.5 <= puntuacion;
    const iconName = seleccionada
      ? "star"
      : media
      ? "star-half"
      : "star-outline";

    const estrellaView = (
      <Ionicons
        key={i}
        name={iconName}
        size={size}
        color="#F59E0B"
        style={styles.star}
      />
    );

    if (interactivo) {
      estrellas.push(
        <TouchableOpacity
          key={i}
          activeOpacity={0.7}
          onPress={() => onChange(i)}
        >
          {estrellaView}
        </TouchableOpacity>
      );
    } else {
      estrellas.push(estrellaView);
    }
  }

  return (
    <View style={styles.container}>
      <View style={styles.starsRow}>{estrellas}</View>
      {mostrarNumero && puntuacion > 0 && (
        <Text style={styles.numeroText}>{puntuacion.toFixed(1)}</Text>
      )}
      {cantidadResenias !== null && cantidadResenias !== undefined && (
        <Text style={styles.cantidadText}>({cantidadResenias})</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
  },
  starsRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  star: {
    marginRight: 2,
  },
  numeroText: {
    marginLeft: 6,
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
  },
  cantidadText: {
    marginLeft: 4,
    fontSize: 12,
    color: colors.textMuted,
  },
});

export default RatingStars;
