# Security Enhancements and Deployment

## Tasks
- [x] Add rate limiting to auth routes (login/register) to prevent brute force attacks
- [x] Remove development admin token logic from auth.js and admin.js middleware for production security
- [x] Update render.yaml to use environment variable for JWT_SECRET instead of hardcoded value
- [x] Verify QR code scanning functionality (ensure libraries and code are correct)
- [x] Commit and push all changes to GitHub
- [x] Fix API proxy issue for deployment: Modify api.js to use '/api' as baseURL to enable _redirects proxy on Netlify
