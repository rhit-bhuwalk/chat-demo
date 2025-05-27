'use client';

import { useState, useRef, useEffect } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  searchQuery?: string;
  fileName?: string;
}

interface UploadedFile {
  name: string;
  content: string;
  size: number;
}

export default function Chat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Function to detect if message might trigger web search
  const mightTriggerWebSearch = (message: string): boolean => {
    const webSearchKeywords = [
      'current', 'latest', 'recent', 'today', 'now', 'this year', '2024', '2025',
      'news', 'update', 'what happened', 'weather', 'price', 'cost',
      'regulation', 'code update', 'new standard', 'trending',
      'market', 'industry news', 'project examples', 'case studies'
    ];
    
    const lowerMessage = message.toLowerCase();
    return webSearchKeywords.some(keyword => lowerMessage.includes(keyword));
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    
    const willSearch = mightTriggerWebSearch(input);
    if (willSearch) {
      setIsSearching(true);
    }
    
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: newMessages,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      const assistantMessage: Message = { 
        role: 'assistant', 
        content: data.message,
        searchQuery: willSearch ? input : undefined
      };
      setMessages([...newMessages, assistantMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = { 
        role: 'assistant', 
        content: 'Sorry, I encountered an error. Please try again.' 
      };
      setMessages([...newMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const conversationStarters = [
    "What are the latest building codes and regulations?",
    "Can you help me with civil engineering project planning?",
    "What are current construction material prices?"
  ];

  const handleStarterClick = (starter: string) => {
    if (!isLoading) {
      setInput(starter);
    }
  };

  // File processing with safety checks
  const ALLOWED_FILE_TYPES = [
    'text/plain',
    'text/csv',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/json'
  ];
  
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB limit
  const MAX_TEXT_LENGTH = 50000; // Character limit for processed text

  const parseFileContent = async (file: File): Promise<string> => {
    // Handle PDF files differently - send to server for parsing
    if (file.type === 'application/pdf') {
      try {
        const formData = new FormData();
        formData.append('file', file);
        
        const response = await fetch('/api/parse-pdf', {
          method: 'POST',
          body: formData,
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Failed to parse PDF');
        }
        
        if (result.success) {
          const pageInfo = result.metadata?.pages ? ` (${result.metadata.pages} pages)` : '';
          return `[PDF File: ${file.name}${pageInfo}]\n\n${result.text}`;
        } else {
          throw new Error('PDF parsing failed');
        }
      } catch (error) {
        console.error('PDF parsing error:', error);
        throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }
    
    // Handle other file types with FileReader
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          let content = '';
          
          if (file.type === 'text/plain' || file.type === 'text/csv' || file.type === 'application/json') {
            content = e.target?.result as string;
          } else if (file.type.includes('word') || file.type.includes('document')) {
            // Word docs would need additional libraries
            content = `[Word Document: ${file.name}] - Document parsing would require additional libraries`;
          } else {
            content = e.target?.result as string;
          }
          
          // Safety check: limit text length
          if (content.length > MAX_TEXT_LENGTH) {
            content = content.substring(0, MAX_TEXT_LENGTH) + '\n\n[Content truncated due to length...]';
          }
          
          // Basic content sanitization
          content = content.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[Script removed for security]');
          
          resolve(content);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Safety checks
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      alert('Unsupported file type. Please upload: TXT, CSV, PDF, Word documents, or JSON files.');
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      alert('File too large. Maximum size is 10MB.');
      return;
    }

    setIsProcessingFile(true);

    try {
      const content = await parseFileContent(file);
      
      const fileData: UploadedFile = {
        name: file.name,
        content: content,
        size: file.size
      };
      
      setUploadedFile(fileData);
      
      // Auto-populate input with file reference
      setInput(`Please analyze this file: ${file.name}\n\nFile content:\n${content}`);
      
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error processing file. Please try again.';
      alert(errorMessage);
    } finally {
      setIsProcessingFile(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const removeFile = () => {
    setUploadedFile(null);
    setInput('');
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b border-gray-200 p-4">
        <h1 className="text-xl font-semibold text-gray-900">AI Chat</h1>
        <p className="text-sm text-gray-600">Now with web search capabilities for current information</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 mt-20">
            <h2 className="text-2xl font-bold mb-2">Hey, I&apos;m the BRCJ Civil Agent</h2>
            <p className="mb-4">How can I help you today?</p>
            <div className="bg-blue-50 rounded-lg p-4 text-sm text-left max-w-md mx-auto">
              <div className="font-semibold text-blue-800 mb-2">🌐 Web Search Enabled</div>
              <p className="text-blue-700">
                I can now search the web for current information on regulations, prices, 
                industry news, weather, and more. Just ask me about recent or current topics!
              </p>
            </div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md lg:max-w-lg xl:max-w-xl rounded-lg px-4 py-2 ${
                message.role === 'user'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {message.searchQuery && message.role === 'assistant' && (
                <div className="text-xs text-green-600 mb-2 flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  Searched the web for current information
                </div>
              )}
              <div className="whitespace-pre-wrap">{message.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2 max-w-xs">
              {isSearching && (
                <div className="text-xs text-green-600 mb-2 flex items-center">
                  <svg className="w-3 h-3 mr-1 animate-spin" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                  Searching web for current info...
                </div>
              )}
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 p-4">
        <div className="max-w-2xl mx-auto">
          {/* Conversation Starters */}
          {messages.length === 0 && (
            <div className="mb-4 space-y-2">
              <p className="text-sm text-gray-600 mb-3">Try these conversation starters:</p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                {conversationStarters.map((starter, index) => (
                  <button
                    key={index}
                    onClick={() => handleStarterClick(starter)}
                    disabled={isLoading}
                    className="text-left p-3 text-sm text-black bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* File Preview */}
          {uploadedFile && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-blue-800">{uploadedFile.name}</p>
                    <p className="text-xs text-blue-600">
                      {(uploadedFile.size / 1024).toFixed(1)} KB • Ready to analyze
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={removeFile}
                  className="text-blue-600 hover:text-blue-800 p-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          )}
          
          <form onSubmit={sendMessage} className="flex space-x-2">
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileUpload}
              accept=".txt,.csv,.pdf,.doc,.docx,.json"
              className="hidden"
              disabled={isLoading || isProcessingFile}
            />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything"
              className="flex-1 border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-green-800 focus:border-transparent placeholder-gray-500 text-black"
              disabled={isLoading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading || isProcessingFile}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Upload file"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M6 8h12"/>
                <path d="M18 8v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8"/>
                <circle cx="6" cy="8" r="2"/>
                <path d="M6 6V4a2 2 0 012-2h8a2 2 0 012 2v2"/>
                <path d="M10 12h4"/>
              </svg>
            </button>
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="bg-green-800 text-white px-6 py-2 rounded-lg hover:bg-green-900 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
