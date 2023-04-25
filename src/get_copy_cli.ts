#!/usr/bin/env node
/*! Copyright 2013 - 2023 Ayogo Health Inc. */

import { parseArgs } from "node:util";
import { writeFile } from "node:fs/promises";
import type { GetCopyOptions } from "./config.js";
import getCopyFromSpreadsheet from "./index.js";

function usage(exitCode: number) {
  console.log("Get Copy script");
  console.log("");
  console.log("Usage: get_copy [OPTIONS] [SPREADSHEET_ID]");
  console.log("");
  console.log("Options:");
  console.log("  -h, --help                  Print this help message and exit");
  console.log("");
  console.log("  -v, --verbose               Print warnings to the console for debugging");
  console.log("");
  console.log("  -o, --output=FILE           Destination file path (default: stdout)");
  console.log("");
  console.log("  -c, --value-column=COL      Title of spreadsheet column to use for the");
  console.log("                              translation values (default: \"value\")");
  console.log("");
  console.log("  -k, --key-column=COL        Title of spreadsheet column to use for the");
  console.log("                              translation key name (default: \"key\")");
  console.log("");
  console.log("      --no-auth-cache         Disables caching of authentication tokens to file");
  console.log("");
  console.log("      --header                Header to include at the top of the output file");

  process.exit(exitCode);
}

function output(destPath: string|null, header: string = "") {
  if (destPath == null) {
    return console.log;
  }

  return function(obj: Awaited<ReturnType<typeof getCopyFromSpreadsheet>>) {
    const json = JSON.stringify(obj, null, 2);

    if (destPath.endsWith(".json")) {
      // Need to just dump the object without any header or anything
      return writeFile(destPath, json, { encoding: "utf8" });
    } else {
      let fileText = `export default ${json};\n`

      if (header) {
        fileText = `/*! ${header} */\n${fileText}`;
      }

      return writeFile(destPath, fileText, { encoding: "utf8" });
    }
  };
}

const flagOptions = {
  "help": {
    type: "boolean" as const,
    short: "h"
  },
  "verbose": {
    type: "boolean" as const,
    short: "v"
  },
  "output": {
    type: "string" as const,
    short: "o"
  },
  "key-column": {
    type: "string" as const,
    short: "k"
  },
  "value-column": {
    type: "string" as const,
    short: "c"
  },
  "no-auth-cache": {
    type: "boolean" as const
  },
  "header": {
    type: "string" as const
  }
};

const opts = {} as GetCopyOptions;
const args = parseArgs({ strict: true, allowPositionals: true, options: flagOptions });

if (args.positionals.length < 1 || args.values.help) {
  usage(args.values.help ? 0 : -1);
}

if ("verbose" in args.values) {
  opts.verbose = true;
}

let spreadsheetId = args.positionals[0];
let outputPath: string|null = null;

// Backwards compatibility with existing usage
if (args.positionals.length > 1) {
  if (opts.verbose) {
    console.warn("get_copy invoked with legacy arguments. Please migrate to new flagged options.");
  }

  outputPath = args.positionals[0];
  spreadsheetId = args.positionals[1];

  if (args.positionals.length > 2) {
    opts.value_column = args.positionals[2];
  }
}

if ("no-auth-cache" in args.values) {
  opts.cache_auth_token = false;
}

if ("output" in args.values) {
  outputPath = args.values.output!;
}

if ("key-column" in args.values) {
  opts.key_column = args.values["key-column"];
}

if ("value-column" in args.values) {
  opts.value_column = args.values["value-column"];
}

getCopyFromSpreadsheet(spreadsheetId, opts)
    .then(output(outputPath, args.values.header));
