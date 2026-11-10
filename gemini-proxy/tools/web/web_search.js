module.exports = {
  declaration: {
    name: "web_search",
    description: "Searches the live web in the background and returns top search results, snippets, and page links. Use this when the user asks for current information, facts, product specs, prices, news, or asks to search for something.",
    parameters: {
      type: "OBJECT",
      properties: {
        query: {
          type: "STRING",
          description: "Search keywords or question (e.g. 'HP elitebook 845 g7 ryzen 7 price bdstall', 'latest news', 'who won the match')."
        },
        max_results: {
          type: "INTEGER",
          description: "Maximum number of search result snippets to return (default: 5)."
        }
      },
      required: ["query"]
    }
  },

  async execute(args) {
    const rawQuery = (args?.query || "").trim();
    if (!rawQuery) {
      return { success: false, error: "Missing 'query' parameter." };
    }

    const maxResults = Math.min(Math.max(parseInt(args?.max_results, 10) || 5, 1), 10);
    const controller = new AbortController();
    const timeoutMs = 10000;
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      // 1. DuckDuckGo live HTML search in the background
      const res = await fetch("https://html.duckduckgo.com/html/", {
        method: "POST",
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
          "Content-Type": "application/x-www-form-urlencoded",
          "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
          "Accept-Language": "en-US,en;q=0.9,bn;q=0.8"
        },
        body: "q=" + encodeURIComponent(rawQuery),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        return {
          success: false,
          query: rawQuery,
          status_code: res.status,
          error: `Search engine returned status ${res.status}`
        };
      }

      const html = await res.text();
      const resultBlocks = html.split('<div class="result results_links');
      const results = [];

      for (let i = 1; i < resultBlocks.length && results.length < maxResults; i++) {
        const block = resultBlocks[i];
        const titleMatch = block.match(/<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
        const snippetMatch = block.match(/<a[^>]+class="result__snippet"[^>]*>([\s\S]*?)<\/a>/i);

        let link = titleMatch?.[1] || "";
        // Unescape DDG redirect wrapper if present
        if (link.includes("uddg=")) {
          try {
            const m = link.match(/uddg=([^&]+)/);
            if (m) link = decodeURIComponent(m[1]);
          } catch (_) {}
        }

        const title = (titleMatch?.[2] || "")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();

        const snippet = (snippetMatch?.[1] || "")
          .replace(/<[^>]+>/g, "")
          .replace(/&amp;/g, "&")
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .replace(/\s+/g, " ")
          .trim();

        if (title || snippet) {
          results.push({
            rank: results.length + 1,
            title,
            link,
            snippet
          });
        }
      }

      if (results.length === 0) {
        return {
          success: true,
          query: rawQuery,
          count: 0,
          message: "No relevant search results found for this query.",
          results: []
        };
      }

      // Synthesize combined text summary for easy voice consumption
      const summaryText = results
        .map((r) => `[${r.rank}] ${r.title}\n${r.snippet}\nSource: ${r.link}`)
        .join("\n\n");

      return {
        success: true,
        query: rawQuery,
        count: results.length,
        summary: summaryText,
        results
      };
    } catch (err) {
      clearTimeout(timeoutId);
      const isAbort = err.name === "AbortError" || controller.signal.aborted;
      return {
        success: false,
        query: rawQuery,
        error: isAbort ? `Search timed out after ${timeoutMs}ms` : err.message || "Failed to execute search"
      };
    }
  }
};
