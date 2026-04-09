import { History } from "lucide-react";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

export default function HistoryPage() {
  return (
    <ModulePlaceholder
      title="Historial de Campanas"
      description="Vista preparada para futuras integraciones operativas."
      icon={History}
      message="El historial se integrara como modulo independiente."
    />
  );
}
