import express from "express";

const app = express();
const PORT = process.env.PORT || 3000;
const TARGET = "https://anikai.to";

const HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  "Referer": `${TARGET}/`,
  "Origin": TARGET,
  "sec-ch-ua": '"Google Chrome";v="131", "Chromium";v="131", "Not_A Brand";v="24"',
  "sec-ch-ua-mobile": "?0",
  "sec-ch-ua-platform": '"Windows"',
  "Cookie": process.env.ANIKAI_COOKIE || "__p_mov=1; usertype=guest; session=vLrU4aKItp0QltI2asH83yugyWDsSSQtyl9sxWKO",
};

// Cache session fetched from anikai.to/home
let cachedCookie = null;
let cacheTime = 0;
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes

async function getSession() {
  if (cachedCookie && Date.now() - cacheTime < CACHE_TTL) return cachedCookie;

  console.log("[proxy] fetching fresh session from anikai.to...");
  try {
    const res = await fetch(`${TARGET}/home`, {
      headers: { ...HEADERS, Accept: "text/html" },
      redirect: "follow",
    });

    const setCookies = res.headers.getSetCookie?.() ?? [];
    const cookies = setCookies.map(c => c.split(";")[0].trim()).filter(Boolean).join("; ");

    if (cookies) {
      cachedCookie = cookies;
      cacheTime = Date.now();
      console.log("[proxy] session refreshed:", cookies.slice(0, 60) + "...");
    } else {
      console.warn("[proxy] no cookies returned from /home, using fallback");
      cachedCookie = HEADERS.Cookie;
      cacheTime = Date.now();
    }
  } catch (err) {
    console.error("[proxy] session fetch failed:", err.message);
    cachedCookie = HEADERS.Cookie;
    cacheTime = Date.now();
  }

  return cachedCookie;
}

// Warm up session on start
getSession();

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "*");
  if (req.method === "OPTIONS") return res.sendStatus(204);
  next();
});

// Health check
app.get("/", (req, res) => res.json({ status: "ok", proxy: "anizen → anikai.to" }));

// Proxy all /anikai/* → anikai.to/*
app.all("/anikai/*", async (req, res) => {
  const path = req.path.replace(/^\/anikai/, "");
  const qs = new URLSearchParams(req.query).toString();
  const url = `${TARGET}${path}${qs ? "?" + qs : ""}`;
  const isAjax = path.includes("/ajax/");

  console.log("[proxy] →", url);

  const cookie = await getSession();

  const headers = {
    ...HEADERS,
    Cookie: cookie,
    Accept: isAjax ? "application/json, */*" : "text/html,*/*",
    ...(isAjax && {
      "X-Requested-With": "XMLHttpRequest",
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
    }),
  };

  try {
    const upstream = await fetch(url, { method: req.method, headers, redirect: "follow" });

    // If AJAX returns HTML, session is stale — refresh and retry once
    if (isAjax && upstream.status === 200) {
      const text = await upstream.text();
      let parsed = null;
      try { parsed = JSON.parse(text); } catch {}

      if (typeof parsed?.result === "string" && parsed.result.trimStart().startsWith("<!DOCTYPE")) {
        console.warn("[proxy] stale session detected, refreshing...");
        cachedCookie = null;
        const fresh = await getSession();
        headers.Cookie = fresh;
        const retry = await fetch(url, { method: req.method, headers, redirect: "follow" });
        res.status(retry.status);
        return res.send(Buffer.from(await retry.arrayBuffer()));
      }

      res.status(upstream.status);
      return res.send(text);
    }

    res.status(upstream.status);
    const ct = upstream.headers.get("content-type");
    if (ct) res.setHeader("Content-Type", ct);
    res.send(Buffer.from(await upstream.arrayBuffer()));

  } catch (err) {
    console.error("[proxy] error:", err.message);
    res.status(502).json({ error: "Proxy failed", detail: err.message });
  }
});

app.listen(PORT, () => console.log(`[proxy] running on port ${PORT}`));
