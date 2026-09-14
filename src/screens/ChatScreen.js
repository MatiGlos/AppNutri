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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';
import { SPACING, RADIUS, SHADOWS } from '../constants/theme';
import WeeklyProgressBar from '../components/WeeklyProgressBar';
import ChatMessage from '../components/ChatMessage';

// Mock interactivo inicial de la conversación
const INITIAL_MESSAGES = [
  {
    id: 'msg-1',
    sender: 'bot',
    text: '¡Hola Mati! 👋 Recuerda que en AppNutri no hay comidas prohibidas ni días arruinados. Todo se gestiona con tu presupuesto semanal flexible.',
    time: '14:20',
  },
  {
    id: 'msg-2',
    sender: 'user',
    text: 'Hola... acabo de comerme un helado de chocolate de 500 kcal con mis amigos y me siento culpable 🍨😔',
    time: '14:21',
  },
  {
    id: 'msg-3',
    sender: 'bot',
    text: '¡Cero culpa! Disfrutar con amigos también es parte de una vida saludable. 😊\n\nTu meta semanal sigue intacta. Mira cómo tu presupuesto absorbió el helado:',
    time: '14:22',
  },
  {
    id: 'msg-4',
    sender: 'bot',
    cardType: 'compensation_summary',
    cardData: {
      caloriasExceso: 500,
      diasRestantes: 4,
      reduccionDiaria: 125,
      tmbSegura: true,
    },
    time: '14:22',
  },
  {
    id: 'msg-5',
    sender: 'bot',
    text: 'Si la próxima vez quieres saciar el antojo dulce sin alterar tu presupuesto, aquí tienes una opción deliciosa y alta en proteína:',
    time: '14:23',
  },
  {
    id: 'msg-6',
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
  { id: '1', label: '🍕 Salida de pizza (+600 kcal)', query: 'Comí 2 porciones de pizza' },
  { id: '2', label: '🍫 Tengo antojo de chocolate', query: 'Tengo antojo de algo dulce' },
  { id: '3', label: '📊 Ver balance semanal', query: '¿Cómo va mi presupuesto semanal?' },
  { id: '4', label: '☕ Merienda ligera', query: 'Sugiéreme un snack de menos de 150 kcal' },
];

export default function ChatScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const [messages, setMessages] = useState(INITIAL_MESSAGES);
  const [inputText, setInputText] = useState('');
  
  // Estado del presupuesto semanal reactivo
  const [weeklyBudget, setWeeklyBudget] = useState({
    total: 14000,
    consumidas: 7200,
    desviacion: 500, // Helado en compensación (segmento naranja coral)
    diaActual: 4,
    diasTotales: 7,
  });

  const flatListRef = useRef(null);

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

    // Simulación de respuesta inteligente del Bot
    setTimeout(() => {
      generateBotResponse(text);
    }, 800);
  };

  const generateBotResponse = (userText) => {
    const lower = userText.toLowerCase();
    const botTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (lower.includes('pizza') || lower.includes('600')) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '¡Entendido! La pizza estuvo genial y tu cuerpo ya la procesó. Amortizamos las 600 kcal en los 3 días restantes de tu semana (-200 kcal/día). Tu déficit sigue en rango seguro.',
        cardType: 'compensation_summary',
        cardData: {
          caloriasExceso: 600,
          diasRestantes: 3,
          reduccionDiaria: 200,
          tmbSegura: true,
        },
        time: botTime,
      };
      setMessages((prev) => [...prev, botResponse]);
      setWeeklyBudget((prev) => ({ ...prev, desviacion: prev.desviacion + 600 }));
    } else if (lower.includes('antojo') || lower.includes('dulce') || lower.includes('snack')) {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: 'Para ese antojo dulce sin que tu presupuesto se mueva, te recomiendo esta alternativa saciante:',
        cardType: 'food_replacement',
        cardData: {
          alimentoOriginal: 'Barra de Chocolate',
          caloriasOriginal: 280,
          alimentoSugerido: 'Cacao Puro con Plátano & Canela',
          caloriasSugerido: 110,
          porcion: '1 plato mediano',
          tags: ['Antojo Dulce', 'Alto Magnesio', 'Saciante'],
          ahorroKcal: 170,
        },
        time: botTime,
      };
      setMessages((prev) => [...prev, botResponse]);
    } else {
      const botResponse = {
        id: `bot-${Date.now()}`,
        sender: 'bot',
        text: '¡Perfecto! He registrado tu comentario. Recuerda que no necesitas compensar con cardio excesivo ni saltarte comidas: tu presupuesto semanal se encarga de equilibrar todo.',
        time: botTime,
      };
      setMessages((prev) => [...prev, botResponse]);
    }
  };

  const handleSelectReplacement = (msgId, data) => {
    const confirmMsg = {
      id: `usr-${Date.now()}`,
      sender: 'user',
      text: `¡Elegí el reemplazo: ${data.alimentoSugerido}! 🍓`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const botReply = {
      id: `bot-${Date.now()}`,
      sender: 'bot',
      text: `¡Excelente decisión! Ahorraste ${data.ahorroKcal} kcal y sumaste nutrientes de calidad. 🎉`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, confirmMsg, botReply]);
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

        {/* Botones de acción en cabecera: Limpiar chat y Alternar Tema */}
        <View style={styles.headerRightActions}>
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

      {/* 2. Componente de Progreso Semanal (Header visual de la app) */}
      <WeeklyProgressBar
        presupuestoSemanal={weeklyBudget.total}
        caloriasConsumidasBase={weeklyBudget.consumidas}
        caloriasDesviacion={weeklyBudget.desviacion}
        diaActual={weeklyBudget.diaActual}
        diasTotales={weeklyBudget.diasTotales}
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
              onKeepOriginal={() => handleConfirmCompensation(item.id, item.cardData)}
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
          <TouchableOpacity style={styles.attachButton} activeOpacity={0.7}>
            <Ionicons name="camera-outline" size={22} color={theme.textMuted} />
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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
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
});
