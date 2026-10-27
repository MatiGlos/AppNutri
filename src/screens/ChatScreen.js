import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Alert,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';
import WeeklyProgressBar from '../components/WeeklyProgressBar';
import ChatMessage from '../components/ChatMessage';
import { AICopilotService } from '../services/aiCopilotService';
import { relationalStore } from '../data/relationalStore';
import { NutriEngineService } from '../services/nutriEngineService';

// Mock interactivo inicial de la conversación
const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: '¡Hola Mati! 👋 Recuerda que en AppNutri no hay comidas prohibidas ni días arruinados. Todo se gestiona con tu presupuesto semanal dinámico.',
    time: '14:20',
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'Hola... hoy saldré con amigos y se me antoja un helado de chocolate de 500 kcal 🍨 ¿arruinará mi meta semanal?',
    time: '14:21',
  },
  {
    id: 'msg-3',
    sender: 'bot',
    text: '¡Cero culpa! Disfrutar con amigos es vital. Tienes dos caminos inteligentes: puedes disfrutar el helado original y tu presupuesto lo amortizará en los días restantes, o elegir esta alternativa del Grafo con alta proteína:',
    time: '14:22',
  },
  {
    id: 'msg-4',
    sender: 'bot',
    cardType: 'food_replacement',
    cardData: {
      alimentoOriginal: 'Helado de Crema',
      caloriasOriginal: 500,
      alimentoSugerido: 'Yogurt Griego & Berries',
      caloriasSugerido: 180,
      porcion: '1 copa mediana (180g)',
      tags: ['Alto en Proteína', 'Antojo Dulce', 'Cremoso'],
      ahorroKcal: 320,
    },
    time: '14:23',
  },
];

const SUGGESTION_CHIPS = [
  { id: '1', label: '🍕 2 porciones de pizza (+580 kcal)', query: 'Comí 2 porciones de pizza de 580 kcal' },
  { id: '2', label: '🍫 Tengo antojo de chocolate', query: 'Tengo antojo de algo dulce' },
  { id: '3', label: '📊 Ver balance semanal', query: '¿Cómo va mi presupuesto semanal?' },
  { id: '4', label: '☕ Merienda ligera', query: 'Sugiéreme un snack de menos de 150 kcal' },
];

export default function ChatScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  const [cameraModalVisible, setCameraModalVisible] = useState(false);
  const [keyModalVisible, setKeyModalVisible] = useState(false);
  const [iaStatus, setIaStatus] = useState(() => AICopilotService.getStatusIA());
  const [geminiInput, setGeminiInput] = useState(() => AICopilotService.getAPIKeys().gemini || '');
  const [openaiInput, setOpenaiInput] = useState(() => AICopilotService.getAPIKeys().openai || '');
  
  // Estado del presupuesto diario y semanal reactivo sincronizado con relationalStore
  const [weeklyBudget, setWeeklyBudget] = useState(() => {
    const pres = relationalStore.getPresupuestoSemanal('pac_001');
    const consumidas = (pres?.calorias_consumidas_semana || 7200) - (pres?.calorias_amortizandose || 0);
    const desviacion = pres?.calorias_amortizandose || 0;
    const cuotaDiaria = pres?.cuota_diaria_recalculada || 1875;
    return {
      total: 14000,
      consumidas,
      desviacion,
      diaActual: pres?.dia_actual_ciclo || 4,
      diasTotales: 7,
      cuotaDiaria,
      consumidasHoy: 1240,
      baseDiaria: 2000,
    };
  });

  const flatListRef = useRef(null);

  // Sincronización reactiva con relationalStore
  useEffect(() => {
    const syncBudget = () => {
      const pres = relationalStore.getPresupuestoSemanal('pac_001');
      if (pres) {
        const consumidas = pres.calorias_consumidas_semana - pres.calorias_amortizandose;
        setWeeklyBudget((prev) => ({
          ...prev,
          total: 14000,
          consumidas,
          desviacion: pres.calorias_amortizandose,
          diaActual: pres.dia_actual_ciclo,
          diasTotales: 7,
          cuotaDiaria: pres.cuota_diaria_recalculada || 1875,
        }));
      }
    };

    syncBudget();
    const unsubscribe = relationalStore.subscribe(syncBudget);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Scroll al último mensaje
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 150);
  }, [messages]);

  const handleSend = (textToSend) => {
    const text = textToSend || inputText;
    if (!text.trim()) return;

    const userMsgId = `usr-${Date.now()}`;
    const newMsg = {
      id: userMsgId,
      sender: 'user',
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputText('');

    // Respuesta inteligente mediante AICopilotService (GraphRAG + Privacy by Design)
    setTimeout(async () => {
      await generateBotResponse(text);
    }, 400);
  };

  const generateBotResponse = async (userText) => {
    const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    try {
      const aiResult = await AICopilotService.procesarMensaje(userText, 'pac_001', messages);

      let cardType = null;
      let cardData = null;

      if (aiResult.tarjeta_reemplazo) {
        cardType = 'food_replacement';
        const ahorro = Math.max(
          0,
          (aiResult.tarjeta_reemplazo.kcal_original || 0) - (aiResult.tarjeta_reemplazo.kcal_sugerencia || 0)
        );
        cardData = {
          alimentoOriginal: aiResult.tarjeta_reemplazo.original,
          caloriasOriginal: aiResult.tarjeta_reemplazo.kcal_original,
          alimentoSugerido: aiResult.tarjeta_reemplazo.sugerencia,
          caloriasSugerido: aiResult.tarjeta_reemplazo.kcal_sugerencia,
          porcion: aiResult.tarjeta_reemplazo.porcion,
          tags: aiResult.tarjeta_reemplazo.tags || ['Sustituto Grafo', 'Equivalente'],
          ahorroKcal: ahorro,
        };
      } else if (aiResult.tarjeta_compensacion) {
        cardType = 'compensation_summary';
        cardData = {
          caloriasExceso: aiResult.tarjeta_compensacion.calorias_exceso,
          diasRestantes: aiResult.tarjeta_compensacion.dias_restantes,
          reduccionDiaria: aiResult.tarjeta_compensacion.reduccion_diaria,
          tmbSegura: !aiResult.tarjeta_compensacion.alerta_limite_tmb,
        };
      }

      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: aiResult.respuesta_texto,
        cardType,
        cardData,
        time: botTime,
      };

      setMessages((prev) => [...prev, botResponse]);
    } catch (error) {
      console.error('Error procesando respuesta con AICopilotService:', error);
      const fallbackResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '¡Tranquilo! Tu presupuesto semanal dinámico sigue activo y protegiendo tu metabolismo. Continuemos con tu pauta sin culpa.',
        time: botTime,
      };
      setMessages((prev) => [...prev, fallbackResponse]);
    }
  };

  // Botón Verde en Tarjeta: 'Elegir este reemplazo'
  const handleSelectReplacement = (msgId, data) => {
    const caloriasSugerido = data?.caloriasSugerido || 180;
    const alimentoSugerido = data?.alimentoSugerido || 'Yogurt Griego & Berries';
    const ahorroKcal = data?.ahorroKcal || 320;

    // 1. Registrar evento tipo Sustitucion_Grafo en Registros_Consumo_y_Comportamiento
    relationalStore.agregarRegistroConsumo({
      id_paciente: 'pac_001',
      tipo_interaccion: 'Sustitucion_Grafo',
      alimento_detectado: alimentoSugerido,
      calorias_estimadas: caloriasSugerido,
      nivel_hambre_previa: 3,
      contexto_emocional: 'Reemplazo inteligente del Grafo aceptado',
    });

    // 2. Sumar solo las calorías del sustituto sin aumentar el contador naranja de compensación
    const pres = relationalStore.getPresupuestoSemanal('pac_001');
    if (pres) {
      const nuevoConsumo = pres.calorias_consumidas_semana + caloriasSugerido;
      relationalStore.actualizarPresupuesto(pres.id_presupuesto, {
        calorias_consumidas_semana: nuevoConsumo,
        calorias_restantes_semana: Math.max(0, 14000 - nuevoConsumo),
      });
    }

    const confirmMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `¡Elegí el reemplazo: ${alimentoSugerido}! 🍓`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const botReply = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `¡Excelente decisión! 🍓 Sumaste ${caloriasSugerido} kcal de alto valor biológico y ahorraste ${ahorroKcal} kcal. Tu presupuesto semanal sigue en balance perfecto sin necesidad de compensación. 🎉`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, confirmMsg, botReply]);
  };

  // Botón Secundario en Tarjeta: 'Comer original y compensar semana'
  const handleKeepOriginal = (msgId, data) => {
    const caloriasOriginal = data?.caloriasOriginal || 500;
    const alimentoOriginal = data?.alimentoOriginal || 'Helado de Crema';

    // 1. Mensaje de elección del usuario
    const userMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `Opté por comer ${alimentoOriginal} (${caloriasOriginal} kcal) y compensar en la semana 🍨`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    // 2. Invocar motor determinista de compensación semanal (actualiza presupuesto y registra Desviacion_Compensada)
    const resultado = NutriEngineService.calcularCompensacionSemanal(caloriasOriginal, 'pac_001');

    // 3. Respuesta empática del bot con la tarjeta de compensación calculada
    const botReply = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `¡Disfrútalo sin culpa! 🎉 Tu presupuesto semanal absorbió las +${caloriasOriginal} kcal. Amortizamos -${resultado.descuento_diario_aplicado} kcal/día en tus ${resultado.dias_restantes} días restantes (cuota segura: ${resultado.cuota_diaria_recalculada} kcal/día). Tu metabolismo basal sigue 100% protegido.`,
      cardType: 'compensation_summary',
      cardData: {
        caloriasExceso: caloriasOriginal,
        diasRestantes: resultado.dias_restantes,
        reduccionDiaria: resultado.descuento_diario_aplicado,
        tmbSegura: !resultado.alerta_limite_tmb,
      },
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg, botReply]);
  };

  const handleConfirmCompensation = (msgId, data) => {
    const botReply = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `✅ ¡Ajuste confirmado! Tus días restantes fueron adaptados automáticamente a -${data.reduccionDiaria} kcal. Relájate y sigue tu día con energía.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, botReply]);
  };

  // Simulación de Visión por Computador (Botón de Cámara)
  const handleCameraOption = (optionType) => {
    setCameraModalVisible(false);
    const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (optionType === 'refrigerator') {
      const userMsg = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: '📸 [Foto subida: Interior de Refrigerador]\nMe quedan muy pocos huevos y algunas verduras... ¿Con qué puedo armar un desayuno rico y proteico que encaje en mi pauta?',
        time: botTime,
      };

      setTimeout(() => {
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '🔍 ¡Analicé la foto de tu refrigerador! Detecté escasez de huevos de gallina. Al consultar tu Grafo de Conocimiento con tus restricciones activas, tu mejor sustituto directo de alto valor biológico es **Tofu Revuelto con Cúrcuma & Espinaca** (o quesillo fresco si no eres intolerante). Aquí tienes la tarjeta de intercambio lista:',
          cardType: 'food_replacement',
          cardData: {
            alimentoOriginal: 'Huevo de Gallina (2 unidades)',
            caloriasOriginal: 143,
            alimentoSugerido: 'Tofu Revuelto con Cúrcuma & Espinaca',
            caloriasSugerido: 114,
            porcion: '1 plato mediano (150g)',
            tags: ['Proteína Magra Desayuno', 'Antiinflamatorio', 'Sin Lactosa'],
            ahorroKcal: 29,
          },
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
      }, 500);

      setMessages((prev) => [...prev, userMsg]);
    } else if (optionType === 'social_food') {
      const userMsg = {
        id: `usr-${Date.now()}`,
        sender: 'user',
        text: '📸 [Foto subida: Plato de Comida Social]\nFui a una pizzería con amigos anoche y comí pizza... ¿cómo lo registramos?',
        time: botTime,
      };

      setTimeout(() => {
        const botReply = {
          id: `bot-${Date.now()}`,
          sender: 'bot',
          text: '¡Se ve deliciosa esa pizza! 🍕 Por criterio clínico y seguridad psicológica (Regla 4: Manejo de Incertidumbre), ante fotos o platos ambiguos NO aplicamos descuentos automáticos para evitar errores o subestimación.\n\nPara calibrar tu presupuesto con precisión: ¿cuántas porciones fueron aproximadamente?',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };
        setMessages((prev) => [...prev, botReply]);
      }, 500);

      setMessages((prev) => [...prev, userMsg]);
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      'Limpiar conversación',
      '¿Deseas reiniciar el historial del chat? Tu presupuesto semanal y registros no se borrarán.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpiar',
          style: 'destructive',
          onPress: () => {
            setMessages([
              {
                id: `msg-${Date.now()}`,
                sender: 'bot',
                text: '¡Conversación reiniciada! 👋 Recuerda que en AppNutri no hay días arruinados ni alimentos prohibidos. Estoy aquí para acompañarte sin culpa. ¿Qué comiste o qué se te antoja hoy?',
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              },
            ]);
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <View style={styles.webContainer}>

      {/* 1. Header de Navegación del Chat con Toggle de Tema y Limpieza */}
      <View style={[styles.navBar, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={styles.navUserSection}>
          <View style={[styles.avatarWrapper, { backgroundColor: theme.primaryLight, borderColor: theme.primary }]}>
            <Ionicons name="sparkles" size={18} color={theme.primary} />
            <View style={[styles.onlineBadge, { borderColor: theme.surface }]} />
          </View>
          <View>
            <Text style={[styles.navTitle, { color: theme.text }]}>NutriBot Coach</Text>
            <Text style={[styles.navSubtitle, { color: theme.primaryDark }]}>
              Presupuesto semanal dinámico · En línea
            </Text>
          </View>
        </View>

        {/* Botones de acción en cabecera: Configurar IA, Limpiar chat y Alternar Tema */}
        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={[
              styles.themeToggleButton,
              {
                backgroundColor: iaStatus.connected ? theme.primaryLight : theme.borderLight,
                borderColor: iaStatus.connected ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setKeyModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iaStatus.connected ? "sparkles" : "key-outline"}
              size={17}
              color={iaStatus.connected ? theme.primaryDark : theme.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeToggleButton, { backgroundColor: theme.borderLight, borderColor: theme.border }]}
            onPress={handleClearChat}
            activeOpacity={0.7}
          >
            <Ionicons
              name="trash-outline"
              size={17}
              color={theme.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.themeToggleButton, { backgroundColor: theme.borderLight, borderColor: theme.border }]}
            onPress={toggleTheme}
            activeOpacity={0.7}
          >
            <Ionicons
              name={isDark ? 'sunny' : 'moon'}
              size={18}
              color={isDark ? '#FACC15' : theme.text}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. Componente de Progreso Diario & Semanal (Header visual de la app) */}
      <WeeklyProgressBar
        presupuestoSemanal={weeklyBudget.total}
        caloriasConsumidasBase={weeklyBudget.consumidas}
        caloriasDesviacion={weeklyBudget.desviacion}
        diaActual={weeklyBudget.diaActual}
        diasTotales={weeklyBudget.diasTotales}
        caloriasConsumidasHoy={weeklyBudget.consumidasHoy}
        cuotaDiariaRecalculada={weeklyBudget.cuotaDiaria}
        caloriasBaseDiaria={weeklyBudget.baseDiaria}
      />

      {/* 3. Feed de Mensajes tipo WhatsApp / iMessage */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 10 : 0}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              onSelectReplacement={handleSelectReplacement}
              onKeepOriginal={() => handleKeepOriginal(item.id, item.cardData)}
              onConfirmCompensation={handleConfirmCompensation}
            />
          )}
          contentContainerStyle={styles.chatListContent}
          showsVerticalScrollIndicator={false}
        />

        {/* 4. Barra de Sugerencias Rápidas (Chips) */}
        <View style={[styles.chipsContainer, { backgroundColor: theme.background }]}>
          <FlatList
            horizontal
            data={SUGGESTION_CHIPS}
            keyExtractor={(item) => item.id}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsContent}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chipButton, { backgroundColor: theme.chipBg, borderColor: theme.border }]}
                onPress={() => handleSend(item.query)}
                activeOpacity={0.7}
              >
                <Text style={[styles.chipText, { color: theme.text }]}>{item.label}</Text>
              </TouchableOpacity>
            )}
          />
        </View>

        {/* 5. Input Bar Inferior */}
        <View style={[styles.inputContainer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity
            style={styles.attachButton}
            activeOpacity={0.7}
            onPress={() => setCameraModalVisible(true)}
          >
            <Ionicons name="camera-outline" size={22} color={theme.primary} />
          </TouchableOpacity>

          <View style={[styles.inputPill, { backgroundColor: theme.inputBg, borderColor: theme.border }]}>
            <TextInput
              style={[styles.textInput, { color: theme.text }]}
              placeholder="Cuéntame qué comiste o tu antojo..."
              placeholderTextColor={theme.textLight}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={400}
            />
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
              inputText.trim()
                ? [styles.sendButtonActive, { backgroundColor: theme.primary }]
                : [styles.sendButtonDisabled, { backgroundColor: theme.border }],
            ]}
            onPress={() => handleSend()}
            disabled={!inputText.trim()}
            activeOpacity={0.8}
          >
            <Ionicons
              name="send"
              size={18}
              color={inputText.trim() ? '#FFFFFF' : theme.textLight}
            />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* 6. Modal de Simulación de Visión por Computador (Botón de Cámara) */}
      <Modal
        visible={cameraModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCameraModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.cameraModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cameraModalHeader}>
              <View style={[styles.cameraIconBox, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="camera" size={20} color={theme.primary} />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.cameraModalTitle, { color: theme.text }]}>
                  Reconocimiento Visual Nutricional
                </Text>
                <Text style={[styles.cameraModalSubtitle, { color: theme.textMuted }]}>
                  Simula la detección con GraphRAG & Privacidad
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setCameraModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelpText, { color: theme.textMuted }]}>
              Selecciona una fotografía de prueba para procesar en el motor:
            </Text>

            {/* Opción 1: Refrigerador */}
            <TouchableOpacity
              style={[styles.photoOptionCard, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => handleCameraOption('refrigerator')}
              activeOpacity={0.75}
            >
              <View style={[styles.photoOptionIconCircle, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="snow-outline" size={24} color={theme.primary} />
              </View>
              <View style={styles.photoOptionTextCol}>
                <View style={styles.photoOptionBadgeRow}>
                  <Text style={[styles.photoOptionTitle, { color: theme.text }]}>
                    Interior de refrigerador
                  </Text>
                  <View style={[styles.tagMini, { backgroundColor: theme.primaryLight }]}>
                    <Text style={[styles.tagMiniText, { color: theme.primaryDark }]}>Grafo Activo</Text>
                  </View>
                </View>
                <Text style={[styles.photoOptionDesc, { color: theme.textMuted }]}>
                  Pocos huevos disponibles. Sugiere reemplazo proteico del Grafo de Conocimiento.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            {/* Opción 2: Plato Social */}
            <TouchableOpacity
              style={[styles.photoOptionCard, { backgroundColor: theme.background, borderColor: theme.border }]}
              onPress={() => handleCameraOption('social_food')}
              activeOpacity={0.75}
            >
              <View style={[styles.photoOptionIconCircle, { backgroundColor: theme.accentLight }]}>
                <Ionicons name="pizza-outline" size={24} color={theme.accent} />
              </View>
              <View style={styles.photoOptionTextCol}>
                <View style={styles.photoOptionBadgeRow}>
                  <Text style={[styles.photoOptionTitle, { color: theme.text }]}>
                    Plato de comida social
                  </Text>
                  <View style={[styles.tagMini, { backgroundColor: theme.accentLight }]}>
                    <Text style={[styles.tagMiniText, { color: theme.accentDark }]}>Regla 4: Incertidumbre</Text>
                  </View>
                </View>
                <Text style={[styles.photoOptionDesc, { color: theme.textMuted }]}>
                  Pizza en restaurante. Activa confirmación amable antes de descontar calorías.
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={theme.textMuted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalCancelButton, { borderColor: theme.border }]}
              onPress={() => setCameraModalVisible(false)}
            >
              <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 7. Modal de Configuración de API Key de IA Generativa */}
      <Modal
        visible={keyModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setKeyModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={[styles.cameraModalCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <View style={styles.cameraModalHeader}>
              <View style={[styles.cameraIconBox, { backgroundColor: iaStatus.connected ? theme.primaryLight : theme.borderLight }]}>
                <Ionicons
                  name={iaStatus.connected ? "sparkles" : "key"}
                  size={20}
                  color={iaStatus.connected ? theme.primary : theme.textMuted}
                />
              </View>
              <View style={styles.flex}>
                <Text style={[styles.cameraModalTitle, { color: theme.text }]}>
                  Conexión con IA Generativa
                </Text>
                <Text style={[styles.cameraModalSubtitle, { color: theme.primaryDark }]}>
                  {iaStatus.connected ? `🟢 ${iaStatus.provider}` : '⚪ Modo Local Offline'}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => setKeyModalVisible(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={20} color={theme.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalHelpText, { color: theme.textMuted }]}>
              Ingresa tu API Key para activar razonamiento generativo real con GraphRAG:
            </Text>

            {/* Google Gemini Input */}
            <View style={styles.keyInputSection}>
              <Text style={[styles.keyInputLabel, { color: theme.text }]}>
                Google Gemini API Key (Recomendado):
              </Text>
              <TextInput
                style={[styles.keyTextInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                placeholder="AIzaSy..."
                placeholderTextColor={theme.textLight}
                value={geminiInput}
                onChangeText={setGeminiInput}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            {/* OpenAI Input */}
            <View style={styles.keyInputSection}>
              <Text style={[styles.keyInputLabel, { color: theme.text }]}>
                OpenAI API Key (Alternativa):
              </Text>
              <TextInput
                style={[styles.keyTextInput, { backgroundColor: theme.background, borderColor: theme.border, color: theme.text }]}
                placeholder="sk-..."
                placeholderTextColor={theme.textLight}
                value={openaiInput}
                onChangeText={setOpenaiInput}
                secureTextEntry
                autoCapitalize="none"
              />
            </View>

            <View style={styles.keyModalActionsRow}>
              <TouchableOpacity
                style={[styles.keySaveButton, { backgroundColor: theme.primary }]}
                onPress={() => {
                  AICopilotService.setAPIKey('gemini', geminiInput);
                  AICopilotService.setAPIKey('openai', openaiInput);
                  const updatedStatus = AICopilotService.getStatusIA();
                  setIaStatus(updatedStatus);
                  setKeyModalVisible(false);
                  Alert.alert(
                    updatedStatus.connected ? 'IA Conectada' : 'Modo Offline',
                    updatedStatus.connected
                      ? `Conexión activa con ${updatedStatus.provider}. El Copilot procesará tus mensajes en vivo.`
                      : 'Se utilizará el motor determinista local en caso de ausencia de API Keys.'
                  );
                }}
                activeOpacity={0.85}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.keySaveButtonText}>Guardar y Conectar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.keyClearButton, { borderColor: theme.border }]}
                onPress={() => {
                  setGeminiInput('');
                  setOpenaiInput('');
                  AICopilotService.setAPIKey('gemini', '');
                  AICopilotService.setAPIKey('openai', '');
                  setIaStatus(AICopilotService.getStatusIA());
                  setKeyModalVisible(false);
                }}
              >
                <Text style={[styles.modalCancelText, { color: theme.textMuted }]}>Desconectar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    alignSelf: 'center',
    ...(Platform.OS === 'web' && {
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderColor: 'rgba(0,0,0,0.08)',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
    }),
  },
  flex: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm + 4,
    borderBottomWidth: 1,
  },
  navUserSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  avatarWrapper: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1.5,
  },
  onlineBadge: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10B981',
    borderWidth: 2,
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
  navTitle: {
    fontSize: 15,
    fontWeight: '700',
  },
  navSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  headerRightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  themeToggleButton: {
    width: 36,
    height: 36,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  chatListContent: {
    paddingVertical: SPACING.md,
    flexGrow: 1,
    justifyContent: 'flex-end',
  },
  chipsContainer: {
    paddingVertical: SPACING.xs,
  },
  chipsContent: {
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
  },
  chipButton: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 7,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    ...SHADOWS.soft,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderTopWidth: 1,
    gap: SPACING.xs,
  },
  attachButton: {
    padding: SPACING.xs,
  },
  inputPill: {
    flex: 1,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: Platform.OS === 'ios' ? 8 : 4,
    borderWidth: 1,
  },
  textInput: {
    fontSize: 14,
    maxHeight: 90,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {},
  sendButtonDisabled: {},
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  cameraModalCard: {
    width: '100%',
    maxWidth: 420,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    ...SHADOWS.medium,
  },
  cameraModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  cameraIconBox: {
    width: 38,
    height: 38,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraModalTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  cameraModalSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
  modalCloseButton: {
    padding: SPACING.xs,
  },
  modalHelpText: {
    fontSize: 12,
    marginVertical: SPACING.sm,
  },
  photoOptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    marginBottom: SPACING.sm,
    gap: SPACING.sm,
  },
  photoOptionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  photoOptionTextCol: {
    flex: 1,
  },
  photoOptionBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    marginBottom: 2,
  },
  photoOptionTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  photoOptionDesc: {
    fontSize: 11,
    lineHeight: 15,
  },
  tagMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  tagMiniText: {
    fontSize: 9,
    fontWeight: '700',
  },
  modalCancelButton: {
    paddingVertical: SPACING.sm,
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.xs,
  },
  modalCancelText: {
    fontSize: 13,
    fontWeight: '600',
  },
  keyInputSection: {
    marginBottom: SPACING.sm + 2,
  },
  keyInputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 4,
  },
  keyTextInput: {
    height: 42,
    borderWidth: 1,
    borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md,
    fontSize: 13,
  },
  keyModalActionsRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  keySaveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.sm + 2,
    borderRadius: RADIUS.md,
    gap: 6,
  },
  keySaveButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  keyClearButton: {
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
  },
});

