import type { LucideIcon } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ModulePlaceholderProps {
  badge?: string;
  title: string;
  description: string;
  icon: LucideIcon;
  message: string;
  details?: string;
}

const ModulePlaceholder = ({
  badge,
  title,
  description,
  icon: Icon,
  message,
  details,
}: ModulePlaceholderProps) => (
  <div className="flex flex-1 flex-col min-w-0 overflow-y-auto">
    <div className="border-b border-border bg-card px-8 py-6">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
      </div>
    </div>

    <div className="flex flex-1 items-center justify-center p-8">
      <Card className="w-full max-w-2xl border-dashed">
        <CardHeader>
          {badge ? (
            <span className="w-fit rounded-full bg-secondary px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-secondary-foreground">
              {badge}
            </span>
          ) : null}
          <CardTitle>{message}</CardTitle>
          {details ? <CardDescription>{details}</CardDescription> : null}
        </CardHeader>
        <CardContent>
          <div className="rounded-2xl border bg-muted/35 p-6 text-sm leading-6 text-muted-foreground">
            Esta vista quedo desacoplada de la implementacion anterior para facilitar la integracion
            de nuevos modulos sin afectar la navegacion ni el layout compartido.
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
);

export default ModulePlaceholder;
