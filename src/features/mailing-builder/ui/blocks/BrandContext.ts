import { createContext, useContext } from "react";
import type { BrandId } from "../../logic/brands/brand.types";

export const BrandContext = createContext<BrandId | undefined>(undefined);
export const useBrandContext = () => useContext(BrandContext);
