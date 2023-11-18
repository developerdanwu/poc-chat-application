/** @type {import("prettier").Config} */
const config = {
  "semi": true,
  "singleQuote": true,
  "arrowParens": "always",
  "printWidth": 80,
  "tabWidth": 2,
  overrides: [
    {
      "files": "*.html",
      "options": {"parser": "babel"}
    },
    {
      "files": "*.css",
      "options": {"parser": "css"}
    },
    {
      "files": "*.ts",
      "options": {"parser": "typescript"}
    },
    {
      "files": "*.sql",
      "options": {"parser": "sql"}
    }
  ],
  plugins: [require.resolve("prettier-plugin-tailwindcss")],
};

module.exports = config;
