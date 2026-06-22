import type { AppSettings, HistoryRecord, MediaAsset, Project } from "../types";

const DB_NAME = "img-video-frame";
const DB_VERSION = 1;

type StoreName = "projects" | "mediaAssets" | "history" | "settings";

type StoreValueMap = {
  projects: Project;
  mediaAssets: MediaAsset;
  history: HistoryRecord;
  settings: AppSettings;
};

let dbPromise: Promise<IDBDatabase> | undefined;

export function openAppDatabase(): Promise<IDBDatabase> {
  if (!dbPromise) {
    dbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;

        if (!db.objectStoreNames.contains("projects")) {
          const store = db.createObjectStore("projects", { keyPath: "id" });
          store.createIndex("updatedAt", "updatedAt");
        }

        if (!db.objectStoreNames.contains("mediaAssets")) {
          const store = db.createObjectStore("mediaAssets", { keyPath: "id" });
          store.createIndex("createdAt", "createdAt");
          store.createIndex("type", "type");
        }

        if (!db.objectStoreNames.contains("history")) {
          const store = db.createObjectStore("history", { keyPath: "id" });
          store.createIndex("projectId", "projectId");
          store.createIndex("createdAt", "createdAt");
        }

        if (!db.objectStoreNames.contains("settings")) {
          db.createObjectStore("settings", { keyPath: "id" });
        }
      };

      request.onsuccess = () => {
        const db = request.result;
        db.onversionchange = () => db.close();
        resolve(db);
      };

      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        reject(new Error("IndexedDB 升级被其他页面阻塞，请关闭同站点旧页面后重试。"));
      };
    });
  }

  return dbPromise;
}

function createRequestPromise<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function getStore(storeName: StoreName, mode: IDBTransactionMode) {
  const db = await openAppDatabase();
  const transaction = db.transaction(storeName, mode);
  return transaction.objectStore(storeName);
}

export async function putRecord<TStore extends StoreName>(
  storeName: TStore,
  value: StoreValueMap[TStore]
): Promise<IDBValidKey> {
  const store = await getStore(storeName, "readwrite");
  return createRequestPromise(store.put(value));
}

export async function getRecord<TStore extends StoreName>(
  storeName: TStore,
  id: string
): Promise<StoreValueMap[TStore] | undefined> {
  const store = await getStore(storeName, "readonly");
  return createRequestPromise(store.get(id));
}

export async function deleteRecord(storeName: StoreName, id: string): Promise<void> {
  const store = await getStore(storeName, "readwrite");
  await createRequestPromise(store.delete(id));
}

export async function getAllRecords<TStore extends StoreName>(
  storeName: TStore
): Promise<Array<StoreValueMap[TStore]>> {
  const store = await getStore(storeName, "readonly");
  return createRequestPromise(store.getAll());
}

export async function clearStore(storeName: StoreName): Promise<void> {
  const store = await getStore(storeName, "readwrite");
  await createRequestPromise(store.clear());
}

