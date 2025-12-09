export const environment = {
    production: false,
    apiUrl: 'http://localhost:3000/api',
    jwtSecret: 'your-secret-key-here', // Should be in backend only
    whatsappApiUrl: 'https://graph.facebook.com/v18.0',
    smsProvider: 'twilio',
    maxGuestsPerEvent: 1000,
    maxGuestCount: 10,
    maxPhotosPerEvent: 5,
    maxPhotoSize: 2 * 1024 * 1024, // 2MB in bytes
};
