import { createContext, useContext } from "react";

interface MailingDocContextValue {
  campaignId: string;
}

export const MailingDocContext = createContext<MailingDocContextValue>({ campaignId: "" });
export const useMailingDocContext = () => useContext(MailingDocContext);
