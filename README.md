# Dobble

A small, static browser game built from the SVG symbols in `dobble_svgs/`.

The game records the time for every correct find in the browser's local storage.
Use **Pause game** to view the current average, fastest and slowest finds, and
the statistics for all symbols, ordered by average finding time. Symbols that
have not been found yet are shown as “No data yet”. Use **Clear saved
statistics** to remove the saved results from that browser.

## Play locally

Open `index.html` in a browser, or serve the folder with any static HTTP server:

```bash
python3 -m http.server
```

Then visit <http://localhost:8000>.

## Publish with GitHub Pages

1. Create a GitHub repository and push this project to its `main` branch.
2. In the repository, open **Settings → Pages**.
3. Under **Build and deployment**, choose **GitHub Actions** as the source.
4. The workflow in `.github/workflows/deploy-pages.yml` will publish the site after each push to `main`.

The generated site URL will be:

```text
https://YOUR-GITHUB-USERNAME.github.io/YOUR-REPOSITORY-NAME/
```
