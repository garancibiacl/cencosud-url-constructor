import { Settings } from "lucide-react";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Configuracion"
      description="Panel base listo para crecer sin acoplar configuraciones a otras vistas."
      icon={Settings}
      message="La configuracion se habilitara como modulo propio."
    />
  );
}
