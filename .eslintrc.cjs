// eslint-disable-next-line @typescript-eslint/no-var-requires
const path = require("path");

/** @type {import("eslint").Linter.Config} */
const config = {
    overrides: [
        {
            extends: [
                "plugin:@typescript-eslint/recommended",
            ],
            rules: {
                "@typescript-eslint/no-floating-promises": "off",
                "@typescript-eslint/no-misused-promises": "off",
            },
            files: ["*.ts", "*.tsx", "*.js"],
            parserOptions: {
                project: path.join(__dirname, "tsconfig.json"),
            },
        },
    ],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: path.join(__dirname, "tsconfig.json"),
    },
    plugins: ["@typescript-eslint"],
    extends: ["next/core-web-vitals", "plugin:@typescript-eslint/recommended"],
    rules: {
        "react/jsx-curly-brace-presence": ["warn", {
            "props": "never",
            "children": "never",
            "propElementValues": "never"
        }],
        "@typescript-eslint/consistent-type-imports": [
            "warn",
            {
                prefer: "type-imports",
                fixStyle: "inline-type-imports",
            },
        ],
        "@typescript-eslint/no-unused-vars": ["warn", {argsIgnorePattern: "^_"}],
    },
};

module.exports = config;
