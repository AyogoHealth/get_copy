get_copy script
===============

Turns a Google spreadsheet of translation keys and string values into a JSON file, which can be used with tools like [ngx-translate](http://www.ngx-translate.com/), [react-i18next](https://react.i18next.com/), or [vue-i18n](https://vue-i18n.intlify.dev/).

Installation
------------

```
npm install --dev @ayogohealth/get_copy
```

Usage
-----

```
Usage: get_copy [OPTIONS] [SPREADSHEET_ID]

Options:
  -h, --help                  Print this help message and exit

  -v, --verbose               Print warnings to the console for debugging

  -o, --output=FILE           Destination file path (default: stdout)

  -c, --value-column=COL      Title of spreadsheet column to use for the
                              translation values (default: "value")

  -k, --key-column=COL        Title of spreadsheet column to use for the
                              translation key name (default: "key")

      --no-auth-cache         Disables caching of authentication tokens to file

      --header                Header to include at the top of the output file
```

Examples
--------

Using [this example spreadsheet](https://docs.google.com/spreadsheets/d/1L9x1ocxy6VwNEPsrWiTri4wGYN9FQUymRg1p267r9R4/):

```
npx get_copy -o src/locales/en.json 1L9x1ocxy6VwNEPsrWiTri4wGYN9FQUymRg1p267r9R4

npx get_copy -o src/locales/fr.json -c "Value-FR" 1L9x1ocxy6VwNEPsrWiTri4wGYN9FQUymRg1p267r9R4
```

The contents of `src/locales/en.json` would be:
```json
{
  "app_name": "Hello",
  "main": {
    "footer": "Goodbye",
    "greeting": "Hello {name}!"
  }
}
```

The contents of `src/locales/fr.json` would be:
```json
{
  "app_name": "Bonjour",
  "main": {
    "footer": "Au revoir",
    "greeting": "Bonjour {name}!"
  }
}
```

Contributing
------------

Contributions of bug reports, feature requests, and pull requests are greatly
appreciated!

Please note that this project is released with a [Contributor Code of
Conduct](CODE_OF_CONDUCT.md). By participating in this project you agree to
abide by its terms.


Licence
-------

Released under the [MIT Licence](LICENCE).

Copyright © 2022 – 2023 Ayogo Health Inc.
