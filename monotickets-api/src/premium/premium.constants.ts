export const DEFAULT_PREMIUM_CONFIG = {
  effect: 'FLIPBOOK',
  colors: {
    primary: '#000000',
    secondary: '#ffffff',
    accent: '#d4af37',
    background: '#ffffff',
  },
  sections: {
    cover: { title: '', subtitle: '', coverImageId: null },
    story: { enabled: false, text: '', imageIds: [] },
    gallery: { enabled: false, imageIds: [] },
    location: { enabled: false, placeText: '', mapUrl: '' },
    extras: [],
    rsvp: { ctaText: 'Confirmar asistencia', helperText: '' },
  },
  reduceMotionDefault: false,
};
