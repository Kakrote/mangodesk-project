'use client';

import { useState } from 'react';

export default function Home() {
  const [transcript, setTranscript] = useState('');
  const [customInstruction, setCustomInstruction] = useState('');
  const [summary, setSummary] = useState('');
  const [emails, setEmails] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (e) => {
        setTranscript(e.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const generateSummary = async () => {
    if (!transcript.trim()) {
      alert('Please provide a transcript.');
      return;
    }
    console.log("transcript :",transcript)

    setIsGenerating(true);
    try {
      const response = await fetch('/api/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          instruction: customInstruction || 'Summarize this meeting transcript.',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate summary');
      }

      const data = await response.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error generating summary:', error);
      alert('Failed to generate summary. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const sendEmail = async () => {
    if (!summary.trim()) {
      alert('Please generate a summary first.');
      return;
    }

    if (!emails.trim()) {
      alert('Please provide recipient email addresses.');
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          summary,
          emails: emails.split(',').map(email => email.trim()),
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        if (response.status === 403) {
          alert(`Email sending restricted: ${errorData.details || 'Domain verification required'}`);
        } else {
          throw new Error('Failed to send email');
        }
        return;
      }

      alert('Summary sent successfully!');
      setEmails('');
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px' }}>
      <h1>AI-Powered Meeting Notes Summarizer</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Upload Transcript</h2>
        <input
          type="file"
          accept=".txt"
          onChange={handleFileUpload}
          style={{ marginBottom: '10px', display: 'block' }}
        />
        <p>Or paste transcript below:</p>
        <textarea
          value={transcript}
          onChange={(e) => setTranscript(e.target.value)}
          placeholder="Paste meeting transcript here..."
          style={{
            width: '100%',
            height: '150px',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Custom Instruction</h2>
        <input
          type="text"
          value={customInstruction}
          onChange={(e) => setCustomInstruction(e.target.value)}
          placeholder="e.g., Summarize in bullet points for executives"
          style={{
            width: '100%',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
          }}
        />
      </div>

      <button
        onClick={generateSummary}
        disabled={isGenerating}
        style={{
          backgroundColor: '#007bff',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          marginBottom: '20px',
        }}
      >
        {isGenerating ? 'Generating...' : 'Generate Summary'}
      </button>

      {summary && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Summary</h2>
          <textarea
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            style={{
              width: '100%',
              height: '200px',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
            }}
          />
        </div>
      )}

      {summary && (
        <div style={{ marginBottom: '20px' }}>
          <h2>Send via Email</h2>
          <div style={{ 
            backgroundColor: '#fff3cd', 
            border: '1px solid #ffeaa7', 
            borderRadius: '4px', 
            padding: '10px', 
            marginBottom: '10px',
            fontSize: '14px'
          }}>
            <strong>⚠️ Note:</strong> In testing mode, emails can only be sent to your verified email address (anshul.pundir111@gmail.com). 
            To send to other recipients, please verify a domain at resend.com/domains.
          </div>
          <input
            type="text"
            value={emails}
            onChange={(e) => setEmails(e.target.value)}
            placeholder="Enter email addresses (comma-separated)"
            style={{
              width: '100%',
              padding: '10px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginBottom: '10px',
            }}
          />
          <button
            onClick={sendEmail}
            disabled={isSending}
            style={{
              backgroundColor: '#28a745',
              color: 'white',
              padding: '10px 20px',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            {isSending ? 'Sending...' : 'Send Email'}
          </button>
        </div>
      )}
    </div>
  );
}
