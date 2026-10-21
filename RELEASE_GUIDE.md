# Releasing a new version

You need Node.js, and the GitHub CLI logged in (`gh auth status`).

1. Commit and push your changes.
2. Set the new version in `package.json` (`"version": "1.0.1"`), then run `npm install --package-lock-only`.
3. Make the zip (builds the game first):
   ```
   powershell -ExecutionPolicy Bypass -File scripts/release/package.ps1
   ```
   This makes `SpellcasterAcademy-v1.0.1.zip` in the repo folder (about 400 MB).
4. Commit and push the version change, then publish the release:
   ```
   gh release create v1.0.1 SpellcasterAcademy-v1.0.1.zip --title "v1.0.1" --notes "What changed"
   ```
5. Delete the zip from the repo folder (it must not be committed).

## What players do

Unzip, double-click `Play.cmd`. It serves the game at http://localhost:8737/ and opens it in the
browser (Edge or Chrome). Close the black window to stop it. The browser cannot open the game's
3D models straight from the files, which is why the launcher is needed.
