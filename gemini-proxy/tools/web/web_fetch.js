module.exports = {
  declaration: {
    name: "web_fetch",
    description: "Fetches text, JSON, or HTML content from a given web URL (HTTP or HTTPS). Follows redirects and handles web pages.",
    parameters: {
      type: "OBJECT",
      properties: {
        url: {
          type: "STRING",
          description: "Target URL to fetch."
        },
        max_length: {
          type: "INTEGER",
          description: "Maximum characters to return (default: 5000)."
        }
      },
      required: ["url"]
    }
  },

  async execute(args) {
    const rawUrl = args?.url;
    if (!rawUrl || typeof rawUrl !== "string") {
      return { success: false, error: "Missing or invalid 'url'." };
    }

    const maxLength = Math.min(Math.max(parseInt(args?.max_length, 10) || 5000, 100), 50000);

    const controller = new AbortController();
    const timeoutMs = 12000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(rawUrl, {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,bn;q=0.8"
        },
        signal: controller.signal,
        redirect: "follow"
      });

      clearTimeout(timeoutId);

      const contentType = res.headers.get("content-type") || "";
      const rawText = await res.text();

      // Check for Cloudflare / DDoS bot protection challenge
      const isCloudflare = rawText.includes("Just a moment...") || rawText.includes("challenge-platform") || rawText.includes("cf-chl-opt");
      if (isCloudflare || res.status === 403) {
        return {
          success: false,
          status_code: res.status,
          error: "Website is protected by Cloudflare bot protection / JavaScript challenge.",
          url: rawUrl,
          suggestion: "Use web_search to find information about this item, or use open_application to open it directly in the desktop browser."
        };
      }

      let clean = rawText;
      if (contentType.includes("html") || rawText.includes("<html") || rawText.includes("<body")) {
        clean = rawText
          .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ")
          .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ")
          .replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, " ")
          .replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, " ")
          .replace(/<header\b[^<]*(?:(?!<\/header>)<[^<]*)*<\/header>/gi, " ")
          .replace(/<[^>]+>/g, " ")
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/\s+/g, " ")
          .trim();
      }

      return {
        success: res.ok,
        status_code: res.status,
        content_type: contentType,
        content: clean.slice(0, maxLength)
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === "AbortError" || controller.signal.aborted;
      return {
        success: false,
        error: isAbort ? `Request timed out after ${timeoutMs}ms` : err.message || "Failed to fetch URL",
        url: rawUrl
      };
    }
  }
};
