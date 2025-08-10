import type { StorybookConfig } from '@storybook/react-vite';
import { mergeConfig } from 'vite';
import path from 'path';

const config: StorybookConfig = {
  // Story file patterns - where Storybook looks for stories
  stories: [
    '../client/src/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../client/src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],

  // Storybook addons for enhanced functionality
  addons: [
    '@storybook/addon-onboarding',          // First-time user guide
    '@storybook/addon-links',               // Link between stories
    '@storybook/addon-essentials',          // Core addons (docs, controls, actions, etc.)
    '@chromatic-com/storybook',            // Visual testing integration
    '@storybook/addon-interactions',        // Interaction testing
    '@storybook/addon-a11y',               // Accessibility testing
    '@storybook/addon-design-tokens',       // Design system tokens
  ],

  // Use Vite as the bundler (matches your project setup)
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  // TypeScript configuration
  typescript: {
    check: false,  // Skip type checking for faster builds
    reactDocgen: 'react-docgen-typescript',  // Generate component docs from TypeScript
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },

  // Custom Vite configuration for Storybook
  async viteFinal(config, { configType }) {
    return mergeConfig(config, {
      resolve: {
        alias: {
          // Match your main app's path aliases
          '@': path.resolve(__dirname, '../client/src'),
          '@assets': path.resolve(__dirname, '../attached_assets'),
        },
      },
      define: {
        // Environment variables for Storybook
        'process.env': {},
      },
      // Optimize dependencies (same as your main app)
      optimizeDeps: {
        include: [
          '@storybook/react',
          '@storybook/react-vite',
          'react',
          'react-dom',
        ],
      },
    });
  },

  // Enable docs auto-generation
  docs: {
    autodocs: 'tag',  // Generate docs for stories with 'autodocs' tag
    defaultName: 'Documentation',
  },

  // Static assets directory
  staticDirs: ['../client/public'],

  // Features configuration
  features: {
    buildStoriesJson: true,  // Generate stories.json for external tools
  },

  // Core configuration
  core: {
    disableTelemetry: true,  // Disable analytics
  },

  // Environment variables
  env: (config) => ({
    ...config,
    STORYBOOK_MODE: 'true',
  }),
};

export default config;