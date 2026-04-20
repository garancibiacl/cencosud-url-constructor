import { useCallback, useState } from "react";
import type { MailingDocument } from "../logic/schema/mailing.types";
import {
  createMailingVersion,
  listMailings,
  listMailingVersions,
  saveMailingDraft,
  type MailingListItem,
  type MailingVersionItem,
} from "../services/mailings.service";

export function useMailings() {
  const [mailings, setMailings] = useState<MailingListItem[]>([]);
  const [versions, setVersions] = useState<MailingVersionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const refreshMailings = useCallback(async () => {
    setLoading(true);
    const nextMailings = await listMailings();
    setMailings(nextMailings);
    setLoading(false);
    return nextMailings;
  }, []);

  const loadVersions = useCallback(async (mailingId: string | null) => {
    if (!mailingId) {
      setVersions([]);
      return [];
    }

    const nextVersions = await listMailingVersions(mailingId);
    setVersions(nextVersions);
    return nextVersions;
  }, []);

  const saveDraft = useCallback(async (params: { mailingId?: string | null; userId: string; document: MailingDocument }) => {
    setSaving(true);
    const savedId = await saveMailingDraft(params);
    const nextMailings = await refreshMailings();
    if (savedId) {
      await loadVersions(savedId);
    }
    setSaving(false);
    return { savedId, nextMailings };
  }, [loadVersions, refreshMailings]);

  const saveVersion = useCallback(async (params: { mailingId: string; userId: string; document: MailingDocument; note?: string }) => {
    setSaving(true);
    const versionNumber = await createMailingVersion(params);
    const nextMailings = await refreshMailings();
    await loadVersions(params.mailingId);
    setSaving(false);
    return { versionNumber, nextMailings };
  }, [loadVersions, refreshMailings]);

  return {
    mailings,
    versions,
    loading,
    saving,
    refreshMailings,
    loadVersions,
    saveDraft,
    saveVersion,
  };
}