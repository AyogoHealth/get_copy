/*! Copyright 2013 - 2022 Ayogo Health Inc. */

import type { GetCopyOptions } from "./config.js";
import { getGoogleCredentials } from "./auth.js";
import { getSpreadsheet } from "./sheets.js";

export default function getCopyFromSpreadsheet(spreadsheetId: string, opts: GetCopyOptions = {}) {
  return getGoogleCredentials(opts)
    .then(auth => Object.assign({}, opts, { access_token: auth.access_token }))
    .then(getSpreadsheet.bind(null, spreadsheetId));
}
