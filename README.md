# Portfolio Template — Eleventy + Decap CMS

A static portfolio site built with [Eleventy (11ty)](https://www.11ty.dev/) and managed via [Decap CMS](https://decapcms.org/). Content is written in Markdown, styled with SCSS, and templated with Nunjucks.

---

## Tech Stack

| Layer | Tool |
|---|---|
| Static Site Generator | [Eleventy v3](https://www.11ty.dev/) |
| CMS | [Decap CMS v3](https://decapcms.org/) |
| Templating | [Nunjucks](https://mozilla.github.io/nunjucks/) |
| Styles | SCSS (compiled by [sass](https://sass-lang.com/)) |
| Content | Markdown + YAML front matter |
| Global Data | YAML (`_data/site.yml`) |
| Image Optimisation | `cwebp` (WebP conversion triggered on build) |

---

## Project Structure

```
.
├── _data/
│   └── site.yml              # Global site data: title and nav links
├── _includes/
│   ├── _layouts/
│   │   └── header.njk             # Base HTML shell with <head> and nav
│   ├── _pages/
│   │   ├── index.njk         # Landing page template
│   │   ├── about.njk         # About page template
│   │   ├── contact.njk       # Contact page template
│   │   └── project_page.njk  # Individual project page template
│   └── _partials/
│       ├── projects_index.njk    # Loops over all projects and renders cards
│       ├── project_card.njk      # Single project card component
│       └── pagination.njk        # Pagination helper
├── admin/
│   ├── config.yml            # Decap CMS collection definitions
│   ├── index.html            # CMS entry point (served at /admin)
│   └── index.js              # Custom CMS editor component (image with class)
├── build_scripts/
│   └── compress-images.sh    # Converts JPG/PNG uploads to WebP via cwebp
├── content/
│   ├── landing/landing.md    # Landing page content
│   ├── about/about.md        # About page content
│   ├── contact/contact.md    # Contact page content
│   ├── projects/             # One .md file per project
│   └── uploads/              # Raw uploaded images (gitignored: _processed/)
├── styles/
│   ├── application.scss      # Global styles and CSS variables
│   ├── _header.scss
│   ├── _index.scss
│   ├── _project_card.scss
│   ├── _project_page.scss
│   ├── _projects_index.scss
│   ├── _projects.scss
│   ├── _about.scss
│   └── _contact.scss
├── build.sh                  # Production build script
└── eleventy.config.js        # Eleventy configuration
```

---

## Prerequisites

- **Node.js** ≥ 18
- **npm**
- **cwebp** — for image compression during production builds
  - macOS: `brew install webp`
  - Ubuntu/Debian: `sudo apt install webp`

---

## Dev Environment Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd eleventy-decap-template

# 2. Install dependencies
npm install
```

---

## Running the Dev Server

Eleventy compiles SCSS on the fly and serves the site with live reload at `http://localhost:8080`. It is also accessible from other devices on your local network (useful for mobile testing).

```bash
npx @11ty/eleventy --serve
```

---

## Running the CMS Locally

Decap CMS in this project is configured with `local_backend: true`, which means it can run against your local filesystem without needing a live Git hosting backend.

You need **two terminals** running simultaneously:

**Terminal 1 — Decap local proxy server:**
```bash
npx decap-server
```
This starts a proxy on `http://localhost:8081` that Decap CMS uses to read/write files locally.

**Terminal 2 — Eleventy dev server:**
```bash
npx @11ty/eleventy --serve
```

Then open `http://localhost:8080/admin` in your browser to access the CMS editor.

> **Note:** The local backend bypasses authentication. In production, authentication is handled by Netlify Identity via the `git-gateway` backend defined in `admin/config.yml`.

---

## Content Management

All editable content lives in `content/` as Markdown files with YAML front matter. You can edit these directly or through the CMS at `/admin`.

### Global Site Settings (`_data/site.yml`)
Controls the site title, navigation links. These are available in all templates as `{{ site.* }}`.

### Pages
| Page | Source File | Permalink |
|---|---|---|
| Landing / Portfolio | `content/landing/landing.md` | `/` |
| About | `content/about/about.md` | `/about/` |
| Contact | `content/contact/contact.md` | `/contact/` |

### Projects
Each project is a single Markdown file in `content/projects/`. File names follow the slug pattern `YYYY-MM-<slug>.md`. Projects are tagged `project` and collected by Eleventy into `collections.project`, which the landing page loops over to render project cards.

**Project front matter fields:**

```yaml
layout: _pages/project_page.njk
title: "Project Title"
subtitle: "Short subtitle"
info: "Medium / Discipline"
year: 2024
date: 2024-06-01
thumbnail: /uploads/my-image.jpg
imageAlt: "Description for screen readers"
highlight: false
```

### Images
Upload images to `content/uploads/`. During a production build, they are converted to WebP and placed in `content/uploads/_processed/`. Eleventy then copies the processed images to `_site/uploads/`, overwriting the originals so the live site always serves WebP. The `_processed/` folder is gitignored.

The `toWebp` filter automatically rewrites image paths in templates and Markdown to `.webp`.

#### Custom image sizes in Markdown body
A custom Decap editor component lets you insert sized images in project body content:

```markdown
![Alt text](/uploads/photo.jpg "Optional caption"){.medium}
```

Supported size classes: `small`, `medium`, `large`, `extra-large`.

---

## Production Build

The `build.sh` script handles the full production pipeline:

```bash
bash build.sh
```

It runs the following steps in order:

1. Creates `content/uploads/_processed/` if it does not exist
2. Deletes any stale `.webp` files from `_processed/`
3. Runs `compress-images.sh` — converts all JPG/PNG files in `content/uploads/` to WebP using `cwebp`
4. Runs `npx @11ty/eleventy` to build the static site into `_site/`

The built site is output to `_site/` and ready to deploy.

---

## Deployment (Netlify)

The project is designed for deployment on [Netlify](https://www.netlify.com/).

### Recommended Netlify settings
| Setting | Value |
|---|---|
| Build command | `bash build.sh` |
| Publish directory | `_site` |

### CMS Authentication (Netlify Identity + Git Gateway)
The production CMS backend uses Netlify's **Git Gateway** to authenticate editors and commit changes directly to the repository.

1. Enable **Netlify Identity** in your site's Netlify dashboard (Identity tab → Enable Identity)
2. Enable **Git Gateway** (Identity tab → Services → Enable Git Gateway)
3. Invite yourself as an editor via the Identity tab
4. The `/admin` route on the deployed site will prompt for login automatically

> The `local_backend: true` line in `admin/config.yml` enables the local proxy during development. This setting is ignored in production.

---

## Styles

SCSS files in `styles/` are compiled by Eleventy at build time (no separate `sass` watch command needed). Each page pulls in only the stylesheets it needs via front matter:

```yaml
css:
  - /styles/application.css
  - /styles/_project_card.css
```

Global CSS variables (colours, spacing, page width) are defined at the top of `application.scss`.
