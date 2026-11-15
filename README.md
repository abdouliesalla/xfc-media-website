# XFC Media website

A static, dependency-free site: `index.html`, `css/styles.css`, `js/main.js`.
No build step. Fonts load from Fontshare: **Clash Grotesk** (headlines) and **Switzer** (body and interface),
both free for commercial use under the ITF Free Font License.

## Preview locally

```bash
cd "/Users/amoulayesall/Desktop/XFC website" && python3 -m http.server 5173
```

Then open http://localhost:5173.

## Structure of the page

1. Hero: headline, consultation CTA, and a three-panel reel (match day, Eastfield video, private videography video).
2. Client logo marquee (with a pause control).
3. Positioning statement and CTA.
4. Services accordion: social media, paid advertising, content production, brand and design, bilingual marketing.
5. Web development: custom design, front-end and back-end, responsive design, speed, SEO, security, maintenance, redesigns.
6. Industries: Soccer & sports, Healthcare, Dental, Private videography, Other industries.
7. Client work: Eastfield Pediatric Dentistry, match day at Bank of America Stadium, a private videography night shoot, and the dental client roster.
8. How we work (4 steps) and why businesses choose XFC.
9. Team: Johnny Gallego (founder and creative director) and Rodrigo de Castro (graphic designer).
10. Consultation form, then the footer.

## Media

- `assets/video/eastfield-reel.mp4` (720p, ~6 MB) and `eastfield-reel-sm.mp4` (540p, ~3.5 MB, used on phones and in the case study).
  Both are muted, loop, play only while on screen, and have a pause button. Reduced-motion visitors see the poster frame.
- `assets/video/private-reel.mp4` (480p, ~4 MB) is the private videography example.
- `assets/img/web/` holds the web-sized photos.
- `assets/img/past work/` holds the original files (including the 158 MB source video).
  **Do not upload this folder when you deploy**; the site doesn't use it.

To add a new case study, copy one `<article class="case">` block in `index.html` and swap the media and text.

## Consultation form

Submissions go to **Formspree** (`https://formspree.io/f/xrpqpkqw`, set as the form's `action` in `index.html`),
so the form works on any host, including GitHub Pages.

- The script in `js/main.js` sends the fields as JSON with a subject like
  "Consultation request from Jane Doe (Smile Co)", and selected services joined into one line.
- `_gotcha` is Formspree's spam trap; real visitors never see it.
- If Formspree rejects a request or can't be reached, visitors see an error with a link to email info@xfcmedia.com,
  and what they typed stays in the form.
- With JavaScript off, the form still posts straight to Formspree.

To change where submissions go, update the form's `action` URL.

## Design tokens

Black `#000`, white `#FFF`, fog `#EDEEF0`, crown blue `#4DA3F2` (text-safe `#1767B8`), gray `#5F636B`.
Defined at the top of `css/styles.css`.
