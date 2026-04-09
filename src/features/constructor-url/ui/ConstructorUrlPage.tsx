/**
 * ConstructorUrlPage
 *
 * Thin page wrapper for the URL Builder module.
 * All domain logic lives inside URLBuilder.tsx and src/lib/.
 * This file only connects the feature to the router.
 */
import URLBuilder from "@/components/URLBuilder";

export default function ConstructorUrlPage() {
  return <URLBuilder />;
}
