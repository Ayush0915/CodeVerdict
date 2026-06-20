const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Sends a PR URL to the backend to start a code review.
 * @param {string} prUrl
 * @returns {Promise<Object>} SynthesisResult
 */
export async function reviewPR(prUrl) {
  const response = await fetch(`${API_BASE_URL}/review`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ pr_url: prUrl }),
  });

  if (!response.ok) {
    let errorDetail = 'Failed to analyze pull request';
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errorDetail;
    } catch (e) {
      // JSON parsing error
    }
    throw new Error(errorDetail);
  }

  return response.json();
}
