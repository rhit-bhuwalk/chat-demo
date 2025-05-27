import OpenAI from 'openai';
import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { webSearchService } from '@/lib/webSearch';

// Read system prompt from file
function getSystemPrompt(): string {
  try {
    const promptPath = path.join(process.cwd(), 'system_prompt.txt');
    return fs.readFileSync(promptPath, 'utf-8');
  } catch (error) {
    console.error('Error reading system prompt file:', error);
    // Enhanced fallback prompt with web search capabilities
    return `You are the BRCJ Civil Agent, a helpful AI assistant specializing in civil engineering and construction. You have access to web search capabilities for current information.

When you need current information, recent data, or want to verify facts, you can search the web. Use this for:
- Current regulations or code updates
- Recent project examples or case studies  
- Current market prices or material costs
- Latest industry trends or technologies
- News about construction projects
- Weather conditions for project planning

Be professional, safety-focused, and provide accurate technical guidance. When you use web search results, cite your sources and indicate when information comes from web searches.`;
  }
}

// Function to determine if a query needs web search
function needsWebSearch(userMessage: string): boolean {
  const webSearchKeywords = [
    'current', 'latest', 'recent', 'today', 'now', 'this year', '2024', '2025',
    'news', 'update', 'what happened', 'weather', 'price', 'cost',
    'regulation', 'code update', 'new standard', 'trending',
    'market', 'industry news', 'project examples', 'case studies'
  ];
  
  const lowerMessage = userMessage.toLowerCase();
  return webSearchKeywords.some(keyword => lowerMessage.includes(keyword));
}

// Function to extract search query from user message
function extractSearchQuery(userMessage: string): string {
  // Simple extraction - you could make this more sophisticated
  const message = userMessage.toLowerCase();
  
  // Remove common question words and keep the core topic
  const cleanedMessage = message
    .replace(/^(what|how|when|where|why|tell me about|can you find|search for|look up)/i, '')
    .replace(/\?$/, '')
    .trim();
    
  return cleanedMessage || userMessage;
}

export async function POST(request: NextRequest) {
  try {
    const { messages } = await request.json();

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      );
    }

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const systemPrompt = getSystemPrompt();
    const lastUserMessage = messages[messages.length - 1]?.content || '';
    
    // Check if we need to search the web
    let webSearchContext = '';
    if (needsWebSearch(lastUserMessage)) {
      try {
        const searchQuery = extractSearchQuery(lastUserMessage);
        console.log(`Performing web search for: ${searchQuery}`);
        
        const searchResults = await webSearchService.search(searchQuery);
        
        if (searchResults.results.length > 0) {
          webSearchContext = `\n\nWEB SEARCH RESULTS for "${searchQuery}":\n${searchResults.summary}\n\nSources:\n${searchResults.results.map(r => `- ${r.title} (${r.url})`).join('\n')}\n\nPlease use this current information in your response and cite the sources when relevant.`;
        }
      } catch (error) {
        console.error('Web search failed:', error);
        webSearchContext = '\n\n(Note: Attempted to search for current information but web search is currently unavailable.)';
      }
    }

    const completion = await openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt + webSearchContext },
        ...messages,
      ],
      max_tokens: 1000,
      temperature: 0.7,
    });

    const assistantMessage = completion.choices[0]?.message?.content || 'Sorry, I could not generate a response.';

    return NextResponse.json({ message: assistantMessage });
  } catch (error) {
    console.error('Chat API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 