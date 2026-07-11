# Deploying your portfolio with cross-browser sync

Your site is now a static site (`index.html`, `script.js`, `styles.css`)
plus three small serverless functions in `/api` and a Postgres database.
Content you edit from the admin panel is written to that database, so it
shows up for every visitor in every browser — not just the one that made
the edit.

## 1. Create a Vercel account
Go to https://vercel.com/signup and sign up (GitHub login is easiest).

## 2. Push this project to GitHub
Create a new GitHub repo and push all these files to it (including the
`api/` and `lib/` folders and `package.json` — don't skip them, the site
won't work without them).

## 3. Import the project into Vercel
In the Vercel dashboard: **Add New → Project → Import** your GitHub repo.
Leave the framework preset as "Other" and the default build settings —
no build step is required, Vercel will serve the static files and deploy
`/api/*.js` as serverless functions automatically.

## 4. Add a Postgres database
In your new Vercel project: **Storage tab → Create Database → Postgres**
(this uses Neon under the hood). Once created, click **Connect** to your
project — this automatically sets the `POSTGRES_URL` environment variable
for you. No manual copy-pasting needed.

## 5. Set the admin token secret
Still in the project: **Settings → Environment Variables** → add:
- `ADMIN_TOKEN_SECRET` = any long random string (e.g. run
  `openssl rand -hex 32` locally and paste the result, or mash your
  keyboard for 40+ characters). This signs admin login sessions — keep it
  secret, never commit it to the repo.

## 6. Redeploy
After adding the environment variables, trigger a redeploy (Vercel
usually prompts you, or go to **Deployments → ⋯ → Redeploy**) so the
functions pick up the new variables.

## 7. Test it
- Visit your deployed URL.
- Open the admin panel, log in with `chaitanya-nxtwave`.
- Make a change (e.g. edit About text) and save.
- Open the same URL in a different browser or incognito window — the
  change should be there.
- In the Security tab, you can change the password any time; it updates
  for everyone immediately.

## Notes
- The password is never stored in the code or visible in page source —
  only its SHA-256 hash lives in the database, and the comparison happens
  inside the serverless function, not in the browser.
- If the database isn't connected yet (e.g. you're just testing the HTML
  locally), the site falls back to the old localStorage-only behavior
  automatically — nothing breaks, it just won't sync across browsers
  until the backend is live.
- Local file uploads: opening `index.html` directly (`file://`) won't
  reach `/api` at all — you need the Vercel-deployed URL for syncing to
  work.
