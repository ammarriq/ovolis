import { defineConfig } from "eslint/config"
import pluginReact from "eslint-plugin-react"
import reactHooks from "eslint-plugin-react-hooks"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import globals from "globals"
import tseslint from "typescript-eslint"

export default defineConfig([
    reactHooks.configs["recommended-latest"],
    tseslint.configs.recommended,
    pluginReact.configs.flat.recommended,
    {
        plugins: {
            "simple-import-sort": simpleImportSort,
        },

        settings: {
            react: {
                version: "detect",
            },
        },

        languageOptions: {
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },

        rules: {
            "react/jsx-uses-react": "off",
            "react/react-in-jsx-scope": "off",
            "no-undef": "off",
            "no-unused-vars": "off",
            "@typescript-eslint/no-unused-vars": [
                "error",
                {
                    args: "all",
                    argsIgnorePattern: "^_",
                    caughtErrors: "all",
                    caughtErrorsIgnorePattern: "^_",
                    destructuredArrayIgnorePattern: "^_",
                    varsIgnorePattern: "^_",
                    ignoreRestSiblings: true,
                },
            ],
            "@typescript-eslint/no-empty-object-type": ["error", { allowInterfaces: "always" }],
            "@typescript-eslint/consistent-type-imports": "error",
            "react/prop-types": ["error", { ignore: ["className"] }],

            "sort-imports": "off",
            "import/order": "off",
            "simple-import-sort/imports": [
                "error",
                {
                    groups: [
                        ["^\\u0000"],
                        ["^.+\\u0000$"],
                        ["^node:", "electron", "^react", "react-aria-components"],
                        ["^@?\\w"],
                        ["^~/lib", "^"],
                        ["^\\.\\.(?!/?$)", "^\\.\\./?$"],
                        ["^\\./(?=.*/)(?!/?$)", "^\\.(?!/?$)", "^\\./?$"],
                    ],
                },
            ],
        },
    },
])
