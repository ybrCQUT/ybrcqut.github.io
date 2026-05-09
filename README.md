# Boran Yang Personal Academic Homepage

This is a static personal academic homepage built from the latest document `杨博然-githubio260323.docx`.

## Files

- `index.html` — homepage
- `publication.html` — publication page inspired by academic group publication pages
- `assets/js/data.js` — all editable profile data, projects, service, activities, honors, and publications
- `assets/css/styles.css` — page styles
- `assets/img/yang-boran-photo.jpg` — portrait extracted from the latest document

## Local Preview

Double click `index.html`, or run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000` in a browser.

## Edit Paper Summary and Links

Open `assets/js/data.js`. For each publication, edit:

```js
"summary": "Write the paper summary here.",
"links": {
  "html": "",
  "pdf": "",
  "code": "",
  "project": "",
  "poster": "",
  "video": ""
}
```

The buttons will automatically become clickable when a URL is filled in. Empty links display `Coming soon`.

## GitHub Pages Deployment

1. Create a GitHub repository, for example `boran-yang.github.io`.
2. Upload all files and folders in this directory.
3. Go to `Settings` → `Pages`.
4. Set source to `Deploy from a branch`, branch `main`, folder `/root`.
5. Wait for GitHub Pages to publish the website.

## Notes

- Best Paper Award wording has been standardized in English in honors and publication annotations.
- No code/project links are fabricated. Add them later in `assets/js/data.js` when the teacher provides actual URLs.
