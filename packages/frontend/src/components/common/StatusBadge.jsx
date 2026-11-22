import React from "react";
import { View, Text, StyleSheet } from "react-native";
import colors from "../../theme/colors";

const ESTADOS_CONFIG = {
  PENDIENTE: {
    label: "Pendiente de pago",
    color: colors.estadoPendiente,
    bgColor: colors.estadoPendienteBg,
  },
  CONFIRMADA: {
    label: "Confirmada",
    color: colors.estadoConfirmada,
    bgColor: colors.estadoConfirmadaBg,
  },
  UTILIZADA: {
    label: "Utilizada",
    color: colors.estadoUtilizada,
    bgColor: colors.estadoUtilizadaBg,
  },
  CANCELADA: {
    label: "Cancelada",
    color: colors.estadoCancelada,
    bgColor: colors.estadoCanceladaBg,
  },
  REEMBOLSADA: {
    label: "Reembolsada",
    color: "#7C3AED",
    bgColor: "#EDE9FE",
  },
};

export const StatusBadge = ({ estado }) => {
  const config = ESTADOS_CONFIG[estado] || {
    label: estado || "Desconocido",
    color: colors.textMuted,
    bgColor: colors.surfaceAlt,
  };

  return (
    <View style={[styles.badge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.dot, { backgroundColor: config.color }]} />
      <Text style={[styles.text, { color: config.color }]}>{config.label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  text: {
    fontSize: 12,
    fontWeight: "600",
  },
});

export default StatusBadge;
