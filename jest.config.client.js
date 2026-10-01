// Config de Jest para componentes de frontend (React Testing Library).
// No usamos `react-scripts test` porque su `testMatch` (glob) se rompe con el
// carácter "|" que trae la ruta del proyecto — mismo problema documentado en
// jest.config.api.js — así que usamos `testRegex` en su lugar, corriendo
// jest directo con la misma transformación de Babel/CSS/assets que usa CRA.
const path = require('path');
const reactScriptsConfig = path.join(__dirname, 'node_modules/react-scripts/config/jest');

module.exports = {
  rootDir: __dirname,
  testEnvironment: 'jsdom',
  testRegex: 'src/.*\\.test\\.jsx?$',
  testPathIgnorePatterns: ['/node_modules/', '/\\._'],
  setupFiles: [require.resolve('react-app-polyfill/jsdom')],
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  transform: {
    // Babel de react-scripts sí soporta la API moderna de transformadores;
    // css/file transforms son propios (ver jest.cssTransform.js) porque las
    // versiones que trae react-scripts devuelven un string plano, incompatible
    // con Jest 28+.
    '^.+\\.(js|jsx)$': path.join(reactScriptsConfig, 'babelTransform.js'),
    '^.+\\.css$': path.join(__dirname, 'jest.cssTransform.js'),
    // .cjs/.mjs son código (ej. reselect, que usa recharts), no assets — si
    // caen aquí se convierten en un string y truena con "createSelector is
    // not a function".
    '^(?!.*\\.(js|jsx|cjs|mjs|css|json)$)': path.join(__dirname, 'jest.fileTransform.js'),
  },
  transformIgnorePatterns: [
    '[/\\\\]node_modules[/\\\\].+\\.(js|jsx|cjs|mjs)$',
    '^.+\\.module\\.(css|sass|scss)$',
  ],
  moduleNameMapper: {
    '^react-native$': 'react-native-web',
    '\\.module\\.(css|sass|scss)$': 'identity-obj-proxy',
  },
  moduleFileExtensions: ['web.js', 'js', 'web.ts', 'ts', 'web.tsx', 'tsx', 'json', 'web.jsx', 'jsx', 'node'],
  resetMocks: true,
};
