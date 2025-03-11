import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import pluginTailwind from '@tailwindcss/postcss';

export default defineConfig({
  plugins: [pluginReact()],
  html: {
    template: './static/index.html',
  },
  tools: {
    postcss: (opts, { addPlugins }) => {
      addPlugins(pluginTailwind);
    },
  },
});
