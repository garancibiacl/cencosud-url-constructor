import { supabase } from "@/integrations/supabase/client";
import type { MailingDocument } from "../logic/schema/mailing.types";

type SupabaseLike = {
  from: (table: string) => any;
};

const db = supabase as unknown as SupabaseLike;

export interface MailingListItem {
  id: string;
  name: string;
  status: string;
  currentVersion: number;
  updatedAt: string;
  document: MailingDocument;
}

export interface MailingVersionItem {
  id: string;
  versionNumber: number;
  note: string | null;
  createdAt: string;
}

const normalizeMailing = (row: any): MailingListItem => ({
  id: row.id,
  name: row.name,
  status: row.status,
  currentVersion: row.current_version,
  updatedAt: row.updated_at,
  document: row.document as MailingDocument,
});

const normalizeVersion = (row: any): MailingVersionItem => ({
  id: row.id,
  versionNumber: row.version_number,
  note: row.note ?? null,
  createdAt: row.created_at,
});

export async function listMailings(): Promise<MailingListItem[]> {
  const { data, error } = await db
    .from("mailings")
    .select("id, name, status, current_version, updated_at, document")
    .order("updated_at", { ascending: false });

  if (error) {
    console.error("listMailings:", error);
    return [];
  }

  return (data ?? []).map(normalizeMailing);
}

export async function listMailingVersions(mailingId: string): Promise<MailingVersionItem[]> {
  const { data, error } = await db
    .from("mailing_versions")
    .select("id, version_number, note, created_at")
    .eq("mailing_id", mailingId)
    .order("version_number", { ascending: false })
    .limit(8);

  if (error) {
    console.error("listMailingVersions:", error);
    return [];
  }

  return (data ?? []).map(normalizeVersion);
}

export async function saveMailingDraft(params: {
  mailingId?: string | null;
  userId: string;
  document: MailingDocument;
}): Promise<string | null> {
  const payload = {
    name: params.document.name,
    subject: params.document.settings.subject ?? null,
    preheader: params.document.settings.preheader ?? null,
    document: params.document,
    status: "draft",
  };

  if (params.mailingId) {
    const { error } = await db.from("mailings").update(payload).eq("id", params.mailingId);
    if (error) {
      console.error("saveMailingDraft:update", error);
      return null;
    }
    return params.mailingId;
  }

  const { data, error } = await db
    .from("mailings")
    .insert({ ...payload, user_id: params.userId, current_version: 0 })
    .select("id")
    .single();

  if (error) {
    console.error("saveMailingDraft:insert", error);
    return null;
  }

  return data?.id ?? null;
}

export async function createMailingVersion(params: {
  mailingId: string;
  userId: string;
  document: MailingDocument;
  note?: string;
}): Promise<number | null> {
  const { data: versionsData, error: versionsError } = await db
    .from("mailing_versions")
    .select("version_number")
    .eq("mailing_id", params.mailingId)
    .order("version_number", { ascending: false })
    .limit(1);

  if (versionsError) {
    console.error("createMailingVersion:list", versionsError);
    return null;
  }

  const nextVersion = ((versionsData?.[0]?.version_number as number | undefined) ?? 0) + 1;

  const { error: insertError } = await db.from("mailing_versions").insert({
    mailing_id: params.mailingId,
    user_id: params.userId,
    version_number: nextVersion,
    snapshot: params.document,
    note: params.note?.trim() || null,
  });

  if (insertError) {
    console.error("createMailingVersion:insert", insertError);
    return null;
  }

  const { error: updateError } = await db
    .from("mailings")
    .update({
      name: params.document.name,
      subject: params.document.settings.subject ?? null,
      preheader: params.document.settings.preheader ?? null,
      document: params.document,
      current_version: nextVersion,
      status: "draft",
    })
    .eq("id", params.mailingId);

  if (updateError) {
    console.error("createMailingVersion:update", updateError);
    return null;
  }

  return nextVersion;
}