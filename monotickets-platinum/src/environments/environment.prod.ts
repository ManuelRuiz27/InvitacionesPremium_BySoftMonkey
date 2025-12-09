export const environment = {
    production: true,
    apiUrl: 'https://api.monotickets-platinum.com/api',
    jwtSecret: '', // Should be in backend only
    whatsappApiUrl: 'https://graph.facebook.com/v18.0',
    smsProvider: 'twilio',
    maxGuestsPerEvent: 1000,
    maxGuestCount: 10,
    maxPhotosPerEvent: 5,
    maxPhotoSize: 2 * 1024 * 1024, // 2MB in bytes
};
