/*! Copyright 2013 - 2022 Ayogo Health Inc. */

import type { GetCopyOptions } from "./config.js";
import { fetch } from "undici";

interface SpreadsheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
  sheets: Array<{
    properties: {
      title: string|null;
      index: number|null;
      hidden: boolean|null;
    }
  }>;
}

interface SpreadsheetValuesSheet {
  range: string;
  values: Array<Array<string>>;
}

interface SpreadsheetValuesResponse {
  spreadsheetId: string;
  valueRanges: Array<SpreadsheetValuesSheet>
}

type RowTuple = [key: string, value: string];

interface LocaleTree {
  [key: string]: string|LocaleTree;
}

export function remapSheetValues(opts: GetCopyOptions, sheet: SpreadsheetValuesSheet) {
  const rows = sheet.values;
  const keyColumn = opts.key_column?.toLowerCase() ?? "key";
  const valueColumn = opts.value_column?.toLowerCase() ?? "value";
  const sheetName = sheet.range.replace(/\!.*$/, "");

  const headers = rows.shift()?.map(title => title.toLowerCase());
  if (!headers) {
    return [];
  }

  const keyIndex = headers.indexOf(keyColumn);
  if (keyIndex === -1) {
    if (opts.verbose) {
      console.warn(`Missing required column ${keyColumn} on sheet ${sheetName}`);
    }

    return [];
  }

  const valueIndex = headers.indexOf(valueColumn);
  if (valueIndex === -1) {
    if (opts.verbose) {
      console.warn(`Missing required column ${valueColumn} on sheet ${sheetName}`);
    }

    return [];
  }

  // Return all the non-empty rows, reduced to a pair of key/value
  return rows
    .map(row => [row[keyIndex], row[valueIndex]] as RowTuple)
    .filter(row => !!row[0] && !!row[1]);
}

export function sortObjectKeys<T>(obj: T): T {
  if (Array.isArray(obj)) {
    return obj.map(sortObjectKeys) as T;
  } else if (obj instanceof Object) {
    const newObj = {} as typeof obj;

    Object.keys(obj).sort().forEach(key => {
      Reflect.set(newObj, key, sortObjectKeys(Reflect.get(obj, key)));
    });

    return newObj as T;
  } else {
    return obj;
  }
}

export function buildLocaleTree(entries: Array<RowTuple>) {
  const tree = {} as LocaleTree;

  entries.forEach(([key, value]) => {
    const keyparts = key.split(".");

    if (keyparts.length > 1) {
      let subkey = tree;

      keyparts.forEach((part, idx) => {
        if (idx === (keyparts.length - 1)) {
          subkey[part] = value;
        } else if (subkey[part] === undefined) {
          subkey = subkey[part] = {} as LocaleTree;
        } else {
          subkey = subkey[part] as LocaleTree;
        }
      });
    } else {
      tree[key] = value;
    }
  });

  return sortObjectKeys(tree);
}

type getSpreadsheetOptions = GetCopyOptions & { access_token: string };
export function getSpreadsheet(spreadsheetId: string, opts: getSpreadsheetOptions) {
  const sheetUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`);
  const batchUrl = new URL(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values:batchGet`);
  const headers = { "Authorization": `Bearer ${opts.access_token}` };

  return fetch(sheetUrl, { headers: headers })
    .then(res => res.json() as Promise<SpreadsheetResponse>)
    .then(data => data.sheets.map(s => s.properties.title))
    .then(sheets => sheets.forEach(s => !!s && batchUrl.searchParams.append("ranges", s)))
    .then(() => fetch(batchUrl, { headers: headers }))
    .then(res => res.json() as Promise<SpreadsheetValuesResponse>)
    .then(data => data.valueRanges)
    .then(sheets => sheets.reduce((acc, sheet) => acc.concat(remapSheetValues(opts, sheet)), [] as Array<RowTuple>))
    .then(buildLocaleTree);
}
