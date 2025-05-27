import { load } from 'cheerio';
import type { Element } from 'domhandler';

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  content?: string;
}

export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  summary: string;
}

class WebSearchService {
  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      // Use DuckDuckGo HTML search
      const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`;
      const response = await fetch(searchUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const html = await response.text();
      const $ = load(html);
      const results: SearchResult[] = [];

      // Parse DuckDuckGo results
      $('.result').each((i: number, element: Element) => {
        if (i >= 5) return false; // Limit to top 5 results

        const titleElement = $(element).find('.result__title a');
        const snippetElement = $(element).find('.result__snippet');
        
        const title = titleElement.text().trim();
        const url = titleElement.attr('href');
        const snippet = snippetElement.text().trim();

        if (title && url && snippet) {
          results.push({
            title,
            url: url.startsWith('//') ? `https:${url}` : url,
            snippet
          });
        }
      });

      return results;
    } catch (error) {
      console.error('DuckDuckGo search error:', error);
      return [];
    }
  }

  private async scrapeContent(url: string): Promise<string> {
    try {
      // Create AbortController for timeout functionality
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        return '';
      }

      const html = await response.text();
      const $ = load(html);

      // Remove script and style elements
      $('script, style, nav, header, footer, aside').remove();

      // Extract main content
      let content = '';
      const contentSelectors = [
        'main',
        'article',
        '.content',
        '.main-content',
        '#content',
        '.post-content',
        '.entry-content'
      ];

      for (const selector of contentSelectors) {
        const element = $(selector);
        if (element.length > 0) {
          content = element.text().trim();
          break;
        }
      }

      // Fallback to body if no main content found
      if (!content) {
        content = $('body').text().trim();
      }

      // Clean up the content
      content = content
        .replace(/\s+/g, ' ')
        .replace(/\n+/g, '\n')
        .trim();

      // Limit content length
      return content.substring(0, 2000);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return '';
    }
  }

  async search(query: string): Promise<WebSearchResponse> {
    try {
      console.log(`Searching for: ${query}`);
      
      // Get search results
      const results = await this.searchDuckDuckGo(query);
      
      if (results.length === 0) {
        return {
          query,
          results: [],
          summary: 'No search results found.'
        };
      }

      // Scrape content from top results
      const enhancedResults = await Promise.all(
        results.slice(0, 3).map(async (result) => {
          const content = await this.scrapeContent(result.url);
          return {
            ...result,
            content: content || result.snippet
          };
        })
      );

      // Create a summary of findings
      const summary = enhancedResults
        .map(result => `${result.title}: ${result.content || result.snippet}`)
        .join('\n\n')
        .substring(0, 1500);

      return {
        query,
        results: enhancedResults,
        summary: summary || 'Search completed but no detailed content was extracted.'
      };
    } catch (error) {
      console.error('Web search error:', error);
      return {
        query,
        results: [],
        summary: 'Search failed due to an error.'
      };
    }
  }
}

export const webSearchService = new WebSearchService(); 