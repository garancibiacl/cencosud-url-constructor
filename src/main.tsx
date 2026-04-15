import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

document.documentElement.classList.remove("dark");
localStorage.setItem("theme", "light");

createRoot(document.getElementById("root")!).render(<App />);
