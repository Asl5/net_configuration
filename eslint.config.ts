import { globalIgnores } from "eslint/config";
import { defineConfigWithVueTs, vueTsConfigs } from "@vue/eslint-config-typescript";
import pluginVue from "eslint-plugin-vue";

// To allow more languages other than `ts` in `.vue` files, uncomment the following lines:
// import { configureVueProject } from '@vue/eslint-config-typescript'
// configureVueProject({ scriptLangs: ['ts', 'tsx'] })
// More info at https://github.com/vuejs/eslint-config-typescript/#advanced-setup

export default defineConfigWithVueTs(
  {
    name: "app/files-to-lint",
    files: ["**/*.{ts,mts,tsx,vue}"],
  },

  globalIgnores(["**/dist/**", "**/dist-ssr/**", "**/coverage/**"]),

  pluginVue.configs["flat/essential"],
  vueTsConfigs.recommended,
  // ⬇️ Blocca personalizzato: qui metti le tue regole
  {
    name: "app/custom-rules",
    files: ["**/*.{ts,tsx,vue}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off", // <— disattiva l’errore
      // (opzionali)
      // '@typescript-eslint/explicit-module-boundary-types': 'off',
      // '@typescript-eslint/no-non-null-assertion': 'off',
    },
  }
);
