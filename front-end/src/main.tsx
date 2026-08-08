import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import { AuthProvider } from "./app/context/AuthContext";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <PayPalScriptProvider
    options={{
      clientId: import.meta.env.VITE_PAYPAL_CLIENT_ID,
      currency: "EUR",
    }}
  >
    <AuthProvider>
      <App />
    </AuthProvider>
  </PayPalScriptProvider>
);