# Chaitanya Dussa Portfolio

A responsive personal portfolio website for Chaitanya Dussa, built as a static single-page site with HTML, CSS, and vanilla JavaScript. It showcases education, skills, GitHub activity, projects, certifications, YouTube videos, contact details, and a scripted chat assistant.

## Live Links


- GitHub: https://github.com/ChaitanyaDussa
- LinkedIn: https://www.linkedin.com/in/chaitanya-dussa-fullstackdevelopment/
- LeetCode: https://leetcode.com/u/ChaitanyaDussa/

## Features

- Responsive portfolio layout with animated hero, avatar, terminal typing effect, and scroll reveals.
- Sections for education, skills, GitHub activity, projects, certifications, videos, and contact.
- Project category filters for Web Apps, Automation, AI Projects, and n8n Workflows.
- GitHub contribution chart and GitHub stats cards powered by public image APIs.
- Admin modal for adding/removing projects, skills, certifications, and videos in browser localStorage.
- JSON export buttons for admin-managed content.
- Contact form integration using Web3Forms.
- Scripted FAQ chatbot with optional browser speech synthesis.
- Resume links from the navbar and hero section.

## Tech Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Google Fonts: Inter, Space Grotesk, JetBrains Mono
- Web3Forms for contact form delivery
- Browser localStorage for admin-managed custom content

## Project Structure

```text
.
+-- avatar.png
+-- index.html
`-- README.md
```

## Getting Started

No build step or package installation is required.

1. Clone or download the repository.
2. Open `index.html` directly in a browser.

You can also serve it locally:

```bash
python -m http.server 8080
```

Then visit:

```text
http://localhost:8080
```

## Customization

Most content lives inside `index.html`.

- Update profile links in the navigation, contact section, and footer.
- Replace `avatar.png` with a new profile image if needed.
- Edit the default project, skill, certification, and video arrays in the content manager script.
- Add a `Chaitanya_Dussa_Resume.pdf` file in the project root if you want the resume buttons to work.

## Admin Panel

The site includes a client-side admin modal for quick content updates. It can manage:

- Projects
- Skills
- Certifications
- YouTube videos

Admin changes are stored in the visitor's browser using localStorage, so they are not permanent code changes and will not sync across devices. Use the export buttons to copy updated JSON and then manually add it back into `index.html` if you want those changes to become part of the site.

The current admin passcode is defined in `index.html`:


This is only a casual client-side gate because the passcode is visible in the page source. Do not treat it as secure authentication.

## Contact Form Setup

The contact form is wired for Web3Forms, but the access key is still a placeholder:

```html
<input type="hidden" name="access_key" value="YOUR_WEB3FORMS_ACCESS_KEY">
```

To enable the form:

1. Create a Web3Forms access key.
2. Replace `YOUR_WEB3FORMS_ACCESS_KEY` in `index.html`.
3. Deploy the updated file.

Until the key is replaced, the form shows a friendly setup message and users can still use the direct email links.

## Featured Projects

- StudyNest - Smart Study Collaboration Platform
- Chat Application
- Green Insight - Tree Track

## Deployment

Because this is a static site, it can be deployed to:

- GitHub Pages
- Netlify
- Vercel
- Cloudflare Pages
- Any static hosting provider

Set the publish/root directory to the repository root and use `index.html` as the entry page.

## Author

Chaitanya Dussa  
Full-stack developer from Andhra Pradesh, India.
