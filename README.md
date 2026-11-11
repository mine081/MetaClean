# 🧼 MetaClean

A video metadata cleaner that runs **entirely in your browser**. It removes location (GPS), device model, editing software and dates from Instagram, TikTok and phone videos, **without re-encoding**: no quality loss and very fast.

## Features

- Cleans several videos at once (MP4, MOV and M4V).
- No re-encoding: picture and sound stay identical to the original.
- Download each cleaned video or all of them together as a ZIP.
- User accounts (sign up, log in, forgot password) through Netlify Identity.

## Privacy

Your videos **never leave your computer**. All cleaning happens in the browser, with nothing uploaded to a server. The only data stored by an external service is the email and password of user accounts, handled by Netlify Identity.

## What is removed

- `udta` and `meta` boxes: GPS location, device model, software and tags.
- `uuid` and XMP boxes.
- Creation and modification dates.

How it works: the MP4/MOV file is read box by box, the `moov` box is rewritten without the metadata, and the video data offsets (`stco`/`co64`) are corrected. Video and audio content is copied as is.

## Limitations

- Only works with the MP4/MOV family. WebM, MKV and AVI are not supported.
- Information stored **inside** the video stream, such as the encoder settings text, is not removed. That would require re-encoding, which loses quality.
- Internal track names (for example, "VideoHandler") remain. They are usually generic and do not identify the person.

## How access works

- The **home page (`/`) is the sign-up page.**
- The **metadata cleaner (`/limpador.html`) redirects to the sign-up page when the user is not logged in.**
- Logged-in users who open `/` or `/login.html` go straight to the cleaner.
- The old `/cadastro.html` link redirects to `/`.

> Access control is done with JavaScript in the browser. It organizes access but is not server-side protection. Since the cleaner runs entirely in the browser and stores no data, there is nothing sensitive behind it.

## Deploying to Netlify

This is a static site (no server). Accounts use **Netlify Identity**, Netlify's built-in login system: no need to create an account on another service or paste any keys.

1. Add the files from this repository to a Netlify project: connect the GitHub repository (**Add new site → Import an existing project**) or drag the folder in (**Deploy manually**).
2. Enable **Identity** in the project dashboard.
3. Open the published address and test it (see below).

### Email confirmation

By default, Netlify Identity sends a confirmation email on sign-up. The user clicks the link, the account is activated and they go straight to the cleaner.

To let people in without confirming their email: in the Netlify dashboard, open the project → **Identity** → **Emails** and turn on automatic confirmation (autoconfirm). The site works either way.

### Other options (Project → Identity)

- **Registration:** "Open" (anyone can sign up) or "Invite only" (only people you invite). Invitations open the create-password page automatically.
- **Users:** view, invite or remove accounts and send password reset emails.
- Custom emails and your own sender address require the Pro plan or higher.

### Testing after deploying

1. Open the site: the sign-up page appears.
2. Try opening `/limpador.html` without an account: you are sent back to the home page.
3. Create an account, confirm by email and check that the cleaner opens.
4. Click **Sign out**, go to **Log in → Forgot password**, open the email and create a new password.

Login does not work with local `netlify dev`; always test on the published site (or a Deploy Preview).

## Files

| File | Purpose |
|---|---|
| `index.html` | Sign-up page (home) |
| `limpador.html` | The metadata cleaner (requires login) |
| `login.html` | Log in |
| `esqueci-senha.html` | Requests the password reset link by email |
| `redefinir-senha.html` | Page opened from the email link (new password / invitation) |
| `config.js` | Page addresses and minimum password length |
| `app.js`, `style.css` | Header, footer, accounts, access rules and styling |
| `vendor/netlify-identity.mjs` | Official `@netlify/identity` library for the browser |
| `_redirects` | Redirects the old `/cadastro.html` to `/` |

## License

Released under the [MIT License](LICENSE). Copyright © 2026 MetaClean.
