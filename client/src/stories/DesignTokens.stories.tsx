import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const meta: Meta = {
  title: 'Design System/Design Tokens',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Complete reference for all design system tokens, colors, and interactive states used in RouteWise.',
      },
    },
  },
};

export default meta;

// Color Token Component
const ColorToken = ({ name, value, description }: { name: string; value: string; description: string }) => (
  <div className="space-y-2">
    <div className={`w-full h-16 rounded-lg border border-border ${value}`} />
    <div>
      <div className="font-mono text-sm font-medium">{name}</div>
      <div className="text-xs text-muted-fg">{description}</div>
      <div className="font-mono text-xs text-muted-fg mt-1">{value}</div>
    </div>
  </div>
);

// Interactive State Demo Component
const InteractiveDemo = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="space-y-3">
    <h4 className="text-sm font-semibold text-fg">{title}</h4>
    <div className="space-y-2">
      {children}
    </div>
  </div>
);

export const AllTokens: StoryObj = {
  render: () => (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-fg">RouteWise Design Tokens</h1>
        <p className="text-muted-fg">
          Complete reference for colors, typography, and interactive states
        </p>
      </div>

      {/* Color Tokens */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-fg border-b border-border pb-2">
          Color Tokens
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <ColorToken 
            name="--bg" 
            value="bg-bg" 
            description="Main background color" 
          />
          <ColorToken 
            name="--surface" 
            value="bg-surface" 
            description="Card and panel backgrounds" 
          />
          <ColorToken 
            name="--surface-alt" 
            value="bg-surface-alt" 
            description="Alternate surface color" 
          />
          <ColorToken 
            name="--primary" 
            value="bg-primary" 
            description="Primary brand color" 
          />
          <ColorToken 
            name="--text" 
            value="bg-fg" 
            description="Primary text color" 
          />
          <ColorToken 
            name="--text-muted" 
            value="bg-muted-fg" 
            description="Secondary text color" 
          />
          <ColorToken 
            name="--border" 
            value="bg-border" 
            description="Border color" 
          />
          <ColorToken 
            name="--focus" 
            value="bg-ring" 
            description="Focus ring color" 
          />
        </div>
      </section>

      {/* Interactive States */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-fg border-b border-border pb-2">
          Interactive States
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Input States */}
          <InteractiveDemo title="Input Fields">
            <Input 
              placeholder="Default input" 
              className="bg-surface text-fg border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg" 
            />
            <Input 
              placeholder="Hover state" 
              className="bg-surface text-fg border border-border hover:bg-surface/95" 
            />
            <Input 
              placeholder="Active state" 
              className="bg-surface text-fg border border-border active:bg-surface/90" 
            />
          </InteractiveDemo>

          {/* Button States */}
          <InteractiveDemo title="Buttons">
            <Button className="bg-primary text-primary-fg hover:bg-primary/90">
              Primary Button
            </Button>
            <Button variant="outline" className="border-border text-fg hover:bg-surface/95">
              Outline Button
            </Button>
            <Button variant="ghost" className="text-fg hover:bg-surface/95">
              Ghost Button
            </Button>
          </InteractiveDemo>

          {/* Surface States */}
          <InteractiveDemo title="Surfaces">
            <div className="p-4 bg-surface border border-border rounded-lg">
              Default surface
            </div>
            <div className="p-4 bg-surface border border-border rounded-lg hover:bg-surface/95 cursor-pointer">
              Hover surface
            </div>
            <div className="p-4 bg-surface border border-border rounded-lg active:bg-surface/90 cursor-pointer">
              Active surface
            </div>
          </InteractiveDemo>

          {/* Text Links */}
          <InteractiveDemo title="Text Links">
            <a href="#" className="text-primary hover:opacity-90">
              Primary link
            </a>
            <a href="#" className="text-fg hover:text-primary">
              Regular link
            </a>
            <a href="#" className="text-muted-fg hover:text-fg">
              Muted link
            </a>
          </InteractiveDemo>
        </div>
      </section>

      {/* Component Examples */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-fg border-b border-border pb-2">
          Component Examples
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card Example */}
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-fg">Example Card</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-muted-fg">
                This card demonstrates proper use of design tokens.
              </p>
              <Button className="bg-primary text-primary-fg hover:bg-primary/90">
                Action
              </Button>
            </CardContent>
          </Card>

          {/* Form Example */}
          <Card className="bg-surface border border-border">
            <CardHeader>
              <CardTitle className="text-fg">Form Example</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <label className="text-sm font-medium text-fg">Email</label>
                <Input 
                  type="email" 
                  placeholder="Enter email" 
                  className="bg-surface text-fg border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
                />
              </div>
              <Button className="w-full bg-primary text-primary-fg hover:bg-primary/90">
                Submit
              </Button>
            </CardContent>
          </Card>

          {/* Interactive Panel */}
          <Card className="bg-surface border border-border hover:bg-surface/95 cursor-pointer transition-colors">
            <CardHeader>
              <CardTitle className="text-fg">Interactive Panel</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-fg">
                Hover over this panel to see the surface interaction.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Focus States */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-fg border-b border-border pb-2">
          Focus States
        </h2>
        
        <div className="space-y-4">
          <p className="text-muted-fg">
            All interactive elements use consistent focus rings for accessibility:
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="p-3 bg-surface border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              Focusable Button
            </button>
            
            <Input 
              placeholder="Focusable Input" 
              className="focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            />
            
            <select className="p-3 bg-surface border border-border rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg">
              <option>Focusable Select</option>
            </select>
          </div>
        </div>
      </section>

      {/* Implementation Guide */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-fg border-b border-border pb-2">
          Implementation Guide
        </h2>
        
        <div className="bg-surface-alt p-6 rounded-lg border border-border">
          <h3 className="text-lg font-semibold text-fg mb-4">Best Practices</h3>
          
          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-fg">Input Fields:</h4>
              <code className="text-xs bg-surface p-1 rounded text-muted-fg">
                bg-surface text-fg border border-border focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg
              </code>
            </div>
            
            <div>
              <h4 className="font-medium text-fg">Hover States:</h4>
              <ul className="list-disc list-inside text-muted-fg space-y-1 ml-4">
                <li>Surfaces: <code className="bg-surface p-1 rounded">hover:bg-surface/95 active:bg-surface/90</code></li>
                <li>Links: <code className="bg-surface p-1 rounded">text-primary hover:opacity-90</code></li>
                <li>Buttons: <code className="bg-surface p-1 rounded">bg-primary hover:bg-primary/90</code></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-medium text-fg">Focus Rings:</h4>
              <p className="text-muted-fg">
                Always use: <code className="bg-surface p-1 rounded">focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-bg</code>
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  ),
};

export const DarkMode: StoryObj = {
  parameters: {
    backgrounds: { default: 'dark' },
    docs: {
      description: {
        story: 'All design tokens in dark mode. Note: Dark mode implementation depends on your CSS variables configuration.',
      },
    },
  },
  render: () => (
    <div className="dark">
      <AllTokens.render />
    </div>
  ),
};

export const TokenReference: StoryObj = {
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-fg">Token Reference</h1>
      
      <div className="bg-surface border border-border rounded-lg p-6">
        <h2 className="text-xl font-semibold text-fg mb-4">CSS Variable Mapping</h2>
        
        <div className="space-y-2 font-mono text-sm">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold text-fg mb-2">Tailwind Class</h3>
              <div className="space-y-1 text-muted-fg">
                <div>bg-bg</div>
                <div>bg-surface</div>
                <div>bg-surface-alt</div>
                <div>bg-primary</div>
                <div>text-fg</div>
                <div>text-muted-fg</div>
                <div>text-primary-fg</div>
                <div>border-border</div>
                <div>ring-ring</div>
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-fg mb-2">CSS Variable</h3>
              <div className="space-y-1 text-muted-fg">
                <div>var(--bg)</div>
                <div>var(--surface)</div>
                <div>var(--surface-alt)</div>
                <div>hsl(var(--primary))</div>
                <div>var(--text)</div>
                <div>var(--text-muted)</div>
                <div>#ffffff</div>
                <div>var(--border)</div>
                <div>var(--focus)</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  ),
};