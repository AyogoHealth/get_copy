/*! Copyright 2022 Ayogo Health Inc. */

import type { GetCopyOptions } from "./config.js";
import { CredentialFilePath, GoogleClientID, GoogleClientSecret, OAuth2CallbackPort } from "./config.js";
import { readFile, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { randomUUID } from "node:crypto";
import opener from "opener";

interface GoogleAuthCredentials {
  access_token: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  token_type: "Bearer";
}

export function loadCredentialsFromFile() {
  return readFile(CredentialFilePath, { encoding: "utf8" })
    .then((creds) => JSON.parse(creds) as GoogleAuthCredentials);
}

export function saveCredentialsToFile(creds: GoogleAuthCredentials) {
  return writeFile(CredentialFilePath, JSON.stringify(creds), { encoding: "utf8", mode: 0o600 })
    .then(() => creds);
}

export function getGoogleAuthURL(state: string) {
  const url = new URL("https://accounts.google.com/o/oauth2/v2/auth");

  url.searchParams.set("client_id", GoogleClientID);
  url.searchParams.set("redirect_uri", `http://127.0.0.1:${OAuth2CallbackPort}/oauth2callback`);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("access_type", "offline");
  url.searchParams.set("scope", "https://www.googleapis.com/auth/spreadsheets.readonly");
  url.searchParams.set("state", state);

  return url.href;
}

export function getGoogleAuthToken(authCode: string) {
  const url = new URL("https://oauth2.googleapis.com/token");

  const data = new URLSearchParams();
  data.set("code", authCode);
  data.set("client_id", GoogleClientID);
  data.set("client_secret", GoogleClientSecret);
  data.set("grant_type", "authorization_code");
  data.set("redirect_uri", `http://127.0.0.1:${OAuth2CallbackPort}/oauth2callback`);

  return fetch(url, { method: "POST", body: data })
    .then(response => response.json() as Promise<Partial<GoogleAuthCredentials>>)
    .then(response => {
        if (response.access_token) {
            return response as GoogleAuthCredentials;
        } else {
            return Promise.reject(new Error(JSON.stringify(response)));
        }
    });
}

export function refreshGoogleAuthToken(auth: GoogleAuthCredentials) {
  const url = new URL("https://oauth2.googleapis.com/token");

  const data = new URLSearchParams();
  data.set("refresh_token", auth.refresh_token);
  data.set("client_id", GoogleClientID);
  data.set("client_secret", GoogleClientSecret);
  data.set("grant_type", "refresh_token");

  return fetch(url, { method: "POST", body: data })
    .then(response => response.json() as Promise<Partial<GoogleAuthCredentials>>)
    .then(response => {
        if (response.access_token) {
            return Object.assign({}, auth, response) as GoogleAuthCredentials;
        } else {
            return Promise.reject(new Error(JSON.stringify(response)));
        }
    });
}

export function getGoogleAuthCode() {
  return new Promise<string>((resolve, reject) => {
    const state = randomUUID();

    const server = createServer((request, response) => {
      try {
        const url = new URL(request.url!, `http://127.0.0.1:${OAuth2CallbackPort}`);
        if (url.pathname !== "/oauth2callback") {
          response.end("");
          return;
        }

        const code = url.searchParams.get("code");
        const recvState = url.searchParams.get("state");
        const error = url.searchParams.get("error");

        if (error || !code || recvState !== state) {
          response.end("<p><b>Authentication failed!</b> Please try running the script again.</p>");
          throw new Error(`OAuth2 authentication failure${ error ? `: ${error}` : ""}`);
        }

        response.end("<p><b>Authentication successful!</b> You can close this window and return to the terminal.</p><script>window.close();</script>");
        resolve(code);
      } catch (e) {
        reject(e);
      } finally {
        server.close();
      }
    });

    server.listen(OAuth2CallbackPort, () => {
      const hwnd = opener(getGoogleAuthURL(state));

      setTimeout(() => {
        hwnd.unref();
      }, 100);
    });
  });
}

export function doGoogleLoginFlow() {
  return getGoogleAuthCode()
    .then(getGoogleAuthToken);
}

export function getGoogleCredentials(opts : GetCopyOptions = {}) {
  if (opts.cache_auth_token === false) {
    return doGoogleLoginFlow();
  }

  return loadCredentialsFromFile()
    .then(refreshGoogleAuthToken, doGoogleLoginFlow)
    .then(saveCredentialsToFile);
}
