import React, { useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { SafeAreaProvider, useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

import colors from "./theme/colors";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Header from "./components/headers/Header";
import NetworkSettingsModal from "./components/headers/NetworkSettingsModal";
import LoginScreen from "./features/auth/LoginScreen";

// Pantallas Comprador
import ExplorarScreen from "./features/comprador/ExplorarScreen";
import FavoritosScreen from "./features/comprador/FavoritosScreen";
import MisComprasScreen from "./features/comprador/MisComprasScreen";

// Pantallas Organizador
import MisEventosScreen from "./features/organizador/MisEventosScreen";
import MensajesOrganizadorScreen from "./features/organizador/MensajesOrganizadorScreen";
import CrearEventoScreen from "./features/organizador/CrearEventoScreen";

const Tab = createBottomTabNavigator();

function MainNavigator() {
  const { isAutenticado, isOrganizador, cargando, error, inicializarAuth } = useAuth();
  const [modalNetworkVisible, setModalNetworkVisible] = useState(false);
  const insets = useSafeAreaInsets();

  const safeBottomPadding = Math.max(
    insets.bottom,
    Platform.OS === "android" ? 32 : 16
  );
  const tabBarHeight = 56 + safeBottomPadding;

  if (cargando) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Conectando con AI Ticket It...</Text>
      </View>
    );
  }

  if (error && !isAutenticado) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="cloud-offline-outline" size={56} color={colors.danger} />
        <Text style={styles.errorTitle}>Error de Conexión</Text>
        <Text style={styles.errorSubtitle}>{error}</Text>

        <TouchableOpacity
          style={styles.configServerBtn}
          onPress={() => setModalNetworkVisible(true)}
        >
          <Ionicons name="server-outline" size={18} color={colors.surface} />
          <Text style={styles.configServerBtnText}>Configurar IP del Servidor</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.reintentarBtn}
          onPress={inicializarAuth}
        >
          <Text style={styles.reintentarBtnText}>Reintentar conexión</Text>
        </TouchableOpacity>

        <NetworkSettingsModal
          visible={modalNetworkVisible}
          onClose={() => setModalNetworkVisible(false)}
          onUrlChanged={inicializarAuth}
        />
      </View>
    );
  }

  if (!isAutenticado) {
    return <LoginScreen />;
  }

  return (
    <View style={{ flex: 1 }}>
      <Header />
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: colors.primary,
            tabBarInactiveTintColor: colors.textMuted,
            tabBarStyle: {
              backgroundColor: colors.surface,
              borderTopColor: colors.border,
              borderTopWidth: 1,
              height: tabBarHeight,
              paddingBottom: safeBottomPadding,
              paddingTop: 8,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: "700",
            },
          }}
        >
          {isOrganizador ? (
            <>
              <Tab.Screen
                name="Mis Eventos"
                component={MisEventosScreen}
                options={{
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="calendar" size={size} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Mensajes"
                component={MensajesOrganizadorScreen}
                options={{
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="chatbubbles" size={size} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Publicar"
                component={CrearEventoScreen}
                options={{
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="add-circle" size={size} color={color} />
                  ),
                }}
              />
            </>
          ) : (
            <>
              <Tab.Screen
                name="Explorar"
                component={ExplorarScreen}
                options={{
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="compass" size={size} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Favoritos"
                component={FavoritosScreen}
                options={{
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="heart" size={size} color={color} />
                  ),
                }}
              />
              <Tab.Screen
                name="Mis Compras"
                component={MisComprasScreen}
                options={{
                  tabBarIcon: ({ color, size }) => (
                    <Ionicons name="ticket" size={size} color={color} />
                  ),
                }}
              />
            </>
          )}
        </Tab.Navigator>
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider style={styles.container}>
      <StatusBar style="dark" />
      <AuthProvider>
        <MainNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    backgroundColor: colors.background,
  },
  loadingText: {
    marginTop: 14,
    fontSize: 14,
    color: colors.textMuted,
    fontWeight: "600",
  },
  errorTitle: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  errorSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: colors.textMuted,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 16,
  },
  configServerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 10,
  },
  configServerBtnText: {
    color: colors.surface,
    fontSize: 14,
    fontWeight: "700",
  },
  reintentarBtn: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  reintentarBtnText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
});
