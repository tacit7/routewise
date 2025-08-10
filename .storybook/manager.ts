import { addons } from '@storybook/manager-api';
import { themes } from '@storybook/theming';

// Configure Storybook's manager UI (sidebar, toolbar, etc.)
addons.setConfig({
  // Theme configuration
  theme: {
    ...themes.light,
    // Customize the Storybook UI theme
    brandTitle: 'RouteWise Components',
    brandUrl: 'https://github.com/your-username/route-wise',
    // brandImage: '/logo.svg', // Add your logo if you have one
    
    // Color customization to match your app
    colorPrimary: '#3b82f6',      // Primary blue
    colorSecondary: '#6366f1',    // Secondary indigo
    
    // Typography
    fontBase: '"Inter", "Helvetica Neue", Arial, sans-serif',
    fontCode: '"JetBrains Mono", "Fira Code", monospace',
    
    // UI colors
    appBg: '#ffffff',
    appContentBg: '#ffffff',
    appBorderColor: '#e5e7eb',
    appBorderRadius: 8,
    
    // Text colors
    textColor: '#1f2937',
    textInverseColor: '#ffffff',
    
    // Toolbar
    barTextColor: '#6b7280',
    barSelectedColor: '#3b82f6',
    barBg: '#f9fafb',
    
    // Form inputs
    inputBg: '#ffffff',
    inputBorder: '#d1d5db',
    inputTextColor: '#1f2937',
    inputBorderRadius: 6,
  },

  // Panel configuration
  panelPosition: 'bottom',  // Position of the addons panel
  
  // Sidebar configuration
  sidebar: {
    showRoots: false,  // Hide the root level in sidebar
    collapsedRoots: ['other'],  // Collapse these root categories by default
  },

  // Toolbar configuration
  toolbar: {
    title: { hidden: false },
    zoom: { hidden: false },
    eject: { hidden: false },
    copy: { hidden: false },
    fullscreen: { hidden: false },
    'storybook/background': { hidden: false },
    'storybook/viewport': { hidden: false },
    'storybook/docs': { hidden: false },
  },

  // Initial active panel
  initialActive: 'sidebar',

  // Navigation tree configuration
  showNav: true,
  showPanel: true,
  
  // Enable keyboard shortcuts
  enableShortcuts: true,
});