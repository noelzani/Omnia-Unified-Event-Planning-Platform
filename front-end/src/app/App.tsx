import { RouterProvider } from "react-router";
import { router } from "./routes";
import { FavoritesProvider } from "./context/FavoritesContext";
import { FiltersProvider } from "./context/FiltersContext";
import { NotificationsProvider } from "./context/NotificationsContext";
import { Toaster } from "./components/ui/sonner";

export default function App() {
  return (
    <FavoritesProvider>
      <FiltersProvider>
        <NotificationsProvider>
          <RouterProvider router={router} />
          <Toaster position="top-right" richColors closeButton />
        </NotificationsProvider>
      </FiltersProvider>
    </FavoritesProvider>
  );
}