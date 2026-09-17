/**
 * Fourexa Tech — central site configuration.
 * Update contact details, social links, and the API endpoint here —
 * every page reads from this single object.
 *
 * Anything left as an empty string is treated as "not configured yet"
 * and its corresponding UI (link/icon) will not render, rather than
 * showing a fake or dead link.
 */
window.siteConfig = {
  company: {
    name: "Fourexa Tech",
    tagline: "Build. Grow. Automate.",
    description:
      "Fourexa Tech builds practical digital solutions for businesses — from high-performance websites and custom systems to AI automation and digital growth.",
  },

  // Fill these in when real channels exist. Leave "" to hide.
  contact: {
    email: "fourexatechnologies@gmail.com",
    whatsapp: "", // e.g. "+91XXXXXXXXXX" — shown only when set
    phone: "",
  },

  social: {
    linkedin: "https://www.linkedin.com/company/145200936/admin/dashboard/",
    instagram: "https://www.instagram.com/fourexa_tech/",
    facebook: "https://www.facebook.com/profile.php?id=61594402950549",
  },

  // Contact form submission endpoint. Using Web3Forms — no backend
  // to deploy. The access key itself lives in a hidden field inside
  // contact.html (name="access_key"), not here, since Web3Forms
  // expects it submitted as part of the form data.
  api: {
    contactEndpoint: "https://api.web3forms.com/submit",
  },

  nav: [
    { label: "Solutions", href: "solutions.html" },
    { label: "How We Work", href: "how-we-work.html" },
    { label: "Industries", href: "industries.html" },
    { label: "Work", href: "work.html" },
    { label: "About", href: "about.html" },
  ],

  footerNav: [
    { label: "Solutions", href: "solutions.html" },
    { label: "How We Work", href: "how-we-work.html" },
    { label: "Industries", href: "industries.html" },
    { label: "Work", href: "work.html" },
    { label: "About", href: "about.html" },
    { label: "Contact", href: "contact.html" },
  ],

  ctaLabel: "Start a Conversation",
};
