import type { Preview } from '@storybook/react';
import '../client/src/index.css';  // Import your Tailwind CSS styles

// Global parameters for all stories
const preview: Preview = {
  // Global parameters applied to all stories
  parameters: {
    // Configure the docs page
    docs: {
      toc: {
        contentsSelector: '.sbdocs-content',
        headingSelector: 'h1, h2, h3, h4, h5, h6',
        title: 'Table of Contents',
        disable: false,
        unsafeTocbotOptions: {
          orderedList: false,
        },
      },
    },

    // Configure actions addon (logs component events)
    actions: { 
      argTypesRegex: '^on[A-Z].*'  // Auto-detect event handlers
    },

    // Configure controls addon (component property controls)
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
      expanded: true,  // Expand controls panel by default
      sort: 'alpha',   // Sort controls alphabetically
    },

    // Background options for stories
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#1a1a1a',
        },
        {
          name: 'RouteWise bg',
          value: 'var(--bg, #ffffff)',
        },
      ],
    },

    // Viewport configurations for responsive testing
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1200px',
            height: '800px',
          },
        },
        large: {
          name: 'Large Desktop',
          styles: {
            width: '1440px',
            height: '900px',
          },
        },
      },
      defaultViewport: 'desktop',
    },

    // Layout configuration
    layout: 'fullscreen',  // Default layout (can be overridden per story)

    // Options configuration
    options: {
      storySort: {
        order: [
          'Introduction',
          'Design System',
          ['Design Tokens', '*'],
          'Documentation',
          ['OAuth Authentication Flow', '*'],
          'Components',
          ['UI', '*'],
          'Pages',
          '*',
        ],
      },
    },
  },

  // Global decorators applied to all stories
  decorators: [
    // Add your app's providers here if needed
    // For example, if you use ThemeProvider, AuthProvider, etc.
    (Story) => (
      <div className="font-sans antialiased">
        {/* Wrapper div with base font styles */}
        <Story />
      </div>
    ),
  ],

  // Global arg types for component props
  argTypes: {
    // Common prop patterns
    className: {
      control: 'text',
      description: 'CSS class names',
      table: {
        category: 'Styling',
      },
    },
    children: {
      control: 'text',
      description: 'Child elements',
      table: {
        category: 'Content',
      },
    },
    onClick: {
      action: 'clicked',
      description: 'Click event handler',
      table: {
        category: 'Events',
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the component is disabled',
      table: {
        category: 'State',
      },
    },
  },

  // Global args (default values for all stories)
  args: {
    // Set default values here that apply to all components
  },

  // Tags applied to all stories
  tags: ['autodocs'],  // Auto-generate documentation for all stories
};

export default preview;