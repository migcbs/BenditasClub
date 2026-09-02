// Reemplaza a react-scripts/config/jest/fileTransform.js, que devuelve un
// string plano — incompatible con la API de transformadores de Jest 28+,
// que exige un objeto con `code`. Misma idea (imports de assets -> nombre
// de archivo), adaptada.
'use strict';

const path = require('path');

module.exports = {
  process(src, filename) {
    const assetFilename = JSON.stringify(path.basename(filename));
    return { code: `module.exports = ${assetFilename};` };
  },
};
