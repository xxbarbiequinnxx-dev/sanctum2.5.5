UPLOAD THIS ZIP TO VERCEL — do not commit this zip to GitHub.

1. Vercel → Add New… → Project
2. Choose "Upload" / "Deploy from a zip" (not Git) if you use this file.
   If you use Git: unzip first so package.json is on the repo root.
3. Framework: Other
4. Output Directory: leave EMPTY
5. Node.js: 22.x
6. After import, set Production env vars:
   DATABASE_URL
   BETTER_AUTH_URL=https://sanctum.boutique
   BETTER_AUTH_SECRET
   GOOGLE_CLIENT_ID
   GOOGLE_CLIENT_SECRET
   VITE_AUTH_ENABLED=true
7. Assign domain sanctum.boutique to THIS project.
