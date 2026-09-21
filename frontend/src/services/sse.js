/**
 * Helper to stream Server-Sent Events (SSE) from FastAPI endpoint
 */
export async function streamChatResponse({
  sessionId,
  query,
  onCitation,
  onToken,
  onComplete,
  onError
}) {
  const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
  const token = localStorage.getItem('codechat_token');

  try {
    const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Server returned ${response.status}: ${errorText}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || ''; // Keep incomplete trailing line in buffer

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const dataStr = line.replace('data: ', '').trim();
          if (!dataStr) continue;

          try {
            const data = JSON.parse(dataStr);
            if (data.type === 'citations' && onCitation) {
              onCitation(data.citations);
            } else if (data.type === 'token' && onToken) {
              onToken(data.content);
            } else if (data.type === 'done' && onComplete) {
              onComplete();
            }
          } catch (err) {
            console.error('Error parsing SSE event:', err, dataStr);
          }
        }
      }
    }

    if (onComplete) onComplete();
  } catch (err) {
    if (onError) onError(err);
  }
}
