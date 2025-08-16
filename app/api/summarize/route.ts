import { NextRequest, NextResponse } from 'next/server';
import Groq from 'groq-sdk';

export async function POST(request: NextRequest) {
    console.log("api hits")
  try {
    console.log('=== Summarize API Called ===');
    
    const { transcript, instruction } = await request.json();
    console.log('Request data received:', { 
      transcriptLength: transcript?.length, 
      instruction: instruction?.substring(0, 50) + '...' 
    });

    if (!transcript || !instruction) {
      console.log('Missing required fields');
      return NextResponse.json(
        { error: 'Transcript and instruction are required' },
        { status: 400 }
      );
    }

    // Check for API key
    console.log('Checking API key...');
    if (!process.env.GROQ_API_KEY) {
      console.log('GROQ_API_KEY not found');
      return NextResponse.json(
        { error: 'GROQ_API_KEY is not configured' },
        { status: 500 }
      );
    }
    console.log('API key found, length:', process.env.GROQ_API_KEY.length);

    // Initialize Groq client
    console.log('Initializing Groq client...');
    const groq = new Groq({
      apiKey: process.env.GROQ_API_KEY,
    });
    console.log('Groq client initialized successfully');

    // Make API call
    console.log('Making API call to Groq...');
    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert meeting notes summarizer. Your task is to create clear, concise, and actionable summaries.',
        },
        {
          role: 'user',
          content: `${instruction}\n\nTranscript:\n${transcript}`,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      max_tokens: 2048,
    });

    console.log('API call successful');
    const summary = chatCompletion.choices[0]?.message?.content || 'No summary generated';
    
    console.log('Returning summary, length:', summary.length);
    return NextResponse.json({ summary });

  } catch (error) {
    console.error('=== ERROR in Summarize API ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    
    return NextResponse.json(
      { error: 'Failed to generate summary: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
