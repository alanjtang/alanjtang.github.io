# Alan Tang — The Atlas

Complete standalone export of the published Atlas website, including the red/blue neon trade-route animation. Exported October 10, 2026 from source commit `6fae92736c473db7610543f0b5869b1c4dbcc78f`.

## Upload to GitHub

1. Extract `Atlas-GitHub-Ready.zip` on your computer.
2. Create a new empty repository on GitHub.
3. Choose **uploading an existing file** (or **Add file → Upload files** in an existing repository).
4. Drag the extracted files and folders into the upload area, including the whole `dist` folder. Upload the contents, not the ZIP itself. Keep `README.md`, `vercel.json`, `netlify.toml` and `dist/` at the repository root.
5. Commit the files. Your complete website source is now in GitHub.

If your file picker hides `.gitignore` or `.openai`, enable hidden files or add them separately. `.openai/hosting.json` is archival configuration only and is not needed for independent hosting.

For Git instead of browser upload, run these commands inside the extracted folder, replacing YOUR-USERNAME and YOUR-REPOSITORY:

```sh
git init
git add .
git commit -m "Add Atlas website"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
git push -u origin main
```

Use a new empty repository for these commands. Uploading source to GitHub does not automatically publish a website. Connect the repository to Vercel, Netlify or Cloudflare Pages using the instructions below and publish `dist`.

## Quick start

Install Python 3, extract this ZIP, and open a terminal in this folder:

```sh
python3 -m http.server 8000 --bind 127.0.0.1 --directory dist
```

On Windows, use `py -m http.server 8000 --bind 127.0.0.1 --directory dist` if `python3` is unavailable. Visit http://localhost:8000/ and stop the server with Ctrl+C.

Use an HTTP server, not a double-clicked `file://` page: the globe fetches local JSON geography and route data. There is no package installation, compilation, framework, TypeScript source, API key, backend, or database required. The authored HTML, CSS and JavaScript are already the deployable files in `dist/`.

## Contents

- `dist/index.html`: home page and loading screen.
- `dist/style.css`: styling, responsive layouts and CSS animations.
- `dist/globe.js`: interactive globe, geographic rendering, emblems, layers and animated neon trade routes.
- `dist/globe-relations.js`: country details, relationship picker and layer controls.
- `dist/scroll-design.js`: scroll effects, loading behavior and supporting interactions.
- `dist/d3.min.js`: bundled D3 library; no CDN needed at runtime.
- `dist/*.json`: geography, country profiles, occupation layer and maritime route data.
- `dist/publications/`: publication index, both complete articles and original Hague article PDF.
- `dist/about/`, `dist/atlas-sources/`: supporting pages.
- `dist/`: all images, SVG emblems, flags, resume PDF, credits, data notes and license files.
- `build-relationships.py`, `country-profiles.json`, `dist/derive_shipping.py`: original data-generation tools and inputs retained from the project.
- `.openai/hosting.json`: original hosting configuration, preserved for reference. Independent hosts do not use it. Do not use it to deploy back to the existing ChatGPT Site.
- `vercel.json`, `netlify.toml`: added independent hosting settings.
- `SOURCE-MANIFEST.json`: original tracked-file SHA-256 checksums and source revision. Export-only README/configuration files are not in that original-source list.

All original tracked project files are included byte-for-byte. Git history, local credentials and temporary development files are excluded. The export does not alter the live site.

## Deploy independently

Deploy `dist/` as the root of a **new** website. The pages use root-relative URLs such as `/publications/`, so use a domain/subdomain root rather than a nested path. Keep directory structure intact. No SPA fallback or wildcard rewrite is needed: nested pages already contain `index.html`.

### Vercel

1. Put this extracted folder in a new Git repository and import it into a new Vercel project.
2. Select Framework Preset **Other**; use the repository root as Root Directory.
3. Leave the Build Command empty (enable the override if required); set Output Directory to `dist`. The included `vercel.json` supplies the output directory.
4. Deploy. Open the generated URL and check the home, About and Publications pages.

Documentation: https://vercel.com/docs/builds/configure-a-build

### Netlify

For a manual deployment, use Netlify's drag-and-drop deployment and upload the **dist folder**, not the entire project folder.

For Git deployment, import a new repository, leave Build Command empty and set Publish Directory to `dist`. The included `netlify.toml` provides this setting. Deploy as a new project.

Documentation: https://docs.netlify.com/build/configure-builds/overview/
https://docs.netlify.com/manage/projects/add-new-project/

### Cloudflare Pages

Create a new Pages project and connect the repository. Select no framework, set Build Command to `exit 0`, and Build Output Directory to `dist`. Deploy.

Alternatively, create a new Pages Direct Upload project and upload the contents of `dist` with `index.html` at the upload root. Do not upload the outer project ZIP as the web root.

Documentation: https://developers.cloudflare.com/pages/framework-guides/deploy-anything/
https://developers.cloudflare.com/pages/get-started/direct-upload/

Independent hosting does not inherit the ChatGPT Site's visitor access controls. Configure access separately on your chosen host if you want a private copy. Deploying to a new project does not replace or update the existing Atlas URL.

## Editing and data maintenance

Edit the files in `dist/` directly and refresh the local server. Keep article titles, decks, authors and dates synchronized between article pages and the publications index. Use the existing CSS classes to preserve the design. Pause stops globe/route motion; reduced-motion preferences are respected. The Shipping control toggles trade routes.

The data-generation scripts are optional: the completed JSON output is included, so running or deploying the site needs no regeneration. `build-relationships.py` can retrieve world-atlas geometry or take its path as the first argument. `dist/derive_shipping.py` requires a separate `marnet.gpkg` input beside that script; this upstream source dataset was not stored in the original project. Its pinned download URL and methodology are in `dist/shipping-routes-notes.txt`. Do not regenerate data just to run this export.

External profile, email, citation and attribution links remain external. All runtime scripts, map datasets and visual assets referenced by the site are included locally. Device font availability can affect typography just as on the original website.

## Credits and verification

Retain the website's image credits, emblem-source files, geographic source notes and `dist/shipping-network-LICENSE.txt`. Bundled D3 retains its copyright banner. This export does not grant new rights to third-party assets.

The export was checked for exact original-file hashes, ZIP integrity and local HTML/CSS/JavaScript asset references. Browser visual QA and actual deployments on third-party hosts were not performed.
