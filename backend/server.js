// Root-level entrypoint redirect for Hostinger compatibility.
// This allows the app to start correctly even if Hostinger looks for "server.js" at the root directory.
require('./dist/server.js');
