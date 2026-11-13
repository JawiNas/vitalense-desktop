# VitaLense for Windows and Mac

This folder turns the VitaLense website into installable apps for Windows and Mac. GitHub builds the installers for you, so you don't need a Mac or a Windows PC to make them.

Downloads (always the newest version):

- Windows 10 and 11 (64-bit): https://github.com/JawiNas/vitalense-desktop/releases/latest/download/VitaLense-Setup.exe
- Mac, Apple Silicon and Intel: https://github.com/JawiNas/vitalense-desktop/releases/latest/download/VitaLense.dmg

The **Get the app** page on the website (vitalense.vercel.app/#/download) links to these.

| File or folder | What it is |
| --- | --- |
| `www/` | The VitaLense app itself (the same files as the website) |
| `main.js` | The desktop window: remembers its size, opens outside links in the normal browser, installs updates |
| `package.json` | App name, version and installer settings |
| `build/icon.png` | The app icon (1024 × 1024) |
| `.github/workflows/desktop-release.yml` | The GitHub job that builds and publishes the installers |
| `scripts/copy-web.mjs` | Copies a new website build into `www/` |

## 1. How releases work

Every push to `main` builds both installers on GitHub Actions (about 5 minutes). When `"version"` in `package.json` has no release yet, the same run tags it (for example `v1.2.1`) and publishes a release with `VitaLense-Setup.exe`, `VitaLense.dmg` and the update files. When the version is already released, the run only builds; the installers are on the run's page under **Artifacts** for testing.

You can also push a tag such as `v1.2.1` yourself, or use **Releases → Draft a new release** with a new tag; both publish that tag.

## 2. Publish a new version

1. Raise `"version"` in `package.json`, for example from `1.2.0` to `1.2.1`. To include a new website build, first run `npm run web -- ../vitalense-web` (step 6).
2. Commit and push to `main` (or edit `package.json` on github.com and commit there).
3. The **Actions** tab shows "Desktop release" running. When it's green, the download links above serve the new version and installed apps offer the update.

## 3. Download buttons in the website

The website's `index.html` (repository `JawiNas/VitaLense`) and `www/index.html` here both contain this line near the top. `github` is already set; add the store pages when the phone apps are live:

```js
window.VL_LINKS = {
  github: 'JawiNas/vitalense-desktop',                                  // Windows and Mac links come from this
  android: 'https://play.google.com/store/apps/details?id=YOUR.APP.ID',   // when the Play Store listing is live
  ios: 'https://apps.apple.com/app/idYOUR-APP-NUMBER',                     // when the App Store listing is live
  windows: '', mac: '', androidApk: '', web: ''
};
```

Commit the change and Vercel redeploys the site. Until a store link is filled in, Android and iPhone show "Coming soon" with the Add to Home Screen steps.

## 4. What people see the first time (unsigned apps)

Without code-signing certificates (step 5), the apps work normally but each system warns once:

- **Windows:** "Windows protected your PC". Click **More info → Run anyway**. The warning fades as more people install the app.
- **Mac:** open `VitaLense.dmg` and drag VitaLense into **Applications**. The first time you open it, macOS says it can't check the app. Click **Done**, then go to **System Settings → Privacy & Security**, scroll down to the message about VitaLense, click **Open Anyway** and confirm. On macOS 14 or earlier you can instead right-click the app → **Open** → **Open**.
- If a Mac ever says the app "is damaged", run this once in Terminal: `xattr -cr /Applications/VitaLense.app`

## 5. Signing (optional, removes the warnings)

Add these under the repository's **Settings → Secrets and variables → Actions → New repository secret**. The workflow uses them automatically when they exist and builds unsigned apps when they don't.

| Secret | What to put in it |
| --- | --- |
| `MAC_CERT_P12_BASE64` | Your Apple "Developer ID Application" certificate, exported from Keychain Access as a `.p12` file with a password, then base64-encoded |
| `MAC_CERT_PASSWORD` | The password you chose for that `.p12` |
| `APPLE_ID` | The Apple Account email of your developer membership (for notarization) |
| `APPLE_APP_SPECIFIC_PASSWORD` | An app-specific password from account.apple.com → Sign-In and Security |
| `APPLE_TEAM_ID` | Your 10-character Team ID from developer.apple.com → Account → Membership |
| `WIN_CERT_P12_BASE64` | A Windows code-signing certificate as a base64-encoded `.pfx` / `.p12` file |
| `WIN_CERT_PASSWORD` | The password of that file |

The Mac certificate and notarization need a paid Apple Developer Program membership. Most Windows certificates sold today stay on a hardware key or in a cloud signing service rather than in a file; for those, see electron-builder's Windows signing guide (electron.build/code-signing-win) and add its settings to the build step.

Base64-encode a certificate file:

- Mac: `base64 -i certificate.p12 | pbcopy` (now paste it as the secret)
- Windows PowerShell: `[Convert]::ToBase64String([IO.File]::ReadAllBytes("certificate.pfx")) | Set-Clipboard`

## 6. Updates

The installed app checks your latest GitHub release when it starts. When there's a newer version it downloads it and offers **Restart now**; people's data stays as it is.

- On Windows this works whether or not the app is signed.
- On Mac, automatic updates need a signed app. Unsigned Mac apps send people to the download page instead (**Help → Check for updates**).

To ship a new version:

1. Unzip the new website build somewhere, then in this folder run `npm install` (once) and `npm run web -- ../vitalense-web` (the path to the unzipped website folder). This copies it into `www/`. Keep the `VL_LINKS` line in `www/index.html`.
2. Raise `"version"` in `package.json`, for example to `1.2.1`.
3. Commit and push to `main`; the release is published automatically (step 2).

## 7. Try it on your own computer (optional)

Install Node.js 22 (nodejs.org), then in this folder:

- `npm install` once
- `npm start` opens the app straight from these files
- `npm run dist:win` on a Windows PC, or `npm run dist:mac` on a Mac, builds an installer into `dist/`. Run these in your clone of the GitHub repository: the build reads the repository's address to set up updates and stops with "Cannot detect repository" without it.

## Good to know

- Data is stored on the computer only: `%APPDATA%\VitaLense` on Windows, `~/Library/Application Support/VitaLense` on Mac. Uninstalling keeps it. **Settings → Export** makes a backup file.
- The desktop app opens on Home. Shortcuts: Ctrl/⌘ + 1–5 for the five main tabs and Ctrl/⌘ + , for Settings.
- The app never asks for the camera, microphone or location; progress photos are picked from files.
