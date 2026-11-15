const crypto = require("node:crypto");
const fs = require("node:fs/promises");
const http = require("node:http");
const path = require("node:path");

const root = __dirname;
const port = Number(process.env.PORT || 3000);
const configuredUsername = process.env.HARM_ADMIN_USERNAME;
const configuredPassword = process.env.HARM_ADMIN_PASSWORD;
const sessionLifetimeMs = 8 * 60 * 60 * 1000;
const maxLoginAttempts = 10;
const loginWindowMs = 15 * 60 * 1000;
const sessions = new Map();
const loginAttempts = new Map();
const allowedFiles = new Map([
  ["/index.html", ["index.html", "text/html; charset=utf-8"]],
  ["/styles.css", ["styles.css", "text/css; charset=utf-8"]],
  ["/app.js", ["app.js", "text/javascript; charset=utf-8"]],
  ["/admin-login.html", ["admin-login.html", "text/html; charset=utf-8"]],
  ["/admin-login.js", ["admin-login.js", "text/javascript; charset=utf-8"]],
  ["/admin.html", ["admin.html", "text/html; charset=utf-8"]],
  ["/harm-mark.svg", ["harm-mark.svg", "image/svg+xml"]],
  ["/hero-illustration.svg", ["hero-illustration.svg", "image/svg+xml"]],
  ["/hero-dairy.svg", ["hero-dairy.svg", "image/svg+xml"]],
  ["/family-welcome.jpeg", ["family-welcome.jpeg", "image/jpeg"]],
  ["/product-images/notebook.svg", ["product-images/notebook.svg", "image/svg+xml"]],
  ["/product-images/blue-pens.svg", ["product-images/blue-pens.svg", "image/svg+xml"]],
  ["/product-images/hb-pencils.svg", ["product-images/hb-pencils.svg", "image/svg+xml"]],
  ["/product-images/colour-pencils.svg", ["product-images/colour-pencils.svg", "image/svg+xml"]],
  ["/product-images/a4-paper.svg", ["product-images/a4-paper.svg", "image/svg+xml"]],
  ["/product-images/envelope.svg", ["product-images/envelope.svg", "image/svg+xml"]],
  ["/product-images/milk.svg", ["product-images/milk.svg", "image/svg+xml"]],
  ["/product-images/curd.svg", ["product-images/curd.svg", "image/svg+xml"]],
  ["/product-images/butter.svg", ["product-images/butter.svg", "image/svg+xml"]],
  ["/product-images/paneer.svg", ["product-images/paneer.svg", "image/svg+xml"]],
  ["/product-images/cool-drinks.svg", ["product-images/cool-drinks.svg", "image/svg+xml"]],
  ["/product-images/ice-cream.svg", ["product-images/ice-cream.svg", "image/svg+xml"]]
]);

if (!configuredUsername || !configuredPassword) {
  console.error("Set HARM_ADMIN_USERNAME and HARM_ADMIN_PASSWORD before starting the server.");
  process.exit(1);
}
if (!Number.isInteger(port) || port < 1 || port > 65535) {
  console.error("PORT must be a valid TCP port between 1 and 65535.");
  process.exit(1);
}

function sendJson(response, status, payload, headers = {}) {
  response.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin",
    ...headers
  });
  response.end(JSON.stringify(payload));
}

function redirect(response, location, headers = {}) {
  response.writeHead(303, {
    Location: location,
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers
  });
  response.end();
}

function getSession(request) {
  const cookie = request.headers.cookie || "";
  const token = cookie.split(";").map((part) => part.trim())
    .find((part) => part.startsWith("harm_admin_session="))
    ?.slice("harm_admin_session=".length);
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;

  const expiresAt = sessions.get(token);
  if (!expiresAt || expiresAt <= Date.now()) {
    sessions.delete(token);
    return null;
  }
  return token;
}

function secureCookie() {
  return process.env.NODE_ENV === "production" ? "; Secure" : "";
}

async function readForm(request) {
  if (!request.headers["content-type"]?.startsWith("application/x-www-form-urlencoded")) {
    const error = new Error("Expected form-encoded login details.");
    error.statusCode = 415;
    throw error;
  }

  const chunks = [];
  let length = 0;
  for await (const chunk of request) {
    length += chunk.length;
    if (length > 4096) {
      const error = new Error("Login request is too large.");
      error.statusCode = 413;
      throw error;
    }
    chunks.push(chunk);
  }
  return new URLSearchParams(Buffer.concat(chunks).toString("utf8"));
}

function getLoginAttemptState(address) {
  const now = Date.now();
  const state = loginAttempts.get(address);
  if (!state || state.windowStartedAt + loginWindowMs <= now) {
    const freshState = { count: 0, windowStartedAt: now };
    loginAttempts.set(address, freshState);
    return freshState;
  }
  return state;
}

function credentialsMatch(username, password) {
  const expectedUsername = Buffer.from(configuredUsername);
  const providedUsername = Buffer.from(username);
  const expectedPassword = Buffer.from(configuredPassword);
  const providedPassword = Buffer.from(password);
  const usernameMatches = expectedUsername.length === providedUsername.length
    && crypto.timingSafeEqual(expectedUsername, providedUsername);
  const passwordMatches = expectedPassword.length === providedPassword.length
    && crypto.timingSafeEqual(expectedPassword, providedPassword);
  return usernameMatches && passwordMatches;
}

async function serveFile(response, fileName, contentType, options = {}) {
  const content = await fs.readFile(path.join(root, fileName));
  response.writeHead(200, {
    "Content-Type": contentType,
    "Cache-Control": options.noStore ? "no-store" : "public, max-age=300",
    "X-Content-Type-Options": "nosniff",
    "X-Frame-Options": "DENY",
    "Referrer-Policy": "same-origin"
  });
  response.end(content);
}

async function handleRequest(request, response) {
  const url = new URL(request.url, "http://localhost");
  const pathname = url.pathname;
  const session = getSession(request);

  if (request.method === "GET" && pathname === "/") {
    await serveFile(response, "index.html", "text/html; charset=utf-8");
    return;
  }
  if (request.method === "GET" && pathname === "/admin-login") {
    if (session) return redirect(response, "/admin");
    await serveFile(response, "admin-login.html", "text/html; charset=utf-8", { noStore: true });
    return;
  }
  if (request.method === "GET" && pathname === "/admin-login.html") {
    if (session) return redirect(response, "/admin");
    await serveFile(response, "admin-login.html", "text/html; charset=utf-8", { noStore: true });
    return;
  }
  if (request.method === "GET" && (pathname === "/admin" || pathname === "/admin.html")) {
    if (!session) return redirect(response, "/admin-login");
    await serveFile(response, "admin.html", "text/html; charset=utf-8", { noStore: true });
    return;
  }
  if (request.method === "POST" && pathname === "/api/login") {
    const address = request.socket.remoteAddress || "unknown";
    const attempts = getLoginAttemptState(address);
    if (attempts.count >= maxLoginAttempts) {
      return sendJson(response, 429, { message: "Too many sign-in attempts. Please wait 15 minutes and try again." }, {
        "Retry-After": String(Math.ceil((attempts.windowStartedAt + loginWindowMs - Date.now()) / 1000))
      });
    }

    const form = await readForm(request);
    const username = form.get("username") || "";
    const password = form.get("password") || "";
    if (!credentialsMatch(username, password)) {
      attempts.count += 1;
      return sendJson(response, 401, { message: "Invalid login details. Please try again." });
    }

    loginAttempts.delete(address);
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now() + sessionLifetimeMs);
    return sendJson(response, 200, { redirect: "/admin" }, {
      "Set-Cookie": `harm_admin_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${sessionLifetimeMs / 1000}${secureCookie()}`
    });
  }
  if (request.method === "POST" && pathname === "/api/logout") {
    if (session) sessions.delete(session);
    return redirect(response, "/", {
      "Set-Cookie": `harm_admin_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0${secureCookie()}`
    });
  }
  if (request.method === "GET" && pathname === "/api/session") {
    return sendJson(response, 200, { authenticated: Boolean(session) });
  }
  if (request.method === "GET" && allowedFiles.has(pathname)) {
    const [fileName, contentType] = allowedFiles.get(pathname);
    await serveFile(response, fileName, contentType);
    return;
  }
  if (pathname.startsWith("/api/")) {
    return sendJson(response, 404, { message: "Not found." });
  }
  response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8", "X-Content-Type-Options": "nosniff" });
  response.end("Not found");
}

const server = http.createServer((request, response) => {
  handleRequest(request, response).catch((error) => {
    console.error("Request failed:", error);
    if (response.headersSent) {
      response.destroy(error);
      return;
    }
    sendJson(response, error.statusCode || 500, {
      message: error.statusCode ? error.message : "The request could not be completed."
    });
  });
});

server.listen(port, "0.0.0.0", () => {
  console.log(`H.A.R.M Daily Needs is listening on port ${port}.`);
});

setInterval(() => {
  const now = Date.now();
  for (const [token, expiresAt] of sessions) {
    if (expiresAt <= now) sessions.delete(token);
  }
  for (const [address, state] of loginAttempts) {
    if (state.windowStartedAt + loginWindowMs <= now) loginAttempts.delete(address);
  }
}, 60 * 1000).unref();
