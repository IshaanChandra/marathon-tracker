# Garmin auto-sync (via Strava)

When a run finishes, the site checks off that day's run and fills in actual distance +
pace automatically. There's no direct watch API, so the pipe is:

```
Garmin watch → Garmin Connect → (auto-upload) → Strava
  → Strava push webhook → /api/strava/webhook?t=<secret>
  → fetch activity → map to its NY plan day → setLog (✓ done + miles + pace)
```

Strava is authoritative for distance/pace (they overwrite a manual entry); notes, lift,
and stretch check-offs are never touched. Only **runs** are applied (rides/walks ignored).

## One-time setup

1. **Create a Strava API application** at <https://www.strava.com/settings/api>.
   - Note the **Client ID** and **Client Secret**.
   - Set **Authorization Callback Domain** to the production domain only — the bare host,
     no scheme/path (e.g. `marathon-tracker.vercel.app`).
2. **Add env vars** in Vercel (Project → Settings → Environment Variables), then redeploy:
   - `STRAVA_CLIENT_ID`
   - `STRAVA_CLIENT_SECRET`
   - (For local dev, add the same two to `.env.local`. OAuth/webhooks only work against a
     public URL, so end-to-end testing happens on the deployed site or an ngrok tunnel.)
3. **Enable Garmin → Strava auto-upload** once: Garmin Connect → Settings → Connected
   Apps / Partner Connections → connect Strava (this makes finished runs appear in Strava).
4. **Connect + arm** in the app: open **Progress** → **Connect Strava** → authorize, then
   tap **Enable auto-sync** (registers the webhook; Strava validates it immediately).
5. **Test:** record or upload a run → within seconds the run's day should show ✓ with the
   synced distance and pace.

## How auth/secrets are handled

- OAuth tokens live in the `strava.tokens` setting (Supabase `settings` table). They are
  **redacted from the public `/api/state`** via `isSecretSetting()` — the site is
  public-read, so secrets must never ship to the client. The UI reads only the non-secret
  `strava.status` mirror (connected flag, last sync).
- The webhook is unauthenticated by Strava (no payload signature), so it's guarded by a
  salted `?t=` secret (`stravaToken()` in `src/lib/auth.ts`) plus an `owner_id` check, and
  it only ever fetches activities with our own stored token.
- Access tokens expire every 6h and are refreshed in place by `getAccessToken()`.

## Code map

- `src/lib/strava.ts` — mapping (`activityToLogPatch`), apply (`applyActivity`), OAuth/token
  store, activity fetch, subscription helpers.
- `src/app/api/strava/{connect,callback,webhook,subscribe,test}/route.ts` — routes.
  `connect/subscribe/test` are PIN-gated (`src/proxy.ts` matcher); `callback/webhook` are open.
- `src/components/StravaCard.tsx` — Progress-tab connect/status UI.

## Troubleshooting

- **"Enable auto-sync" fails with a 500/502:** env vars missing or the callback domain in the
  Strava app settings doesn't match the deploy host.
- **Runs not appearing:** confirm Garmin→Strava auto-upload is on and the activity is typed as
  a run; check `GET /api/strava/subscribe` (PIN-gated) shows a subscription with the right
  callback URL.
- **Wrong day:** the run is matched by its start time converted to America/New_York. A run
  recorded abroad still maps to the NY calendar day (intended — the plan is NY-dated).
- **Two runs same day:** the later sync overwrites; adjust by hand if needed.
