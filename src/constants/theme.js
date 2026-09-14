export const COLORS = {
  // Paleta requerida para la experiencia sin culpa
  primary: '#10B981',       // Verde Menta Suave (Éxito, progreso, acciones principales)
  primaryLight: '#D1FAE5',  // Tinte menta suave para fondos y badges
  primaryDark: '#047857',   // Verde esmeralda para texto sobre tintes
  
  secondary: '#1E293B',     // Azul Pizarra Profundo (Textos principales, navegación)
  secondaryLight: '#475569',// Pizarra medio para subtítulos y metadatos
  
  accent: '#F97316',        // Naranja Coral (Desviaciones, recalibraciones; NUNCA ROJO)
  accentLight: '#FFEDD5',   // Tinte coral suave para áreas de compensación
  accentDark: '#C2410C',    // Coral profundo para etiquetas destacadas
  
  background: '#F8FAFC',    // Gris Hielo (Fondo neutro, reduce fatiga visual)
  card: '#FFFFFF',          // Blanco puro para tarjetas elevadas
  border: '#E2E8F0',        // Borde sutil
  borderLight: '#F1F5F9',
  
  text: '#1E293B',          // Texto principal de alto contraste
  textMuted: '#64748B',     // Texto secundario / timestamps
  textLight: '#94A3B8',     // Placeholders y separadores
  
  white: '#FFFFFF',
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const RADIUS = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  full: 9999,
};

export const SHADOWS = {
  soft: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  card: {
    shadowColor: '#1E293B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
};
