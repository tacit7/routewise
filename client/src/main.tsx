import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// MSW is disabled for Phoenix backend integration
// Render app directly without MSW
createRoot(document.getElementById("root")!).render(<App />);
