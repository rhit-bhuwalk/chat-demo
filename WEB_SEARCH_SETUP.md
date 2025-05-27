# Web Search Integration for AI Chat Demo

## Overview
Your AI chat demo now has **web search capabilities** that allow the AI to access current information from the internet. The AI automatically searches for information when users ask about recent topics, current data, or need up-to-date information.

## Features Added

### 🔍 Automatic Web Search Detection
The AI automatically detects when queries need current information based on keywords like:
- `current`, `latest`, `recent`, `today`, `now`
- `news`, `update`, `what happened`
- `weather`, `price`, `cost`
- `regulation`, `code update`, `new standard`
- `market`, `industry news`, `trending`

### 🌐 Web Search Service
- **Search Engine**: Uses DuckDuckGo for privacy-friendly search
- **Content Extraction**: Automatically scrapes and summarizes relevant content
- **Source Citation**: Provides sources and URLs for information used
- **Error Handling**: Graceful fallback when search is unavailable

### 💬 Enhanced Chat Interface
- **Visual Indicators**: Shows when web search is being performed
- **Search Status**: Displays "Searching web for current info..." during searches
- **Search Confirmation**: Indicates when a response used web search data
- **Updated Placeholder**: Suggests web-searchable queries

### 🤖 AI Integration
- **Smart Context**: Web search results are automatically integrated into AI responses
- **Source Attribution**: AI cites sources when using web-found information
- **Professional Guidance**: Maintains professional tone while using current data

## How It Works

1. **User Query**: User asks about current information (e.g., "What are current steel prices?")
2. **Detection**: System detects web search keywords
3. **Search**: Automatically searches DuckDuckGo for relevant information
4. **Content Extraction**: Scrapes and summarizes content from top results
5. **AI Integration**: Provides search results as context to AI
6. **Response**: AI responds with current information and cites sources

## API Endpoints

### `/api/chat` (Enhanced)
- **Method**: POST
- **Enhanced**: Now includes automatic web search integration
- **Process**: Detects search needs → Performs search → Enhances AI context

### `/api/search` (New)
- **Method**: POST
- **Purpose**: Direct web search API for custom implementations
- **Input**: `{ "query": "search term" }`
- **Output**: Search results with titles, URLs, snippets, and content

## Files Modified/Added

### New Files:
- `src/lib/webSearch.ts` - Web search service implementation
- `src/app/api/search/route.ts` - Web search API endpoint

### Modified Files:
- `src/app/api/chat/route.ts` - Enhanced with web search integration
- `src/app/page.tsx` - Added visual indicators and search status
- `system_prompt.txt` - Updated to include web search capabilities
- `package.json` - Added cheerio and node-fetch dependencies

## Dependencies Added
```json
{
  "cheerio": "^1.0.0",  // HTML parsing and content extraction
  "node-fetch": "^3.3.0"  // HTTP requests (though using built-in fetch)
}
```

## Usage Examples

### Questions that trigger web search:
- "What are current steel prices?"
- "Latest building code updates"
- "Recent construction industry news"
- "Current weather in [location]"
- "New OSHA regulations 2024"
- "Market trends in construction"

### Questions that don't trigger web search:
- "How do I calculate beam load?"
- "What is concrete made of?"
- "Explain structural engineering basics"
- "Safety protocols for construction"

## Benefits

1. **Current Information**: Access to real-time data and recent developments
2. **Enhanced Accuracy**: Up-to-date regulations, prices, and industry standards
3. **Source Verification**: AI provides sources for fact-checking
4. **Professional Value**: More useful for real-world construction projects
5. **User Experience**: Clear indication when current data is being accessed

## Privacy & Security

- **Privacy-Focused**: Uses DuckDuckGo (no tracking)
- **Rate Limiting**: Built-in delays and limits to prevent abuse
- **Error Handling**: Graceful fallback when search unavailable
- **Content Filtering**: Focuses on professional, relevant content

The AI is now equipped to provide current, web-sourced information while maintaining its expertise in civil engineering and construction! 