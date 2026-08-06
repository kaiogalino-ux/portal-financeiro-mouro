import nextCoreWebVitals from 'eslint-config-next/core-web-vitals';
import prettier from 'eslint-config-prettier';

const config = [
  { ignores: ['.next/**', 'node_modules/**', 'src/generated/**'] },
  ...nextCoreWebVitals,
  prettier,
];

export default config;
