// Entrada para Vercel: convierte el Express de index.js (que ya exporta
// `app` sin escuchar en puerto cuando NODE_ENV=production) en una función
// serverless. Todas las rutas siguen siendo /api/... — ver vercel.json,
// que reenvía cualquier /api/* aquí y deja que el propio router de
// Express (dentro de index.js) decida qué handler responde.
module.exports = require('../index.js');
