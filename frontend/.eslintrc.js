// .eslintrc.js
module.exports = {
    extends: [
      'next/core-web-vitals',
      // otras extensiones que puedas tener...
    ],
    rules: {
      '@typescript-eslint/no-unused-vars': 'warn', // Cambia de 'error' a 'warn'
      '@typescript-eslint/no-explicit-any': 'warn', // Cambia de 'error' a 'warn'
      'react/no-unescaped-entities': 'warn', // Cambia de 'error' a 'warn'
    },
  };