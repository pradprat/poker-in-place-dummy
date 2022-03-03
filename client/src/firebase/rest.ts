import { TwilioError } from "twilio-video";
import Tracker from "@asayerio/tracker";

export type GetIDTokenFunction = (forceRefresh?: boolean) => Promise<string>;
export type GetAPIServerFunction = () => string;

export async function callFirebaseGameFunction(
  method: string,
  parameters: { [key: string]: string },
  getIdToken: GetIDTokenFunction,
  getApiServer: GetAPIServerFunction,
  gameId: string,
  setError?: (error: TwilioError | null) => void
) {
  return callFirebaseFunction(
    method,
    { ...parameters, tableId: gameId },
    getIdToken,
    getApiServer,
    setError
  );
}

export async function callFirebaseGameFunctionWithJson(
  method: string,
  parameters: { [key: string]: any },
  getIdToken: GetIDTokenFunction,
  getApiServer: GetAPIServerFunction,
  gameId: string,
  setError?: (error: TwilioError | null) => void,
  tracker?: Tracker
) {
  return callFirebaseFunctionWithJson(
    method,
    { ...parameters, tableId: gameId },
    getIdToken,
    getApiServer,
    setError,
    tracker
  );
}

export async function callFirebaseTournamentFunction(
  method: string,
  parameters: { [key: string]: string },
  getIdToken: GetIDTokenFunction,
  getApiServer: GetAPIServerFunction,
  tournamentId: string,
  setError?: (error: TwilioError | null) => void
) {
  return callFirebaseFunction(
    method,
    { ...parameters, tournamentId },
    getIdToken,
    getApiServer,
    setError
  );
}

export async function callFirebaseTournamentFunctionWithJson(
  method: string,
  parameters: { [key: string]: any },
  getIdToken: GetIDTokenFunction,
  getApiServer: GetAPIServerFunction,
  tournamentId: string,
  setError?: (error: TwilioError | null) => void,
  tracker?: Tracker,
  retryAttempts = 0,
  httpMethod = "POST"
) {
  return callFirebaseFunctionWithJson(
    method,
    { ...parameters, tournamentId },
    getIdToken,
    getApiServer,
    setError,
    tracker,
    retryAttempts,
    httpMethod
  );
}

export async function callFirebaseFunction(
  method: string,
  parameters: { [key: string]: string },
  getIdToken: GetIDTokenFunction,
  getApiServer: GetAPIServerFunction,
  setError?: (error: TwilioError | null) => void
) {
  const headers = new window.Headers();
  try {
    const idToken = await getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  } catch (e) {
    console.error(e);
  }
  headers.set("Domain", document.location.hostname);

  let apiServer = process.env.REACT_APP_API_ENDPOINT;
  try {
    apiServer = getApiServer() || process.env.REACT_APP_API_ENDPOINT;
  } catch (e) {
    console.error(e);
  }
  const endpoint = `${apiServer}/${method}`;
  const params = new window.URLSearchParams({
    ...parameters,
  });

  const json = await fetch(`${endpoint}?${params}`, {
    headers,
    method: "POST",
  }).then((res) => res.json());

  if (json.error) {
    if (setError) {
      setError({ message: json.error } as TwilioError);
      return;
    }
    throw new Error(json.error);
  }

  return json;
}

// ToDo: Make params as an object
export async function callFirebaseFunctionWithJson(
  method: string,
  parameters: { [key: string]: string },
  getIdToken: GetIDTokenFunction,
  getApiServer: GetAPIServerFunction,
  setError?: (error: TwilioError | null) => void,
  tracker?: Tracker,
  retryAttempts = 0,
  httpMethod = "POST"
) {
  const headers = new window.Headers();
  try {
    const idToken = await getIdToken();
    headers.set("Authorization", `Bearer ${idToken}`);
  } catch (e) {
    console.error(e);
  }
  headers.set("Domain", document.location.hostname);

  const apiServer = getApiServer() || process.env.REACT_APP_API_ENDPOINT;
  const endpoint = `${apiServer}/${method}`;

  tracker?.event(method, parameters);

  for (let i = 0; i <= retryAttempts; ++i) {
    const json = await fetch(`${endpoint}`, {
      headers,
      method: httpMethod,
      body: JSON.stringify(parameters),
    }).then((res) => res.json());

    if (json.error) {
      if (i < retryAttempts) {
        continue;
      }
      if (setError) {
        setError({ message: json.error } as TwilioError);
        return;
      }
      throw new Error(json.error);
    }

    return json;
  }
}

