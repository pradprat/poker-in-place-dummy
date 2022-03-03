import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import AwaitLock from "./await-lock";
const stringify = require("json-stable-stringify");
const namespace = require("../utils/namespace").default;

if (admin.apps.length === 0) {
  admin.initializeApp();
}

async function sleep(timeInMs: number) {
  return new Promise((resolve) => setTimeout(resolve, timeInMs));
}

const LOCK_RETRY_MAX_AGE = 1000 * 30;
const LOCK_RETRY_MAX_ATTEMPTS = 0; //12;
const LOCK_RETRY_WAIT_TIME = 50;

class Cache {
  private _enabled: boolean = false;
  private _cache: { [key: string]: any } = {};
  private _cacheWriteTime: { [key: string]: number } = {};
  private _cacheReadTime: { [key: string]: number } = {};
  public enable() {
    this._enabled = true;
  }
  public isEnabled() {
    return this._enabled;
  }
  public async get<Type>(
    id: string,
    collection: string,
    docRef?: FirebaseTypedDocReference<Type>,
    skipIntegrityCheck: boolean = false
  ): Promise<{
    id: string;
    value: Type | null | undefined;
    timestamp: number | null | undefined;
  }> {
    if (!this._enabled) return null;
    const key = `${collection}.${id}`;
    // Take collection ref rather than name for sub collections
    if (
      !skipIntegrityCheck &&
      docRef &&
      functions.config().app.is_emulator &&
      this._cache[key]
    ) {
      try {
        console.log("Checking cache for " + key, docRef.collectionName);
        const localCache = this._cache[key];
        const x = await docRef.get(true);
        const serverData = x.data();
        const diff = diffObject(localCache, serverData);
        if (Object.keys(diff).length) {
          console.error({
            key,
            collectionName: docRef.collectionName,
            diff: JSON.stringify({ diff, localCache, serverData }),
            // cache: localCache,
            // server: serverData,
          });
          this._cache[key] = serverData;
        }
      } catch (e) {
        console.warn(e);
      }
    }
    this.clearExpired<Type>();
    return {
      id: key,
      value: this._cache[key]
        ? (JSON.parse(JSON.stringify(this._cache[key])) as Type)
        : null,
      timestamp: this._cacheWriteTime[key],
    };
  }
  public set<Type>(
    id: string,
    collection: string,
    value: Type | Partial<Type>,
    readTimestamp: number | null | undefined,
    writeTimestamp: number | null | undefined
  ) {
    if (!this._enabled) return;
    const key = `${collection}.${id}`;
    console.log(
      "set",
      key,
      this._cacheWriteTime[key],
      readTimestamp,
      writeTimestamp
    );
    if (
      this._cacheWriteTime[key] &&
      this._cacheWriteTime[key] !== readTimestamp
    ) {
      console.log(
        "cache - no write time",
        this._cacheWriteTime[key],
        readTimestamp
      );
      this._delete<Type>(key);
      return;
    }
    this._cache[key] = value;
    this._cacheWriteTime[key] = writeTimestamp;
    // Keep the read time. We will evict from the cache after ~60s
    if (!this._cacheReadTime[key]) {
      this._cacheReadTime[key] = readTimestamp || writeTimestamp;
    }
  }
  public delete<Type>(id: string, collection: string) {
    const key = `${collection}.${id}`;
    this._delete(key);
  }
  public _delete<Type>(key: string) {
    if (!this._enabled) return;
    console.log(`purging cache`, key);
    delete this._cache[key];
    delete this._cacheWriteTime[key];
    delete this._cacheReadTime[key];
  }
  public clearExpired<Type>() {
    for (const key of Object.keys(this._cache)) {
      if (
        this._cacheWriteTime[key] &&
        this._cacheWriteTime[key] + 60 * 1000 < new Date().getTime()
      ) {
        this._delete<Type>(key);
      }
    }
  }
  public flush() {
    if (!this._enabled) return;
    console.log(`flushing cache`);
    this._cache = {};
    this._cacheWriteTime = {};
    this._cacheReadTime = {};
  }
  public keys() {
    return Object.keys(this._cache);
  }
  public readTimes() {
    return this._cacheReadTime;
  }
  public writeTimes() {
    return this._cacheWriteTime;
  }
}

const cache = new Cache();
export const locks: {
  [key: string]: {
    lock: AwaitLock;
    source: string;
    timestamp: number;
    held: boolean;
  };
} = {};

async function acquireLock(
  key: string,
  acquiringSource = "unknown",
  metadata = {}
) {
  if (cache.isEnabled()) {
    // we can do something special here
    console.log("acquiring awaitlock lock", locks[key]?.source);
    if (!locks[key]) {
      locks[key] = {
        lock: new AwaitLock(),
        source: acquiringSource,
        timestamp: new Date().getTime(),
        held: false,
      };
    }
    const now = new Date().getTime();
    console.log(now);
    if (locks[key].held && locks[key].timestamp + LOCK_RETRY_MAX_AGE >= now) {
      console.log("Release old held lock");
      try {
        // Release all the locks
        while (locks[key].lock.acquired) {
          locks[key].lock.release();
        }
      } catch (e) {
        //
      }
      // Lock held for too long - let it go
      locks[key] = {
        lock: new AwaitLock(),
        source: acquiringSource,
        timestamp: new Date().getTime(),
        held: false,
      };
    }
    console.log("acquireAsync");
    return locks[key].lock.acquireAsync({ timeout: 10 * 1000 }).then(() => {
      locks[key].held = true;
      locks[key].timestamp = new Date().getTime();
      return locks[key].lock;
    });
  }
  const db = admin.firestore();
  const lockDocRef = db.collection("locks").doc(key);
  return await db.runTransaction(
    async (transaction) => {
      const lockDoc = await transaction.get(lockDocRef);
      const now = new Date().getTime();
      const data = {
        key,
        acquiringSource,
        timestamp: now,
        metadata,
      };
      if (lockDoc.exists) {
        const lockData = lockDoc.data();
        if (lockData.timestamp + LOCK_RETRY_MAX_AGE >= now) {
          throw new Error(
            `Lock for ${key} already exists. Acquired by ${lockData.acquiringSource} @ ${lockData.timestamp}`
          );
        }
        await transaction.update(lockDocRef, data);
        console.log("transaction updated");
        return new AwaitLock();
      }

      console.log("setting transaction");
      await transaction.create(lockDocRef, data);
      return new AwaitLock();
    },
    { maxAttempts: 10 }
  );
}

async function releaseLock(key: string, lock: AwaitLock) {
  if (cache.isEnabled()) {
    // we can do something special here
    if (locks[key] && locks[key].lock === lock) {
      console.log("releasing awaitlock lock", key);
      locks[key].held = false;
    }
    try {
      lock.release();
    } catch (e) {
      // Already released
    }
    return;
  }

  const db = admin.firestore();
  const lockDocRef = db.collection("locks").doc(key);
  // console.log("releasing lock");
  // await lockDocRef.delete();
  await db.runTransaction(
    async (transaction) => {
      // console.log("releasing lock inside");
      const lockDoc = await transaction.get(lockDocRef);
      if (lockDoc.exists) {
        transaction.delete(lockDocRef);
      }
      return true;
    },
    { maxAttempts: 10 }
  );
}

async function acquireLockAndExecute(
  key: string,
  lambda: { (): any },
  acquiringSource: string,
  metadata?: any
) {
  const run = async () => {
    let reachedLambda = false;
    const start = new Date().getTime();
    console.log("acquireLockAndExecute");
    for (let i = 0; i <= LOCK_RETRY_MAX_ATTEMPTS; ++i) {
      try {
        const acquiredLocks = namespace.get("acquiredLocks") || {};
        const needsAcquire = !acquiredLocks[key];
        let lock: AwaitLock;
        let acquiredLock = false;
        if (needsAcquire) {
          console.log(`acquiring lock`, i);
          lock = await acquireLock(key, acquiringSource, metadata);
          console.log(`acquired lock`, new Date().getTime() - start);
          acquiredLock = true;
          if (!lock) {
            throw new Error("Failed to acquire lock");
          }
          acquiredLocks[key] = { acquiringSource, metadata };
          namespace.set("acquiredLocks", acquiredLocks);
          console.log(`acquired lock: `, new Date().getTime() - start);
        } else {
          // console.log("lock not needed", key, metadata);
        }
        try {
          // Need to await the lambda to unlock AFTER it's run
          reachedLambda = true;
          const startLambda = new Date().getTime();
          console.log("run lambda");
          const result = await lambda();
          console.log("ran lambda", new Date().getTime() - startLambda);
          return result;
        } catch (e) {
          if (e.message !== "Requires tournament lock") {
            console.error("Lambda error", e, acquiredLock);
          }
          throw e;
        } finally {
          if (needsAcquire && reachedLambda) {
            await releaseLock(key, lock);
            console.log(`released lock`, key);
            const acquiredLocksFinal = namespace.get("acquiredLocks") || {};
            delete acquiredLocksFinal[key];
            namespace.set("acquiredLocks", acquiredLocksFinal);
          } else {
            console.log(`release not needed`, key, metadata);
          }
        }
      } catch (e) {
        // console.log({ key, locks, e });
        // process.exit(0);
        if (reachedLambda) {
          throw e;
        }
        console.error(`Error acquiring lock for ${key}`, e);
        await sleep(LOCK_RETRY_WAIT_TIME);
      }
    }
    throw new Error("Failed to acquire lock for: " + key);
  };
  if (namespace.active) {
    return run();
  } else {
    return new Promise((resolve, reject) => {
      namespace.run(() => run().then(resolve).catch(reject));
    });
  }
}

function patchObject(base: any, diff: any, baseCopy: any = { ...base }) {
  for (const key of Object.keys(diff)) {
    const keyParts = key.split(".");
    let keyPartBase = baseCopy;
    const diffValue = diff[key];
    const isDelete = diffValue === admin.firestore.FieldValue.delete();
    for (let i = 0; i < keyParts.length; ++i) {
      const keyPart = keyParts[i];
      const isLast = i + 1 === keyParts.length;
      if (!keyPartBase[keyPart]) {
        if (!isDelete) {
          keyPartBase[keyPart] = isLast ? diffValue : {};
        }
      } else if (isLast) {
        if (isDelete) {
          delete keyPartBase[keyPart];
        } else {
          keyPartBase[keyPart] = diffValue;
        }
      }
      keyPartBase = keyPartBase[keyPart];
    }
  }
  return baseCopy;
}

function diffObject(before: any, after: any, path = "", updates: any = {}) {
  const keys = Array.from(
    new Set([...Object.keys(before), ...Object.keys(after)])
  );
  for (const key of keys) {
    const beforeVal = before[key];
    const afterVal = after[key];
    if (beforeVal !== afterVal) {
      const beforeType = typeof beforeVal;
      // const afterType = typeof afterVal;
      if (beforeType === "object") {
        // Skip arrays for now
        if (Array.isArray(beforeVal) || Array.isArray(afterVal)) {
          if (
            beforeVal &&
            afterVal &&
            stringify(beforeVal) !== stringify(afterVal)
          ) {
            updates[`${path}${key}`] =
              afterVal === undefined
                ? admin.firestore.FieldValue.delete()
                : afterVal;
          }
        } else if (!beforeVal) {
          updates[`${path}${key}`] =
            afterVal === undefined
              ? admin.firestore.FieldValue.delete()
              : afterVal;
        } else if (!afterVal) {
          updates[`${path}${key}`] = admin.firestore.FieldValue.delete();
        } else {
          diffObject(beforeVal, afterVal, `${path}${key}.`, updates);
        }
      } else {
        updates[`${path}${key}`] =
          afterVal === undefined
            ? admin.firestore.FieldValue.delete()
            : afterVal;
      }
    }
  }
  return updates;
}
export class FirebaseTypedDoc<Type> {
  private _doc: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>;
  private _dummyData: Partial<Type>;
  constructor(
    doc?: FirebaseFirestore.DocumentSnapshot<FirebaseFirestore.DocumentData>,
    ref?: FirebaseTypedDocReference<Type>,
    collectionName?: string,
    dummyData?: Partial<Type>
  ) {
    this._doc = doc;
    this.id = doc ? doc.id : ref.id;
    this.ref = ref;
    this._dummyData = dummyData;
    this.exists = doc ? doc.exists : !!dummyData;
  }

  public id: string;
  public ref: FirebaseTypedDocReference<Type>;
  public exists: boolean;

  setData(data: Type) {
    this._dummyData = data;
  }

  data() {
    return this._dummyData
      ? (this._dummyData as Type)
      : (this._doc.data() as Type);
  }

  async update(data: Partial<Type>) {
    return this.ref.update(data);
  }

  async get() {
    console.log(`<get-doc-1>: ${this.id}`);
    return this.ref.get();
  }

  base() {
    return this._doc;
  }
}

class FirebaseTypedQuerySnapshot<Type> {
  private _snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>;
  constructor(
    snapshot: FirebaseFirestore.QuerySnapshot<FirebaseFirestore.DocumentData>,
    collectionName: string
  ) {
    this._snapshot = snapshot;
    this.query = snapshot.query;
    this.docs = snapshot.docs.map(
      (doc) =>
        new FirebaseTypedDoc<Type>(
          doc,
          new FirebaseTypedDocReference<Type>(doc.ref, collectionName)
        )
    );
    this.size = snapshot.size;
  }
  public query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
  public docs: FirebaseTypedDoc<Type>[];
  public size: number;
  public empty: boolean;
  public readTime: FirebaseFirestore.Timestamp;
  docChanges() {
    return this._snapshot.docChanges();
  }
  base() {
    return this._snapshot;
  }
}

export class FirebaseTypedDocReference<Type> {
  private _ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>;
  public collectionName: string;
  public doc: FirebaseTypedDoc<Type>;
  constructor(
    ref: FirebaseFirestore.DocumentReference<FirebaseFirestore.DocumentData>,
    collectionName: string
  ) {
    this._ref = ref;
    this.id = ref.id;
    this.collectionName = collectionName;
  }
  public id: string;
  async get(skipCache = false) {
    console.log(`<get-1>: ${this.id}`);
    if (cache.isEnabled() && !skipCache) {
      const cachedData = await cache.get<Type>(
        this.id,
        this.collectionName,
        this
      );
      if (cachedData.value) {
        console.log(`lock - Loading from the cache for id ${this.id}`);
        this.doc = new FirebaseTypedDoc<Type>(
          null,
          this,
          this.collectionName,
          cachedData.value
        );
        console.log(`<get-2>: ${this.id}`);
        return this.doc;
      }
    }
    console.log(
      `lock - Loading from the server for id ${this.id}, skipCache: ${skipCache}`
    );
    return this._ref.get().then((doc) => {
      this.doc = new FirebaseTypedDoc<Type>(doc, this);
      if (cache.isEnabled() && !skipCache) {
        console.log(`[get] Saving to the cache for id ${this.id}`);
        cache.set<Type>(
          this.id,
          this.collectionName,
          doc.data() as Type,
          null,
          doc.updateTime?.toMillis()
        );
      }
      console.log(`<get-3>: ${this.id}`);
      return this.doc;
    });
  }
  async update(data: Partial<Type>) {
    console.log(`<update>: ${this.id}`);
    return this._ref.update(data).then(async (result) => {
      if (cache.isEnabled()) {
        const baseData = await cache.get(
          this.id,
          this.collectionName,
          this,
          true
        );
        console.log(`<update>: 2`);
        if (baseData.value) {
          console.log(`<update>: 3`);
          console.log(`[update] Saving to the cache for id ${this.id}`);
          cache.set<Type>(
            this.id,
            this.collectionName,
            patchObject(baseData.value, data),
            baseData.timestamp,
            result.writeTime.toMillis()
          );
        } else {
          cache.delete<Type>(this.id, this.collectionName);
        }
      }
    });
  }
  async set(data: Partial<Type>) {
    console.log(`<set>: ${this.id}`);
    return this._ref.set(data).then(async (result) => {
      console.log(`<set-2>: ${this.id}`);
      if (cache.isEnabled()) {
        const baseData = await cache.get(this.id, this.collectionName, this);
        if (baseData.value) {
          console.log(
            `[set] Saving to the cache for id ${this.id} (${JSON.stringify({
              baseData,
              result: patchObject(baseData.value, data),
            })})`
          );
          cache.set<Type>(
            this.id,
            this.collectionName,
            patchObject(baseData.value, data),
            baseData.timestamp,
            result.writeTime.toMillis()
          );
        } else {
          cache.delete<Type>(this.id, this.collectionName);
        }
      }
      console.log(`<set-3>: ${this.id}`);
    });
  }

  collection<SubType>(collectionName: string) {
    return new FirebaseTypedCollectionReference<SubType>(
      this._ref.collection(collectionName),
      collectionName
    );
  }
  base() {
    return this._ref;
  }
}

class FirebaseTypedQuery<Type> {
  private _query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>;
  private _collectionName: string;
  constructor(
    query: FirebaseFirestore.Query<FirebaseFirestore.DocumentData>,
    collectionName: string
  ) {
    this._query = query;
    this._collectionName = collectionName;
  }
  async get() {
    return this._query
      .get()
      .then(
        (result) =>
          new FirebaseTypedQuerySnapshot<Type>(result, this._collectionName)
      );
  }
  base() {
    return this._query;
  }
  where(
    fieldPath: string | FirebaseFirestore.FieldPath,
    opStr: FirebaseFirestore.WhereFilterOp,
    value: any
  ) {
    return new FirebaseTypedQuery<Type>(
      this._query.where(fieldPath, opStr, value),
      this._collectionName
    );
  }
  orderBy(
    fieldPath: string | FirebaseFirestore.FieldPath,
    directionStr?: FirebaseFirestore.OrderByDirection
  ) {
    return new FirebaseTypedQuery<Type>(
      this._query.orderBy(fieldPath, directionStr),
      this._collectionName
    );
  }
  limit(limit: number) {
    return new FirebaseTypedQuery<Type>(
      this._query.limit(limit),
      this._collectionName
    );
  }
  limitToLast(limit: number) {
    return new FirebaseTypedQuery<Type>(
      this._query.limitToLast(limit),
      this._collectionName
    );
  }

  select(field: string) {
    return new FirebaseTypedQuery<Type>(
      this._query.select(field),
      this._collectionName
    );
  }
}

class FirebaseTypedCollectionReference<Type> {
  private _ref: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>;
  protected _collectionName: string;
  constructor(
    ref: FirebaseFirestore.CollectionReference<FirebaseFirestore.DocumentData>,
    collectionName: string
  ) {
    this._ref = ref;
    this._collectionName = collectionName;
  }
  doc(key: string) {
    return new FirebaseTypedDocReference<Type>(
      this._ref.doc(key),
      this._collectionName
    );
  }
  async docs(ids: string[]) {
    console.log(`<docs-1>: ids`);
    if (cache.isEnabled()) {
      const docs = (
        await Promise.all(
          ids.map((id) => cache.get<Type>(id, this._collectionName))
        )
      ).filter((d) => d.value);
      if (docs.length === ids.length) {
        const docRefs = docs.map(
          (doc) =>
            new FirebaseTypedDoc(
              null,
              this.doc(doc.id),
              this._collectionName,
              doc.value
            )
        );
        console.log(`<docs-2>: ids`);
        return { docs: docRefs, size: docRefs.length };
      }
    }
    return this._ref
      .where(admin.firestore.FieldPath.documentId(), "in", ids)
      .get()
      .then((result) => {
        console.log(`<docs-3>: ids`);
        return new FirebaseTypedQuerySnapshot<Type>(
          result,
          this._collectionName
        );
      });
  }
  async add(data: Partial<Type>) {
    console.log(`<add>: unknown`);
    return this._ref.add(data).then((x) => {
      console.log(`Adding to the cache for id ${x.id}`);
      cache.set<Type>(
        x.id,
        this._collectionName,
        data,
        null,
        new Date().getTime()
      );
      return new FirebaseTypedDocReference<Type>(x, this._collectionName);
    });
  }
  where(
    fieldPath: string | FirebaseFirestore.FieldPath,
    opStr: FirebaseFirestore.WhereFilterOp,
    value: any
  ) {
    return new FirebaseTypedQuery<Type>(
      this._ref.where(fieldPath, opStr, value),
      this._collectionName
    );
  }
  orderBy(
    fieldPath: string | FirebaseFirestore.FieldPath,
    directionStr?: FirebaseFirestore.OrderByDirection
  ) {
    return new FirebaseTypedQuery<Type>(
      this._ref.orderBy(fieldPath, directionStr),
      this._collectionName
    );
  }
  limit(limit: number) {
    return new FirebaseTypedQuery<Type>(
      this._ref.limit(limit),
      this._collectionName
    );
  }
  limitToLast(limit: number) {
    return new FirebaseTypedQuery<Type>(
      this._ref.limitToLast(limit),
      this._collectionName
    );
  }
  async get() {
    return this._ref
      .get()
      .then(
        (docs) =>
          new FirebaseTypedQuerySnapshot<Type>(docs, this._collectionName)
      );
  }
  base() {
    return this._ref;
  }
}

export class FirebaseTypedWriteBatch {
  private _batch: FirebaseFirestore.WriteBatch;
  // private _id: number = new Date().getTime();
  private _postCommits: {
    (result: FirebaseFirestore.WriteResult): void;
  }[] = [];
  constructor(batch: FirebaseFirestore.WriteBatch) {
    this._batch = batch;
  }
  async update<Type>(
    documentRef: FirebaseTypedDocReference<Type>,
    data: Partial<Type>
  ) {
    // const now = new Date().getTime();
    if (cache.isEnabled()) {
      const baseData = await cache.get<Type>(
        documentRef.id,
        documentRef.collectionName,
        documentRef
      );
      // console.log(
      //   `[batch-update-${this._id}-${now}] Run ${
      //     documentRef.id
      //   } (${JSON.stringify({
      //     baseData: baseData?.value,
      //     result: baseData.value ? patchObject(baseData.value, data) : null,
      //     data,
      //   })}`
      // );
      this._postCommits.push(async (result: FirebaseFirestore.WriteResult) => {
        if (baseData.value) {
          // console.log(
          //   `[batch-update-${this._id}-${now}] Saving to the cache for id ${
          //     documentRef.id
          //   } (${JSON.stringify({
          //     baseData: baseData.value,
          //     result: patchObject(baseData.value, data),
          //     data,
          //   })})`
          // );
          cache.set<Type>(
            documentRef.id,
            documentRef.collectionName,
            patchObject(baseData.value, data),
            baseData.timestamp,
            result.writeTime.toMillis()
          );
        } else {
          cache.delete<Type>(documentRef.id, documentRef.collectionName);
        }
      });
    }
    return this._batch.update(documentRef.base(), data);
  }
  async set<Type>(
    documentRef: FirebaseTypedDocReference<Type>,
    data: Partial<Type>,
    options?: FirebaseFirestore.SetOptions
  ) {
    if (cache.isEnabled()) {
      const baseData = await cache.get<Type>(
        documentRef.id,
        documentRef.collectionName,
        documentRef
      );
      // console.log(
      //   `[batch-set] Run ${documentRef.id} (${JSON.stringify({
      //     // baseData: baseData.value,
      //     // result: patchObject(baseData.value, data),
      //     data,
      //   })}`
      // );
      this._postCommits.push(async (result: FirebaseFirestore.WriteResult) => {
        if (baseData.value) {
          // console.log(
          //   `[batch-set] Saving to the cache for id ${
          //     documentRef.id
          //   } (${JSON.stringify({ baseData: baseData.value, data })})`
          // );
          cache.set<Type>(
            documentRef.id,
            documentRef.collectionName,
            patchObject(baseData.value, data),
            baseData.timestamp,
            result.writeTime.toMillis()
          );
        } else {
          cache.delete<Type>(documentRef.id, documentRef.collectionName);
        }
      });
    }
    return this._batch.set(documentRef.base(), data, options);
  }
  async commit() {
    return this._batch.commit().then(async (result) => {
      await Promise.all(
        this._postCommits.map((lambda, index) => lambda(result[index]))
      );
      return result;
    });
  }
}
class FirebaseTypedDatabaseReference {
  private _db: FirebaseFirestore.Firestore;
  constructor(db: FirebaseFirestore.Firestore) {
    this._db = db;
  }
  collection<Type>(name: string) {
    return new FirebaseTypedCollectionReference<Type>(
      this._db.collection(name),
      name
    );
  }
  batch() {
    return new FirebaseTypedWriteBatch(this._db.batch());
  }
  base() {
    return this._db;
  }
}

admin.firestore().settings({ ignoreUndefinedProperties: true });
const typedDb = new FirebaseTypedDatabaseReference(admin.firestore());

export {
  acquireLockAndExecute,
  diffObject,
  patchObject,
  namespace,
  cache,
  typedDb,
};
