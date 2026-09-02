// Reemplaza a react-scripts/config/jest/cssTransform.js — misma razón que
// jest.fileTransform.js: la versión de react-scripts devuelve un string
// plano, incompatible con la API de transformadores de Jest 28+.
'use strict';

module.exports = {
  process() {
    return { code: 'module.exports = {};' };
  },
  getCacheKey() {
    return 'cssTransform';
  },
};
