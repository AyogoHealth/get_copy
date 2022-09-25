/*! Copyright 2022 Ayogo Health Inc. */

// TypeScript's @types/node don't include fetch (yet)
declare global {
  var fetch: typeof import("undici").fetch;
}

export type GetCopyOptions = {
  cache_auth_token?: boolean;
  verbose?: boolean;
  key_column?: string;
  value_column?: string;
};

export const CredentialFilePath = ".spreadsheet_auth.json";
export const OAuth2CallbackPort = 5770;
export const GoogleClientID = "710694596488-5ab0c1jbioumfv4nmvm1i2jjhpcrpd2s.apps.googleusercontent.com";
export const GoogleClientSecret = "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";
