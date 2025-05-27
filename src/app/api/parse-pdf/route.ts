import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Check if it's a PDF
    if (file.type !== 'application/pdf') {
      return NextResponse.json({ error: 'File must be a PDF' }, { status: 400 });
    }

    // Check file size (10MB limit)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ error: 'File too large. Maximum size is 10MB.' }, { status: 400 });
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Dynamically import pdf-parse with better error handling for production
    const { default: pdf } = await import('pdf-parse');
    
    // Parse PDF
    const data = await pdf(buffer);
    
    // Extract text content
    let text = data.text;
    
    // Safety check: limit text length
    const MAX_TEXT_LENGTH = 50000;
    if (text.length > MAX_TEXT_LENGTH) {
      text = text.substring(0, MAX_TEXT_LENGTH) + '\n\n[Content truncated due to length...]';
    }

    // Basic content sanitization
    text = text.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '[Script removed for security]');

    return NextResponse.json({
      success: true,
      text: text,
      metadata: {
        pages: data.numpages,
        info: data.info
      }
    });

  } catch (error) {
    console.error('PDF parsing error:', error);
    
    // More detailed error messages for debugging
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    console.error('Full error details:', errorMessage);
    
    return NextResponse.json(
      { error: `Failed to parse PDF: ${errorMessage}. The file may be corrupted, password-protected, or unsupported.` },
      { status: 500 }
    );
  }
} 