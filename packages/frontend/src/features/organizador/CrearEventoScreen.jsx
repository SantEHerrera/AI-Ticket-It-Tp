import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import colors from "../../theme/colors";
import FeedbackModal from "../../components/common/FeedbackModal";
import organizadorService from "../../service/organizadorService";
import compradorService from "../../service/compradorService";
import { useAuth } from "../../context/AuthContext";

export const CrearEventoScreen = ({ navigation }) => {
  const { isOrganizador } = useAuth();
  const [categorias, setCategorias] = useState([]);
  const [cargandoCategorias, setCargandoCategorias] = useState(true);

  // Formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoriaId, setCategoriaId] = useState(null);
  const [imagenUrl, setImagenUrl] = useState("https://picsum.photos/seed/nuevoevento/800/400");
  const [guardando, setGuardando] = useState(false);

  // Configuración de fecha flexible (mínimo 7 días)
  const [diasDesdeHoy, setDiasDesdeHoy] = useState(14);
  const [horaEvento, setHoraEvento] = useState("21");
  const [minutosEvento, setMinutosEvento] = useState("00");

  // Feedback Modal
  const [feedback, setFeedback] = useState({
    visible: false,
    tipo: "info",
    titulo: "",
    mensaje: "",
    textoConfirmar: "Aceptar",
    onConfirmar: null,
  });

  // Tipos de entrada dinámicos
  const [tiposEntrada, setTiposEntrada] = useState([
    {
      id: "1",
      nombre: "General",
      descripcion: "Acceso al sector principal",
      precio: "8500",
      cupo: "100",
    },
    {
      id: "2",
      nombre: "VIP",
      descripcion: "Ubicación preferencial y consumición",
      precio: "18000",
      cupo: "30",
    },
  ]);

  useEffect(() => {
    const fetchCategorias = async () => {
      try {
        const cats = await compradorService.listarCategorias();
        setCategorias(cats || []);
        if (cats && cats.length > 0) {
          setCategoriaId(cats[0].id);
        }
      } catch (err) {
        console.error("Error al cargar categorías:", err);
      } finally {
        setCargandoCategorias(false);
      }
    };
    fetchCategorias();
  }, []);

  const calcularFechaSeleccionada = () => {
    const fecha = new Date();
    fecha.setDate(fecha.getDate() + Number(diasDesdeHoy || 7));
    const h = parseInt(horaEvento, 10) || 21;
    const m = parseInt(minutosEvento, 10) || 0;
    fecha.setHours(h, m, 0, 0);
    return fecha;
  };

  const fechaPreview = calcularFechaSeleccionada();

  const handleSeleccionarGaleria = async () => {
    try {
      const permiso = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permiso.granted) {
        setFeedback({
          visible: true,
          tipo: "error",
          titulo: "Permiso necesario",
          mensaje: "Se requiere autorización para acceder a las fotos de tu teléfono.",
          textoConfirmar: "Entendido",
          onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
        });
        return;
      }

      const resultado = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.6,
        base64: true,
      });

      if (!resultado.canceled && resultado.assets && resultado.assets.length > 0) {
        const asset = resultado.assets[0];
        const dataUri = asset.base64
          ? `data:${asset.mimeType || "image/jpeg"};base64,${asset.base64}`
          : asset.uri;
        setImagenUrl(dataUri);
      }
    } catch (err) {
      console.error("Error al abrir galería:", err);
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Error al abrir la galería",
        mensaje: "Ocurrió un problema al acceder a las fotos de la galería.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    }
  };

  const handleAgregarTipo = () => {
    const nuevoId = String(Date.now());
    setTiposEntrada((prev) => [
      ...prev,
      {
        id: nuevoId,
        nombre: "",
        descripcion: "",
        precio: "",
        cupo: "",
      },
    ]);
  };

  const handleEliminarTipo = (id) => {
    if (tiposEntrada.length <= 1) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Atención",
        mensaje: "El evento debe ofrecer al menos un tipo de entrada.",
        textoConfirmar: "Entendido",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }
    setTiposEntrada((prev) => prev.filter((t) => t.id !== id));
  };

  const handleCambiarTipo = (id, campo, valor) => {
    setTiposEntrada((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [campo]: valor } : t))
    );
  };

  const handlePublicar = async () => {
    if (!isOrganizador) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Acción no permitida",
        mensaje: "Debes cambiar a un usuario con rol ORGANIZADOR para crear eventos.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (!nombre.trim() || !descripcion.trim()) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Campos incompletos",
        mensaje: "Por favor completa el nombre y la descripción detallada del evento.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    if (!categoriaId) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Categoría requerida",
        mensaje: "Por favor selecciona una categoría para el evento.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    // Validar mínimo 7 días
    const diasNum = Number(diasDesdeHoy);
    if (isNaN(diasNum) || diasNum < 7) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Anticipación mínima",
        mensaje: "El evento debe programarse con al menos 7 días de anticipación (1 semana).",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    // Validar hora (0–23) y minutos (0–59)
    const h = parseInt(horaEvento, 10);
    const m = parseInt(minutosEvento, 10);
    if (isNaN(h) || h < 0 || h > 23) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Hora inválida",
        mensaje: "La hora debe ser un número entre 0 y 23.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }
    if (isNaN(m) || m < 0 || m > 59) {
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Minutos inválidos",
        mensaje: "Los minutos deben ser un número entre 0 y 59.",
        textoConfirmar: "Aceptar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
      return;
    }

    // Validar tipos de entrada
    for (const t of tiposEntrada) {
      if (!t.nombre.trim()) {
        setFeedback({
          visible: true,
          tipo: "error",
          titulo: "Sector sin nombre",
          mensaje: "Cada tipo de entrada debe contar con un nombre (ej. General, VIP, Platea).",
          textoConfirmar: "Aceptar",
          onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
        });
        return;
      }
      const p = Number(t.precio);
      const c = Number(t.cupo);
      if (isNaN(p) || p < 0) {
        setFeedback({
          visible: true,
          tipo: "error",
          titulo: "Precio inválido",
          mensaje: `El precio para "${t.nombre}" debe ser un número mayor o igual a 0.`,
          textoConfirmar: "Aceptar",
          onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
        });
        return;
      }
      if (!Number.isInteger(c) || c < 1) {
        setFeedback({
          visible: true,
          tipo: "error",
          titulo: "Cupo inválido",
          mensaje: `El cupo de "${t.nombre}" debe ser un entero mayor o igual a 1.`,
          textoConfirmar: "Aceptar",
          onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
        });
        return;
      }
    }

    const payload = {
      nombre: nombre.trim(),
      descripcion: descripcion.trim(),
      categoriaId,
      fecha: fechaPreview.toISOString(),
      tiposEntrada: tiposEntrada.map((t) => ({
        nombre: t.nombre.trim(),
        descripcion: t.descripcion.trim(),
        precio: Number(t.precio),
        cupo: Number(t.cupo),
      })),
      multimedia: imagenUrl ? [imagenUrl] : [],
    };

    setFeedback({
      visible: true,
      tipo: "confirm",
      titulo: "¿Publicar este Evento?",
      mensaje: `¿Deseas publicar "${payload.nombre}" en la plataforma? Quedará disponible inmediatamente en el catálogo.`,
      textoConfirmar: "Sí, publicar ahora",
      textoCancelar: "Revisar",
      onConfirmar: () => ejecutarPublicacion(payload),
      onCancelar: () => setFeedback((prev) => ({ ...prev, visible: false })),
    });
  };

  const ejecutarPublicacion = async (payload) => {
    try {
      setFeedback((prev) => ({ ...prev, visible: false }));
      setGuardando(true);
      await organizadorService.crearEvento(payload);

      setFeedback({
        visible: true,
        tipo: "success",
        titulo: "¡Evento Publicado!",
        mensaje: `"${payload.nombre}" ya está publicado y disponible para los compradores en el catálogo.`,
        textoConfirmar: "Ir a Mis Eventos",
        onConfirmar: () => {
          setFeedback((prev) => ({ ...prev, visible: false }));
          setNombre("");
          setDescripcion("");
          setImagenUrl("https://picsum.photos/seed/nuevoevento/800/400");
          if (navigation?.navigate) {
            navigation.navigate("Mis Eventos");
          }
        },
      });
    } catch (err) {
      const msg = err.response?.data?.error || err.message || "Error al publicar evento";
      setFeedback({
        visible: true,
        tipo: "error",
        titulo: "Error al publicar",
        mensaje: msg,
        textoConfirmar: "Cerrar",
        onConfirmar: () => setFeedback((prev) => ({ ...prev, visible: false })),
      });
    } finally {
      setGuardando(false);
    }
  };

  if (!isOrganizador) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={48} color={colors.warning} />
        <Text style={styles.emptyTitle}>Modo Comprador Activo</Text>
        <Text style={styles.emptySubtitle}>
          Cambia al usuario organizador (ej: Lucía Gómez o Martín Pérez) en la barra superior para publicar eventos.
        </Text>
      </View>
    );
  }

  const opcionesRapidasDias = [7, 14, 21, 30, 60, 90];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Publicar Nuevo Evento</Text>
        <Text style={styles.subtitle}>
          Configura fecha, descripción, fotos y entradas
        </Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Datos Principales */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>Nombre del Evento *</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Festival Rock del Plata"
            placeholderTextColor={colors.textLight}
            value={nombre}
            onChangeText={setNombre}
          />

          <Text style={styles.fieldLabel}>Categoría *</Text>
          {cargandoCategorias ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <View style={styles.chipsRow}>
              {categorias.map((cat) => {
                const isSelected = categoriaId === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[
                      styles.chip,
                      isSelected && styles.chipActive,
                    ]}
                    onPress={() => setCategoriaId(cat.id)}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextActive,
                      ]}
                    >
                      {cat.nombre}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          <Text style={styles.fieldLabel}>Descripción detallada *</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            placeholder="Cuéntale al público de qué trata el espectáculo, horarios, artistas..."
            placeholderTextColor={colors.textLight}
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
            numberOfLines={4}
          />

          {/* Selector de Fecha Flexible con mínimo 7 días */}
          <Text style={styles.fieldLabel}>Fecha y Horario del Evento (Mínimo 1 semana)</Text>
          <Text style={styles.fieldHelp}>
            Elige los días de anticipación o ajústalo libremente:
          </Text>

          {/* Accesos rápidos */}
          <View style={styles.diasRow}>
            {opcionesRapidasDias.map((d) => (
              <TouchableOpacity
                key={d}
                style={[
                  styles.diaBtn,
                  diasDesdeHoy === d && styles.diaBtnActive,
                ]}
                onPress={() => setDiasDesdeHoy(d)}
              >
                <Text
                  style={[
                    styles.diaBtnText,
                    diasDesdeHoy === d && styles.diaBtnTextActive,
                  ]}
                >
                  +{d}d
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Ajuste manual de días */}
          <View style={styles.stepperContainer}>
            <Text style={styles.stepperLabel}>Anticipación en días:</Text>
            <View style={styles.stepperControls}>
              <TouchableOpacity
                style={[styles.stepperBtn, diasDesdeHoy <= 7 && styles.stepperBtnDisabled]}
                onPress={() => setDiasDesdeHoy((prev) => Math.max(7, Number(prev || 7) - 1))}
                disabled={diasDesdeHoy <= 7}
              >
                <Ionicons name="remove" size={18} color={diasDesdeHoy <= 7 ? colors.textLight : colors.text} />
              </TouchableOpacity>
              <TextInput
                style={styles.stepperInput}
                keyboardType="numeric"
                value={String(diasDesdeHoy)}
                onChangeText={(val) => {
                  const n = parseInt(val, 10);
                  setDiasDesdeHoy(isNaN(n) ? "" : n);
                }}
              />
              <Text style={{ fontSize: 13, color: colors.textMuted }}>días</Text>
              <TouchableOpacity
                style={styles.stepperBtn}
                onPress={() => setDiasDesdeHoy((prev) => Number(prev || 7) + 1)}
              >
                <Ionicons name="add" size={18} color={colors.text} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Horario */}
          <View style={styles.horaRow}>
            <Text style={styles.horaLabel}>Horario del espectáculo:</Text>
            <View style={styles.horaInputs}>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                maxLength={2}
                value={horaEvento}
                onChangeText={setHoraEvento}
                placeholder="21"
              />
              <Text style={styles.timeColon}>:</Text>
              <TextInput
                style={styles.timeInput}
                keyboardType="numeric"
                maxLength={2}
                value={minutosEvento}
                onChangeText={setMinutosEvento}
                placeholder="00"
              />
              <Text style={styles.timeHs}>hs</Text>
            </View>
          </View>

          {/* Vista previa de fecha */}
          <View style={styles.previewDateBox}>
            <Ionicons name="calendar-sharp" size={18} color={colors.primary} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={styles.previewDateTitle}>Fecha calculada del evento:</Text>
              <Text style={styles.previewDateText}>
                {fechaPreview.toLocaleDateString("es-AR", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })} a las {horaEvento.padStart(2, "0")}:{minutosEvento.padStart(2, "0")} hs
              </Text>
              <Text style={styles.previewDateSub}>
                Faltan {diasDesdeHoy} días para la realización
              </Text>
            </View>
          </View>

          {/* Selección de Imagen (Galería o URL) */}
          <Text style={styles.fieldLabel}>Imagen de Portada del Evento</Text>
          <Text style={styles.fieldHelp}>
            Puedes elegir una foto desde la galería de tu teléfono o ingresar un enlace web:
          </Text>

          <TouchableOpacity
            style={styles.galleryBtn}
            onPress={handleSeleccionarGaleria}
            activeOpacity={0.8}
          >
            <Ionicons name="images-outline" size={20} color={colors.primary} />
            <Text style={styles.galleryBtnText}>
              {imagenUrl ? "Cambiar foto desde la galería" : "Seleccionar foto de la galería"}
            </Text>
          </TouchableOpacity>

          {imagenUrl ? (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: imagenUrl }}
                style={styles.imagePreview}
                resizeMode="cover"
              />
              <View style={styles.imagePreviewOverlay}>
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setImagenUrl("")}
                  activeOpacity={0.8}
                >
                  <Ionicons name="trash-outline" size={15} color={colors.surface} />
                  <Text style={styles.removeImageText}>Quitar</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          <Text style={[styles.fieldLabel, { marginTop: 8, fontSize: 12 }]}>
            O ingresar URL web de la imagen:
          </Text>
          <TextInput
            style={styles.input}
            placeholder="https://..."
            placeholderTextColor={colors.textLight}
            value={imagenUrl}
            onChangeText={setImagenUrl}
          />
        </View>

        {/* Configuración de Entradas */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardHeading}>Tipos de Entrada</Text>
            <TouchableOpacity
              style={styles.addTypeBtn}
              onPress={handleAgregarTipo}
            >
              <Ionicons name="add" size={16} color={colors.primary} />
              <Text style={styles.addTypeBtnText}>Agregar Tipo</Text>
            </TouchableOpacity>
          </View>

          {tiposEntrada.map((tipo, idx) => (
            <View key={tipo.id} style={styles.ticketTypeItem}>
              <View style={styles.ticketTypeHeader}>
                <Text style={styles.ticketTypeNum}>Sector #{idx + 1}</Text>
                {tiposEntrada.length > 1 && (
                  <TouchableOpacity
                    onPress={() => handleEliminarTipo(tipo.id)}
                    style={styles.deleteTypeBtn}
                  >
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                )}
              </View>

              <TextInput
                style={styles.inputMini}
                placeholder="Nombre (ej. General, VIP, Platea)"
                placeholderTextColor={colors.textLight}
                value={tipo.nombre}
                onChangeText={(val) => handleCambiarTipo(tipo.id, "nombre", val)}
              />

              <TextInput
                style={styles.inputMini}
                placeholder="Descripción (ej. Acceso a sector preferencial)"
                placeholderTextColor={colors.textLight}
                value={tipo.descripcion}
                onChangeText={(val) => handleCambiarTipo(tipo.id, "descripcion", val)}
              />

              <View style={styles.rowMini}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.inputMiniLabel}>Precio ($)</Text>
                  <TextInput
                    style={styles.inputMini}
                    placeholder="0"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    value={tipo.precio}
                    onChangeText={(val) => handleCambiarTipo(tipo.id, "precio", val)}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.inputMiniLabel}>Cupo disponible</Text>
                  <TextInput
                    style={styles.inputMini}
                    placeholder="100"
                    placeholderTextColor={colors.textLight}
                    keyboardType="numeric"
                    value={tipo.cupo}
                    onChangeText={(val) => handleCambiarTipo(tipo.id, "cupo", val)}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Botón de Publicar */}
        <TouchableOpacity
          style={[styles.publishBtn, guardando && styles.publishBtnDisabled]}
          onPress={handlePublicar}
          disabled={guardando}
          activeOpacity={0.8}
        >
          {guardando ? (
            <ActivityIndicator color={colors.surface} />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={20} color={colors.surface} />
              <Text style={styles.publishBtnText}>Publicar Evento</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* Modal de Feedback */}
      <FeedbackModal
        visible={feedback.visible}
        tipo={feedback.tipo}
        titulo={feedback.titulo}
        mensaje={feedback.mensaje}
        textoConfirmar={feedback.textoConfirmar}
        onConfirmar={feedback.onConfirmar}
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
  scroll: {
    flex: 1,
    padding: 16,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
    marginTop: 8,
  },
  fieldHelp: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 8,
  },
  input: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.surface,
  },
  diasRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginBottom: 10,
  },
  diaBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  diaBtnActive: {
    backgroundColor: colors.primaryLight,
    borderColor: colors.primary,
  },
  diaBtnText: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.textMuted,
  },
  diaBtnTextActive: {
    color: colors.primary,
    fontWeight: "700",
  },
  stepperContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surfaceAlt,
    padding: 10,
    borderRadius: 12,
    marginBottom: 10,
  },
  stepperLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  stepperControls: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepperBtnDisabled: {
    opacity: 0.4,
  },
  stepperInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingVertical: 4,
    paddingHorizontal: 8,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    minWidth: 44,
    textAlign: "center",
  },
  horaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  horaLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.text,
  },
  horaInputs: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timeInput: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 8,
    paddingVertical: 4,
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    width: 38,
    textAlign: "center",
  },
  timeColon: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  timeHs: {
    fontSize: 12,
    color: colors.textMuted,
    fontWeight: "600",
    marginLeft: 2,
  },
  previewDateBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: colors.primaryLight,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  previewDateTitle: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.primaryDark,
    textTransform: "uppercase",
  },
  previewDateText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginTop: 2,
    textTransform: "capitalize",
  },
  previewDateSub: {
    fontSize: 11,
    color: colors.primaryDark,
    marginTop: 2,
  },
  galleryBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primaryLight,
    borderWidth: 1.5,
    borderColor: colors.primary,
    borderStyle: "dashed",
    borderRadius: 14,
    paddingVertical: 13,
    marginBottom: 12,
  },
  galleryBtnText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.primary,
  },
  imagePreviewContainer: {
    borderRadius: 14,
    overflow: "hidden",
    position: "relative",
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surfaceAlt,
  },
  imagePreview: {
    width: "100%",
    height: 180,
  },
  imagePreviewOverlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  removeImageBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(239, 68, 68, 0.85)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  removeImageText: {
    color: colors.surface,
    fontSize: 12,
    fontWeight: "700",
  },
  cardHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  addTypeBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  addTypeBtnText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  ticketTypeItem: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ticketTypeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  ticketTypeNum: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primaryDark,
  },
  deleteTypeBtn: {
    padding: 2,
  },
  inputMini: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    fontSize: 13,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 6,
  },
  inputMiniLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.textMuted,
    marginBottom: 2,
  },
  rowMini: {
    flexDirection: "row",
  },
  publishBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 40,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  publishBtnDisabled: {
    backgroundColor: colors.textLight,
  },
  publishBtnText: {
    color: colors.surface,
    fontSize: 16,
    fontWeight: "700",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
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
});

export default CrearEventoScreen;
