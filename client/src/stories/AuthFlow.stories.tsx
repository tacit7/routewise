import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const meta: Meta = {
  title: 'Documentation/OAuth Authentication Flow',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'Complete documentation of Google OAuth authentication flow implementation in RouteWise.',
      },
    },
  },
};

export default meta;

const FlowStep = ({ 
  step, 
  title, 
  description, 
  technical, 
  endpoint, 
  status 
}: { 
  step: number; 
  title: string; 
  description: string; 
  technical?: string;
  endpoint?: string;
  status?: 'success' | 'error' | 'warning';
}) => {
  const statusColors = {
    success: 'border-green-500 bg-green-50',
    error: 'border-red-500 bg-red-50',
    warning: 'border-yellow-500 bg-yellow-50',
  };

  return (
    <Card className={`${status ? statusColors[status] : 'bg-surface border-border'}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary text-primary-fg rounded-full flex items-center justify-center font-bold">
            {step}
          </div>
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-muted-fg">{description}</p>
        {technical && (
          <div className="bg-surface-alt p-3 rounded-lg">
            <code className="text-sm">{technical}</code>
          </div>
        )}
        {endpoint && (
          <div className="bg-surface p-2 rounded border">
            <span className="text-xs text-muted-fg">Endpoint:</span>
            <code className="ml-2 text-sm font-mono">{endpoint}</code>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export const CompleteOAuthFlow: StoryObj = {
  render: () => (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-bold text-fg">Google OAuth Authentication Flow</h1>
        <p className="text-lg text-muted-fg max-w-3xl mx-auto">
          Complete technical documentation of how Google OAuth authentication works in RouteWise, 
          including frontend-backend integration, routing configuration, and error handling.
        </p>
      </div>

      {/* Architecture Overview */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-fg">Architecture Overview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-fg mb-2">Frontend (React + Vite)</h3>
              <ul className="space-y-1 text-sm text-muted-fg">
                <li>• Port 3001 (development)</li>
                <li>• Vite proxy configuration</li>
                <li>• AuthContext for state management</li>
                <li>• JWT token handling</li>
                <li>• Responsive UI components</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-fg mb-2">Backend (Phoenix/Elixir)</h3>
              <ul className="space-y-1 text-sm text-muted-fg">
                <li>• Port 4001 (API server)</li>
                <li>• Ueberauth + Google Strategy</li>
                <li>• JWT token generation</li>
                <li>• Session management</li>
                <li>• Database user storage</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Authentication Flow Steps */}
      <section className="space-y-6">
        <h2 className="text-3xl font-bold text-fg">Authentication Flow Steps</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <FlowStep
            step={1}
            title="User Clicks Sign Up"
            description="User clicks the Sign Up button on the home page, triggering OAuth initiation."
            technical="window.location.href = '/auth/google'"
            endpoint="Frontend: /auth/google"
            status="success"
          />

          <FlowStep
            step={2}
            title="Vite Proxy Forward"
            description="Vite development server proxies the auth request to Phoenix backend."
            technical="proxy: { '/auth': { target: 'http://localhost:4001' } }"
            endpoint="http://localhost:3001/auth/google → http://localhost:4001/auth/google"
            status="success"
          />

          <FlowStep
            step={3}
            title="Phoenix Router Match"
            description="Phoenix router matches the OAuth route and applies browser pipeline with Ueberauth."
            technical='scope "/auth" do\n  pipe_through :auth_browser\n  get "/:provider", AuthController, :request\nend'
            endpoint="GET /auth/google"
            status="success"
          />

          <FlowStep
            step={4}
            title="Google OAuth Redirect"
            description="Ueberauth redirects user to Google OAuth consent screen."
            technical="Ueberauth.Strategy.Google handles OAuth flow"
            endpoint="https://accounts.google.com/oauth/authorize"
            status="success"
          />

          <FlowStep
            step={5}
            title="User Authorization"
            description="User authorizes the application on Google's consent screen."
            technical="User grants permissions: email, profile"
            status="success"
          />

          <FlowStep
            step={6}
            title="Google Callback"
            description="Google redirects back to Phoenix with authorization code."
            technical="Authorization code + state parameter"
            endpoint="GET /auth/google/callback"
            status="success"
          />

          <FlowStep
            step={7}
            title="Token Exchange"
            description="Phoenix exchanges authorization code for access token and user info."
            technical="AuthController.google_callback processes OAuth response"
            status="success"
          />

          <FlowStep
            step={8}
            title="User Creation/Login"
            description="Phoenix creates new user or logs in existing user, generates JWT token."
            technical="User.create_or_update_from_oauth(user_info)\nJWT.generate_and_sign(user)"
            status="success"
          />

          <FlowStep
            step={9}
            title="Frontend Redirect"
            description="Phoenix redirects back to frontend with success parameters."
            technical="redirect_to: '/?success=google_auth&message=...'"
            endpoint="http://localhost:3001/?success=google_auth"
            status="success"
          />

          <FlowStep
            step={10}
            title="Auth Context Update"
            description="Frontend AuthContext detects success parameters and updates user state."
            technical="useEffect(() => { handleOAuthRedirect(); checkAuth(); }, []);"
            status="success"
          />
        </div>
      </section>

      {/* Configuration Details */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-fg">Configuration Details</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Vite Configuration */}
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle>Vite Proxy Config</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-surface-alt p-4 rounded-lg overflow-x-auto text-sm">
{`// vite.config.ts
server: {
  proxy: {
    '/api': {
      target: 'http://localhost:4001',
      changeOrigin: true,
      secure: false,
    },
    '/auth': {
      target: 'http://localhost:4001',
      changeOrigin: true,
      secure: false,
    },
  },
}`}
              </pre>
            </CardContent>
          </Card>

          {/* Phoenix Router Config */}
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle>Phoenix Router Config</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-surface-alt p-4 rounded-lg overflow-x-auto text-sm">
{`# router.ex
pipeline :auth_browser do
  plug :accepts, ["html"]
  plug :fetch_session
  plug :protect_from_forgery
  plug :put_secure_browser_headers
  plug Ueberauth
end

scope "/auth", RouteWiseApiWeb do
  pipe_through :auth_browser
  get "/:provider", AuthController, :request
  get "/:provider/callback", AuthController, :google_callback
end`}
              </pre>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Error Scenarios */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-fg">Common Error Scenarios</h2>
        
        <div className="space-y-4">
          <FlowStep
            step={1}
            title="404 on /auth/google"
            description="Vite proxy not configured or Phoenix server not running."
            technical="Check vite.config.ts proxy settings and Phoenix server status"
            status="error"
          />

          <FlowStep
            step={2}
            title="401 on OAuth initiation"
            description="Route in wrong pipeline - should be :auth_browser, not :authenticated."
            technical="Move OAuth routes from :authenticated to :auth_browser pipeline"
            status="error"
          />

          <FlowStep
            step={3}
            title="Google OAuth configuration"
            description="Missing or invalid Google OAuth client ID/secret."
            technical="Check GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in Phoenix config"
            status="warning"
          />
        </div>
      </section>

      {/* Testing Guide */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="text-2xl text-fg">Testing the OAuth Flow</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <h3 className="font-semibold text-fg">Prerequisites:</h3>
            <ul className="list-disc list-inside text-muted-fg space-y-1">
              <li>Phoenix backend running on port 4001</li>
              <li>React frontend running on port 3001</li>
              <li>Google OAuth configured in Phoenix</li>
              <li>Vite proxy configuration in place</li>
            </ul>
          </div>

          <div className="space-y-3">
            <h3 className="font-semibold text-fg">Test Steps:</h3>
            <ol className="list-decimal list-inside text-muted-fg space-y-1">
              <li>Navigate to http://localhost:3001</li>
              <li>Click the "Sign Up" button</li>
              <li>Should redirect to Google OAuth consent screen</li>
              <li>Authorize the application</li>
              <li>Should redirect back with success message</li>
              <li>User should be logged in and see dashboard</li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};

export const TechnicalReference: StoryObj = {
  render: () => (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-3xl font-bold text-fg">Technical Reference</h1>
      
      {/* API Endpoints */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Authentication API Endpoints</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="font-mono">/auth/google</code>
              </div>
              <p className="text-sm text-muted-fg">Initiates Google OAuth flow</p>
            </div>
            
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="font-mono">/auth/google/callback</code>
              </div>
              <p className="text-sm text-muted-fg">Handles Google OAuth callback</p>
            </div>
            
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-mono">GET</span>
                <code className="font-mono">/api/auth/me</code>
              </div>
              <p className="text-sm text-muted-fg">Gets current user (requires authentication)</p>
            </div>
            
            <div className="border border-border rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <span className="bg-orange-500 text-white px-2 py-1 rounded text-xs font-mono">POST</span>
                <code className="font-mono">/api/auth/logout</code>
              </div>
              <p className="text-sm text-muted-fg">Logs out user and clears session</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Component Reference */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Frontend Components</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div>
              <h3 className="font-semibold text-fg">AuthContext</h3>
              <p className="text-sm text-muted-fg">Manages authentication state and provides login/logout functions</p>
              <code className="text-xs bg-surface-alt p-1 rounded">client/src/components/auth-context.tsx</code>
            </div>
            
            <div>
              <h3 className="font-semibold text-fg">UserMenu</h3>
              <p className="text-sm text-muted-fg">Desktop dropdown menu for authenticated users</p>
              <code className="text-xs bg-surface-alt p-1 rounded">client/src/components/UserMenu.tsx</code>
            </div>
            
            <div>
              <h3 className="font-semibold text-fg">MobileMenu</h3>
              <p className="text-sm text-muted-fg">Mobile hamburger menu for authenticated users</p>
              <code className="text-xs bg-surface-alt p-1 rounded">client/src/components/MobileMenu.tsx</code>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  ),
};