# GitHub / CI

## Commit author (required)

All commits — including those created by AI agents — must use:

- **Name:** Ali Hasan  
- **Email:** alihasan12soft786@gmail.com  

Local repo is configured with this identity. Agents should use `--author="Ali Hasan <alihasan12soft786@gmail.com>"` if config is missing.

## Workflows

| Workflow | File | Purpose |
|----------|------|---------|
| **CI** | `.github/workflows/ci.yml` | Typecheck, lint, Expo doctor, Android + iOS JS exports |
| **EAS Native Builds** | `.github/workflows/eas-build.yml` | Real APK/AAB + IPA via EAS (needs `EXPO_TOKEN` secret) |

### CI secrets / env

CI uses public Render API URLs as `EXPO_PUBLIC_*` (no secrets required for validate/export).

For EAS native builds, add repo secret:

1. Create token: https://expo.dev/settings/access-tokens  
2. GitHub → Settings → Secrets → `EXPO_TOKEN`  
3. Run **EAS Native Builds** via Actions → workflow_dispatch, or push a `v*` tag.

Also run `eas init` once and set a real `extra.eas.projectId` in `app.json`.

## Local checks (same as CI validate)

```bash
npm run typecheck
npm run lint
npm run export:android
npm run export:ios
```
