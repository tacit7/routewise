import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { setupMockData } from "./utils/mock-data";

// Setup mock data for development if auth is disabled
setupMockData();

// MSW is disabled for Phoenix backend integration
// Render app directly without MSW
createRoot(document.getElementById("root")!).render(<App />);
