# sg-job-hunter-plugin-{{NAME}}

A community plugin for [SG Job Hunter](https://github.com/sg-job-hunter/sg-job-hunter).

## What it does

TODO: one paragraph.

## Install

```bash
# Once it's in the SG Job Hunter registry:
node plugins.mjs add {{NAME}}

# Before listing (install directly from your repo at a pinned commit):
node plugins.mjs add <your-github-user>/sg-job-hunter-plugin-{{NAME}} --sha <40-hex-commit>
```

Then enable + consent:

```bash
node plugins.mjs enable {{NAME}}            # shows the capability card
node plugins.mjs enable {{NAME}} --confirm  # grants it
```

## Configure

- Secrets go in your `.env` (the names are in `manifest.json` → `requiredEnv`).
- Non-secret options go in `config/plugins.yml` under `plugins.{{NAME}}`.

## Get it listed as approved

Open a registry PR against SG Job Hunter (see
[plugins/README.md](https://github.com/sg-job-hunter/sg-job-hunter/blob/main/plugins/README.md)).

## License

MIT
