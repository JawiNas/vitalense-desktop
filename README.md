# VitaLense for Windows and Mac

This folder turns the VitaLense website into installable apps for Windows and Mac. GitHub builds the installers for you, so you don't need a Mac or a Windows PC to make them.

After the steps below, the **Get the app** page in VitaLense links straight to:

- `VitaLense-Setup.exe` for Windows 10 and 11 (64-bit)
- `VitaLense.dmg` for Mac (one file for Apple Silicon and Intel Macs)

| File or folder | What it is |
| --- | --- |
| `www/` | The VitaLense app itself (the same files as the website) |
| `main.js` | The desktop window: remembers its size, opens outside links in the normal browser, installs updates |
| `package.json` | App name, version and installer settings |
| `build/icon.png` | The app icon (1024 × 1024) |
| `.github/workflows/desktop-release.yml` | The GitHub job that builds and publishes the installers |
| `scripts/copy-web.mjs` | Copies a new website build into `www/` |

## 1. Put this folder on GitHub (once)

1. On github.com create a new repository, for example `vitalense-desktop`. Make it **Public**. Visitors download the installers from this repository's releases, and files in a private repository's releases need a GitHub sign-in.
2. Upload everything in this folder, including the hidden `.github` folder.
   - **Git** (in a terminal, inside this folder):
     ```
     git init -b main
     git add .
     git commit -m "VitaLense desktop 1.2.0"
     git remote add origin https://github.com/JawiNas/vitalense-desktop.git
     git push -u origin main
     ```
   - **GitHub Desktop:** File → Add local repository → choose this folder → Publish repository, and untick "Keep this code private".
   - **Upload in the browser:** dragging files in can leave out the hidden `.github` folder. If the Actions tab shows no "Desktop release" workflow afterwards, choose **Add file → Create new file**, type `.github/workflows/desktop-release.yml` as the name, paste in that file's contents and commit.
3. Open the repository's **Actions** tab. If GitHub asks, allow workflows to run.

## 2. Publish a release

1. Check that `"version"` in `package.json` is the version you want to publish (`1.2.0` now).
2. Create a tag with the same number and a `v` in front:
   - **Git:** `git tag v1.2.0` then `git push origin v1.2.0`
   - **Browser:** **Releases → Draft a new release → Choose a tag**, type `v1.2.0`, choose **Create new tag**, then **Publish release**.
3. The **Actions** tab shows "Desktop release" running. It takes about 10–20 minutes.
4. When it's green, the release has `VitaLense-Setup.exe`, `VitaLense.dmg` and the update files. These links now work, and keep working for every later version:
   - `https://github.com/JawiNas/vitalense-desktop/releases/latest/download/VitaLense-Setup.exe`
   - `https://github.com/JawiNas/vitalense-desktop/releases/latest/download/VitaLense.dmg`

To test a build without publishing anything, open **Actions → Desktop release → Run workflow**. The installers appear at the bottom of that run's page under **Artifacts**.

## 3. Turn on the download buttons in the website

In the website's `index.html`, near the top, find `window.VL_LINKS` and fill in what you have:

```js
window.VL_LINKS = {
  github: 'JawiNas/vitalense-desktop',                                  // Windows and Mac links come from this
  android: 'https://play.google.com/store/apps/details?id=YOUR.APP.ID',   // when the Play Store listing is live
  ios: 'https://apps.apple.com/app/idYOUR-APP-NUMBER',                     // when the App Store listing is live
  windows: '', mac: '', androidApk: '', web: ''
};
```

Commit the change and Vercel redeploys the site. Until a link is filled in, Windows and Mac offer installing from the browser instead, and Android and iPhone show "Coming soon" with the Add to Home Screen steps.

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

1. Unzip the new website build somewhere, then in this folder run `npm install` (once) and `npm run web -- ../vitalense-web` (the path to the unzipped website folder). This copies it into `www/`.
2. Raise `"version"` in `package.json`, for example to `1.2.1`.
3. Commit, push, and tag `v1.2.1` as in step 2.

## 7. Try it on your own computer (optional)

Install Node.js 22 (nodejs.org), then in this folder:

- `npm install` once
- `npm start` opens the app straight from these files
- `npm run dist:win` on a Windows PC, or `npm run dist:mac` on a Mac, builds an installer into `dist/`. Run these in your clone of the GitHub repository: the build reads the repository's address to set up updates and stops with "Cannot detect repository" without it.

## Good to know

- Data is stored on the computer only: `%APPDATA%\VitaLense` on Windows, `~/Library/Application Support/VitaLense` on Mac. Uninstalling keeps it. **Settings → Export** makes a backup file.
- The desktop app opens on Home. Shortcuts: Ctrl/⌘ + 1–5 for the five main tabs and Ctrl/⌘ + , for Settings.
- The app never asks for the camera, microphone or location; progress photos are picked from files.
