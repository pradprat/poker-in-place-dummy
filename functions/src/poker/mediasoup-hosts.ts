import * as admin from "firebase-admin";

const db = admin.firestore();

const COLLECTION_NAME = "media-servers";
const DOCUMENT_NAME = "hosts";

export interface IMediaServerParams {
  host: string;
  tableId: string;
}

export const loadMediaServerHosts = (): Promise<Record<string, string[]>> => db
  .collection(COLLECTION_NAME)
  .doc(DOCUMENT_NAME)
  .get()
  .then((doc) => doc.exists ? doc.data() : {})

export const getLeastLoadedMediaServer = async (): Promise<string> => {
  const hosts = await loadMediaServerHosts();
  const sortedHosts = Object.keys(hosts)
    .sort((a, b) => hosts[a].length - hosts[b].length)

  return sortedHosts[0];
}

export const updateMediaServerHostTables = async ({ host, tableId }: IMediaServerParams) => db
  .collection(COLLECTION_NAME)
  .doc(DOCUMENT_NAME)
  .update({
    [host]: admin.firestore.FieldValue.arrayUnion(tableId)
  });

export const removeMediaServerHostTable = async ({ host, tableId }: IMediaServerParams) => db
  .collection(COLLECTION_NAME)
  .doc(DOCUMENT_NAME)
  .update({
    [host]: admin.firestore.FieldValue.arrayRemove(tableId)
  });
