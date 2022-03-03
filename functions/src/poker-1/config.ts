import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

const defaultConfig = functions.config();

const db = admin.firestore();
let configDocs: { [key: string]: any };

const loadPromise = new Promise<{ [key: string]: any }>((resolve) =>
  db
    .collection("admin")
    .doc("config")
    .onSnapshot(
      (snapshot) => {
        let fireResolve = !configDocs;
        configDocs = {
          ...defaultConfig,
          app: { ...defaultConfig.app, ...snapshot.data() },
        };
        if (fireResolve) {
          resolve(configDocs);
        }
        console.log({ configDocs });
      },
      (error) => {
        let fireResolve = !configDocs;
        configDocs = functions.config();
        if (fireResolve) {
          resolve(configDocs);
        }
      }
    )
);

function configForKey(configBucket: { [key: string]: any }, keyPath: string[]) {
  let bucket = configBucket;
  for (const subPath of keyPath) {
    bucket = bucket[subPath];
    console.log({ configBucket, bucket, keyPath });
    if (!bucket) return bucket;
  }
  return bucket;
}

export function getCachedConfig() {
  return configDocs || {};
}

export async function loadConfig() {
  if (configDocs) {
    return configDocs;
  }
  return loadPromise;
}

export async function configForHost(host = "", keyPath: string[] = []) {
  const baseConfig = await loadConfig();
  const domainsConfig = baseConfig.domains || {};
  const sanitizedHost = host.replace(/\./g, "_");
  const configBucket =
    domainsConfig && domainsConfig[sanitizedHost]
      ? domainsConfig[sanitizedHost]
      : baseConfig;
  console.log(baseConfig, sanitizedHost, configBucket);

  return (
    configForKey(configBucket, keyPath) || configForKey(baseConfig, keyPath)
  );
}
