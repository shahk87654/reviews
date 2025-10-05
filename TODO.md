# TODO: Fix MongoDB Authorization Error for Stations

## Current Issue
- MongoDB error: "not authorized on admin to execute command { find: "stations" }"
- This indicates the connection is defaulting to "admin" database instead of the intended database

## Steps to Complete

### 1. Update MongoDB Connection Code
- [x] Add debug logging to server/utils/mongodb.js to show the URI and database name being used
- [x] Ensure MONGO_DBNAME environment variable is properly handled
- [x] Verify mongoose connection uses the correct database

### 2. Environment Variables Check
- [x] Confirm MONGO_URI includes proper credentials and database name
- [x] Ensure MONGO_DBNAME is set to the correct database name (not "admin")
- [x] Check Render environment variables match local .env

### 3. Test Connection
- [x] Test MongoDB connection locally with correct environment variables
- [x] Verify stations can be fetched without authorization errors

### 4. Deploy and Verify
- [ ] Deploy updated code to Render
- [ ] Test the stations endpoint on production
- [ ] Confirm error is resolved
