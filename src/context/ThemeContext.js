import React, { createContext, useContext, useState, useEffect } from 'react';
import { useColorScheme } from 'react-native';

const ThemeContext = createContext();

export const LIGHT_THEME = {
  isDark: false,
  background: '#F8FAFC',       // Gris Hielo
  surface: '#FFFFFF',          // Superficie clara (Tarjetas, Top header, Bottom bar)
  card: '#FFFFFF',
  text: '#1E293B',             // Azul Pizarra Profundo
  textMuted: '#64748B',        // Gris medio
  textLight: '#94A3B8',
  border: '#E2E8F0',           // Borde sutil
  borderLight: '#F1F5F9',
  
  // Colores principales de la marca (contraste optimizado)
  primary: '#10B981',          // Verde Menta Suave
  primaryLight: '#D1FAE5',     // Fondo suave para badges
  primaryDark: '#047857',      // Texto sobre badges claros
  
  accent: '#F97316',           // Naranja Coral (desviaciones/recalibraciones)
  accentLight: '#FFEDD5',
  accentDark: '#C2410C',
  
  userBubble: '#1E293B',
  userText: '#FFFFFF',
  botBubble: '#FFFFFF',
  botText: '#1E293B',
  inputBg: '#F8FAFC',
  chipBg: '#FFFFFF',
  statusBarStyle: 'dark',
};

export const DARK_THEME = {
  isDark: true,
  background: '#0F172A',       // Slate 900 (Fondo principal muy oscuro)
  surface: '#1E293B',          // Slate 800 (Tarjetas, header, tab bar)
  card: '#1E293B',
  text: '#F8FAFC',             // Blanco roto
  textMuted: '#94A3B8',        // Gris neutro
  textLight: '#64748B',
  border: '#334155',           // Slate 700
  borderLight: '#1E293B',
  
  // Mantener Verde Menta y Naranja Coral con excelente contraste
  primary: '#10B981',          // Verde Menta Suave (Destaca sobre #0F172A y #1E293B)
  primaryLight: 'rgba(16, 185, 129, 0.15)', // Tinte oscuro translúcido
  primaryDark: '#34D399',      // Verde menta luminoso para texto
  
  accent: '#F97316',           // Naranja Coral
  accentLight: 'rgba(249, 115, 22, 0.18)',  // Tinte coral translúcido
  accentDark: '#FB923C',       // Coral luminoso para texto
  
  userBubble: '#047857',       // Esmeralda sobrio para burbuja usuario
  userText: '#FFFFFF',
  botBubble: '#1E293B',
  botText: '#F8FAFC',
  inputBg: '#0F172A',
  chipBg: '#1E293B',
  statusBarStyle: 'light',
};

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [isDark, setIsDark] = useState(systemScheme === 'dark');

  useEffect(() => {
    setIsDark(systemScheme === 'dark');
  }, [systemScheme]);

  const toggleTheme = () => {
    setIsDark((prev) => !prev);
  };

  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme debe ser utilizado dentro de un ThemeProvider');
  }
  return context;
}
