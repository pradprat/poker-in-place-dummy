import * as Sentry from "@sentry/node";
import * as functions from "firebase-functions";

const namespace = require("./namespace").default;

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
/**
 * Set up Sentry for error reporting
 */
export function setupLogger() {
  if (functions.config().sentry && functions.config().sentry.dsn) {
    Sentry.init({
      dsn: functions.config().sentry.dsn,
      ignoreErrors: [/Failed to acquire lock for.*/],
    });
  } else {
    console.warn(
      "/!\\ sentry.dsn environment variable not found. Skipping setting up Sentry..."
    );
  }
}

// const oldError = console.error;
// console.error = function (message?: any, ...optionalParams: any[]) {
//   oldError(message, ...optionalParams);
// };

export default {
  exception: (
    e: Error,
    context: {
      tags?: { [key: string]: any };
      extra?: { [key: string]: any };
    } = { tags: {}, extra: {} },
    ...additionalArgs: any
  ) => {
    console.error(e, ...additionalArgs);
    Sentry.withScope((scope) => {
      const user = namespace.get("context_user") || {};
      const tags = namespace.get("context_tags") || {};
      const extra = namespace.get("context_extra") || {};
      scope.setUser(user);
      scope.setTags({ ...(context.tags || {}), ...tags });
      scope.setExtras({ ...(context.extra || {}), ...extra });
      if (typeof e === "string") {
        Sentry.captureMessage(e);
      } else {
        Sentry.captureException(e);
      }
    });
  },
  error: (...args: any) => {
    console.error(...args);
  },
};
