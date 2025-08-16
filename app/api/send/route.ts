import { NextRequest, NextResponse } from 'next/server';
import { Resend } from 'resend';

// Initialize Resend conditionally to avoid build-time errors
let resend: Resend | null = null;
if (process.env.RESEND_API_KEY) {
  resend = new Resend(process.env.RESEND_API_KEY);
}

export async function POST(request: NextRequest) {
  try {
    console.log('=== Email API Called ===');
    const { summary, emails } = await request.json();
    console.log('Request data:', { summaryLength: summary?.length, emails, emailCount: emails?.length });

    if (!summary || !emails || !Array.isArray(emails) || emails.length === 0) {
      console.log('Missing required fields - summary or emails');
      return NextResponse.json(
        { error: 'Summary and recipient emails are required' },
        { status: 400 }
      );
    }

    if (!process.env.RESEND_API_KEY) {
      console.log('RESEND_API_KEY not configured');
      return NextResponse.json(
        { error: 'RESEND_API_KEY is not configured' },
        { status: 500 }
      );
    }
    console.log('RESEND_API_KEY found, length:', process.env.RESEND_API_KEY.length);

    if (!process.env.EMAIL_FROM) {
      console.log('EMAIL_FROM not configured');
      return NextResponse.json(
        { error: 'EMAIL_FROM is not configured' },
        { status: 500 }
      );
    }
    console.log('EMAIL_FROM:', process.env.EMAIL_FROM);

    // Validate email addresses
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const invalidEmails = emails.filter(email => !emailRegex.test(email));
    
    if (invalidEmails.length > 0) {
      return NextResponse.json(
        { error: `Invalid email addresses: ${invalidEmails.join(', ')}` },
        { status: 400 }
      );
    }

    // Generate current date for the email
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    if (!resend) {
      console.log('Resend client not initialized properly');
      return NextResponse.json(
        { error: 'Email service not properly configured' },
        { status: 500 }
      );
    }

    console.log('Preparing to send email...');
    // Send email to all recipients
    const emailData = {
      from: process.env.EMAIL_FROM,
      to: emails,
      subject: `Meeting Summary - ${currentDate}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
            Meeting Summary
          </h1>
          <p style="color: #666; margin-bottom: 20px;">
            Generated on ${currentDate}
          </p>
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; border-left: 4px solid #007bff;">
            <pre style="white-space: pre-wrap; font-family: inherit; margin: 0; line-height: 1.6;">${summary}</pre>
          </div>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #ddd;">
          <p style="color: #999; font-size: 12px; text-align: center;">
            This summary was generated automatically using AI-powered meeting notes summarizer.
          </p>
        </div>
      `,
      text: `Meeting Summary - ${currentDate}\n\n${summary}\n\n---\nThis summary was generated automatically using AI-powered meeting notes summarizer.`,
    };

    console.log('Email data prepared:', { 
      from: emailData.from, 
      to: emailData.to, 
      subject: emailData.subject,
      htmlLength: emailData.html.length
    });

    const result = await resend.emails.send(emailData);
    console.log('Email API response:', result);

    // Check if there's an error in the result
    if (result.error) {
      console.error('Resend API error:', result.error);
      
      // Handle Resend API errors
      return NextResponse.json({
        error: 'Email service error',
        details: 'This might be due to domain verification requirements. Please verify a domain at resend.com/domains or use your verified email address for testing.',
        resendError: result.error
      }, { status: 403 });
    }

    return NextResponse.json({ 
      success: true, 
      emailId: result.data?.id,
      message: `Summary sent to ${emails.length} recipient(s)` 
    });
  } catch (error) {
    console.error('=== ERROR in Email API ===');
    console.error('Error type:', error?.constructor?.name);
    console.error('Error message:', error instanceof Error ? error.message : 'Unknown error');
    console.error('Full error:', error);
    
    return NextResponse.json(
      { error: 'Failed to send email: ' + (error instanceof Error ? error.message : 'Unknown error') },
      { status: 500 }
    );
  }
}
