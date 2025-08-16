import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    console.log('Testing environment variables...');
    console.log('GROQ_API_KEY exists:', !!process.env.GROQ_API_KEY);
    console.log('GROQ_API_KEY length:', process.env.GROQ_API_KEY?.length);
    
    return NextResponse.json({ 
      success: true,
      hasGroqKey: !!process.env.GROQ_API_KEY,
      keyLength: process.env.GROQ_API_KEY?.length || 0
    });
  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({ error: 'Test failed' }, { status: 500 });
  }
}
