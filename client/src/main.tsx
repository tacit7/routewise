import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Check if MSW should be disabled
const isMswDisabled = import.meta.env.VITE_MSW_DISABLED === 'true';

// Enable MSW in development (unless disabled)
if (import.meta.env.DEV && !isMswDisabled) {
  import('./mocks/browser').then(() => {
    // MSW is now ready, render the app
    createRoot(document.getElementById("root")!).render(<App />);
  });
} else {
  // Production mode or MSW disabled - render app directly
  createRoot(document.getElementById("root")!).render(<App />);
}
