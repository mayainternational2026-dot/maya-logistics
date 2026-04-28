import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

const _fetch = window.fetch.bind(window);
window.fetch = (input, init = {}) => _fetch(input, { credentials: "include", ...init });

createRoot(document.getElementById("root")!).render(<App />);
