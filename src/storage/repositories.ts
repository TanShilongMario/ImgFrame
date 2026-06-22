import type { AppSettings, HistoryRecord, MediaAsset, Project } from "../types";
import { getAllRecords, getRecord, putRecord } from "./db";

export const projectRepository = {
  list: () => getAllRecords("projects"),
  get: (id: string) => getRecord("projects", id),
  save: (project: Project) => putRecord("projects", project)
};

export const mediaRepository = {
  list: () => getAllRecords("mediaAssets"),
  get: (id: string) => getRecord("mediaAssets", id),
  save: (asset: MediaAsset) => putRecord("mediaAssets", asset)
};

export const historyRepository = {
  list: () => getAllRecords("history"),
  save: (record: HistoryRecord) => putRecord("history", record)
};

export const settingsRepository = {
  getDefault: () => getRecord("settings", "default"),
  saveDefault: (settings: AppSettings) => putRecord("settings", settings)
};

