# Fourexa Tech — website

A static, multi-page production site. No build step required — open
`index.html` directly, or deploy the whole `fourexa/` folder as-is to
any static host (Vercel, Netlify, GitHub Pages, Cloudflare Pages).

## Structure

```
fourexa/
├── index.html            Home
├── solutions.html         /solutions — 4 detailed solution sections
├── how-we-work.html       /how-we-work — Find→Understand→Build→Automate→Grow
├── industries.html        /industries
├── work.html               /work — concept projects with modal detail views
├── about.html              /about — company philosophy (no founder info)
├── contact.html            /contact — discovery form
├── 404.html                 Branded not-found page
├── robots.txt / sitemap.xml
├── assets/
│   ├── site.css            Shared styles for every page
│   ├── site.js              Header/footer render, mobile menu, FAQ, work
│   │                         modal, contact form validation + submission
│   ├── site-config.js       ⭐ Single source of truth: company info,
│   │                         nav, contact details, social links, CTA text
│   ├── work-data.js          Concept project content for the Work modals
│   ├── logo-icon.png         Official logo mark, background removed —
│   │                         used in the navbar and footer
│   ├── logo-transparent.png  Full logo lockup (mark + wordmark), background
│   │                         removed — available for larger placements
│   ├── favicon.ico, apple-touch-icon.png, og-image.png
│   └── logo-source.png       Original attached logo file, unedited
└── api/
    └── contact.js            Reference serverless function for the
                                contact form (see below)
```

## Everything is wired from `assets/site-config.js`

Navigation, footer links, the CTA label, contact email/WhatsApp, and
social URLs are all read from this one file. Every page pulls its
header and footer from it at load time — update it once, and it
updates everywhere.

Currently configured:
- **Email:** fourexatechnologies@gmail.com
- **Instagram:** https://www.instagram.com/fourexa_tech/
- **Facebook:** https://www.facebook.com/profile.php?id=61594402950549
- **LinkedIn:** the URL you sent (`.../company/145200936/admin/dashboard/`)
  is the **admin dashboard** link, which only works when you're logged
  in as the page admin — visitors will hit a login wall. The public
  page is almost certainly `https://www.linkedin.com/company/145200936/`.
  Swap it in `assets/site-config.js` once you confirm the right URL.
- **WhatsApp / phone:** left blank on purpose (no number was provided)
  — the footer and contact page simply omit those until you add one.

## Logo usage

The attached logo file had a black square background. I removed that
background (keeping the mark's colors and gradient untouched) so it
sits cleanly on the site's dark navbar/footer without a visible edge:

- `logo-icon.png` — just the "FX" mark, used in the navbar (paired
  with the "FOUREXA TECH" wordmark in HTML) and footer
- `logo-transparent.png` — the full lockup (mark + "FOUREXA TECH TECH"
  wordmark), available if you want it somewhere larger, like a
  loading screen
- `favicon.ico` / `apple-touch-icon.png` — generated from the same
  mark, on a dark canvas matching the site background
- `og-image.png` — a branded 1200×630 social preview card generated
  from the same mark, used for link previews (WhatsApp, X, etc.)

Nothing was stretched, recolored, or redrawn — only the background
was made transparent and the image was cropped/scaled for each use.

## Contact form — what's real vs. what needs setup

The form on `/contact` does real client-side validation (required
fields, email format, inline error messages) and submits via `fetch`
to `siteConfig.api.contactEndpoint` (`/api/contact` by default). It
shows genuine loading / success / error states — there is no fake
timeout or fake success message anywhere.

**`/api/contact` is not live yet**, because that requires a server,
which a static site doesn't have on its own. `api/contact.js` is a
ready-to-deploy reference implementation (validates and sanitizes
input, rate-limits by IP, sends mail via Resend) written for Vercel's
serverless function format. To make submissions actually arrive by
email:

1. Deploy this project to Vercel (or port `api/contact.js`'s handler
   into your host's equivalent — Netlify Functions, an Express route,
   etc.)
2. Create a free account at resend.com (or swap in SendGrid/SMTP/your
   CRM — the validation and sanitization logic stays the same either
   way)
3. Set these environment variables on your host (see `.env.example`):
   - `RESEND_API_KEY`
   - `EMAIL_FROM` (a verified sending address)
   - `EMAIL_TO` (fourexatechnologies@gmail.com, or wherever inquiries
     should land)

Until those are set, submitting the form will correctly show an error
state rather than a fake success message.

## Navigation, links, and interactions — all functional

- Every navbar/footer link points to a real page (no `#` placeholders)
- Active page is indicated in both desktop nav and the mobile menu
- Mobile menu: hamburger opens a full-screen panel, closes on link
  click, on the close button, on Escape, and locks body scroll while
  open
- Work page cards open an accessible modal (focus is moved in and
  back out, Escape closes it, clicking the overlay closes it) and
  support direct linking, e.g. `work.html#ai-customer-support`
- FAQ items are real accordions with `aria-expanded`/`aria-controls`
- 404 page is branded and links back to Home, Solutions, and Contact
- `prefers-reduced-motion` disables the hero animation and other
  motion sitewide

## Still to decide / confirm

- Confirm the correct public LinkedIn URL (see above)
- Add a WhatsApp number and/or phone number when you have one —
  they'll appear automatically in the footer and contact page once
  added to `site-config.js`
- Deploy `api/contact.js` (or your own equivalent) and set the three
  environment variables so the contact form can actually deliver mail
