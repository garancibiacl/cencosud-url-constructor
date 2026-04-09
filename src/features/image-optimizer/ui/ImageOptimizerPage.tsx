import { Image } from "lucide-react";
import ModulePlaceholder from "@/shared/components/ModulePlaceholder";

export default function ImageOptimizerPage() {
  return (
    <ModulePlaceholder
      badge="Modulo desacoplado"
      title="Optimizador de Imagenes"
      description="Espacio reservado para una nueva integracion modular."
      icon={Image}
      message="La vista anterior fue retirada del flujo principal."
      details="Cuando se integre el siguiente modulo, solo hay que registrarlo en el catalogo central."
    />
  );
}
