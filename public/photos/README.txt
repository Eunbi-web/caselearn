PHOTO SLOTS — two ways to add pictures.

1) UPLOAD FROM THE SITE (easiest)
   Hover any photo on the site and click "UPLOAD ⤴" (or "CHANGE PHOTO").
   The picture is resized and saved (with Supabase configured it goes to
   the site-photos bucket, otherwise to that browser). The ✕ button
   removes an uploaded photo again.

2) DROP FILES INTO THIS FOLDER (permanent, ships with the site)

Use exactly these file names, .jpg or .png:

  profile-photo.jpg               → portrait polaroid on the Profile page
  profile-art.jpg                 → "art from the scrapbook" polaroid (Profile)
  home-found-paper.jpg            → home polaroid "found paper · 001"
  home-bits-pieces.jpg            → home polaroid "bits & pieces"
  visual-cutout.jpg               → transparent-PNG cut-out on the Visual Journal

  course-english-for-the-arts.jpg → course journal cover (pile + detail page)
  course-creative-design-thinking.jpg
  course-drawing-techniques.jpg
  course-computer-graphics.jpg
  course-visual-communication.jpg

  entry-<code>.jpg                → a journal page's polaroid, e.g. entry-001-01.jpg
                                    (the code is the entry's photo slot shown in
                                    its placeholder)

  artwork-01.jpg ... artwork-06.jpg → the portfolio gallery pages
  journal-<post-id>.jpg            → a visual journal post's polaroid

Any slot without a picture shows a themed placeholder that says which
file to add — the site never looks broken while photos are missing.
