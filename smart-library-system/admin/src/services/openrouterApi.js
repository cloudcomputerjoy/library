/**
 * OpenRouter AI Service
 * Handles all AI-powered features including:
 * - Book recommendations
 * - Predictive analytics
 * - Library insights
 * - Natural language queries
 */

import axios from 'axios';

const OPENROUTER_API_KEY = process.env.REACT_APP_OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

// Default model - can be switched based on needs
const DEFAULT_MODEL = 'openrouter/auto'; // Auto-selects best model
const BUSINESS_MODEL = 'meta-llama/llama-2-70b-chat'; // For business insights
const ANALYSIS_MODEL = 'openai/gpt-3.5-turbo'; // For data analysis

const openrouterClient = axios.create({
  baseURL: OPENROUTER_BASE_URL,
  timeout: 30000,
  headers: {
    'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
    'HTTP-Referer': window.location.origin,
    'X-Title': 'Smart Library Admin'
  }
});

/**
 * Generate AI insights about library usage
 */
export const generateLibraryInsights = async (libraryStats) => {
  try {
    const prompt = `
You are a library management expert. Analyze the following library statistics and provide actionable insights:

Library Statistics:
- Total Students: ${libraryStats.totalStudents}
- Total Books: ${libraryStats.totalBooks}
- Books Issued Today: ${libraryStats.issuedToday}
- Overdue Books: ${libraryStats.overdueBooks}
- Peak Hours: ${libraryStats.peakHours}
- Popular Categories: ${libraryStats.popularCategories.join(', ')}
- Average Borrow Duration: ${libraryStats.avgBorrowDays} days
- Return Rate: ${libraryStats.returnRate}%

Please provide:
1. Key insights about library usage patterns
2. Recommendations to improve book circulation
3. Suggestions to reduce overdue books
4. Ways to encourage reading in underutilized categories
5. Peak hour optimization strategies

Format as JSON with keys: insights, recommendations, strategies.
`;

    const response = await openrouterClient.post('/chat/completions', {
      model: BUSINESS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional library management consultant. Provide detailed, actionable insights in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const content = response.data.choices[0].message.content;
    return parseJSON(content);
  } catch (error) {
    console.error('Error generating library insights:', error);
    throw new Error('Failed to generate library insights');
  }
};

/**
 * Get personalized book recommendations
 */
export const getBookRecommendations = async (studentProfile, libraryBooks) => {
  try {
    const prompt = `
You are a book recommendation expert for a library system. Based on the student profile and available books, recommend the most suitable books.

Student Profile:
- Reading Level: ${studentProfile.readingLevel}
- Previous Books Read: ${studentProfile.previousBooks.join(', ')}
- Preferences: ${studentProfile.preferences.join(', ')}
- Academic Focus: ${studentProfile.academicFocus}

Available Books in Library:
${libraryBooks.map(b => `- "${b.title}" by ${b.author} (Category: ${b.category}, Popularity: ${b.popularity}/5)`).join('\n')}

Please recommend:
1. Top 5 most suitable books with reasons
2. Alternative recommendations for different moods
3. Books that bridge to new interests
4. Estimated reading time for each

Format as JSON with keys: topRecommendations, alternatives, bridgeRecommendations.
`;

    const response = await openrouterClient.post('/chat/completions', {
      model: BUSINESS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are an expert book recommender. Provide personalized recommendations in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 1500
    });

    const content = response.data.choices[0].message.content;
    return parseJSON(content);
  } catch (error) {
    console.error('Error generating recommendations:', error);
    throw new Error('Failed to generate book recommendations');
  }
};

/**
 * Predict future library trends
 */
export const predictLibraryTrends = async (historicalData) => {
  try {
    const prompt = `
Analyze this library historical data and predict future trends:

Monthly Data (Last 12 months):
${historicalData.map((m, i) => `Month ${i + 1}: Issues=${m.issues}, Returns=${m.returns}, New Students=${m.newStudents}, Popular Category=${m.topCategory}`).join('\n')}

Current Inventory:
- Total Books: ${historicalData[historicalData.length - 1].totalBooks}
- Categories: ${historicalData[historicalData.length - 1].categories}

Please provide:
1. Predicted peak seasons and low seasons
2. Expected book demand in next quarter
3. Recommended categories to add to inventory
4. Predicted student engagement patterns
5. Risk factors and mitigation strategies

Format as JSON with keys: seasonalTrends, demandPrediction, categoryRecommendations, engagementPatterns, riskAnalysis.
`;

    const response = await openrouterClient.post('/chat/completions', {
      model: ANALYSIS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a data analyst specializing in library management. Provide trend predictions in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.6,
      max_tokens: 2000
    });

    const content = response.data.choices[0].message.content;
    return parseJSON(content);
  } catch (error) {
    console.error('Error predicting trends:', error);
    throw new Error('Failed to predict library trends');
  }
};

/**
 * Analyze book suitability for library
 */
export const analyzeBookSuitability = async (bookDetails, libraryProfile) => {
  try {
    const prompt = `
Analyze if this book is suitable for our library:

Book Details:
- Title: ${bookDetails.title}
- Author: ${bookDetails.author}
- Genre: ${bookDetails.genre}
- Reading Level: ${bookDetails.readingLevel}
- Summary: ${bookDetails.summary}
- Page Count: ${bookDetails.pages}
- Publication Year: ${bookDetails.year}

Library Profile:
- Student Age Range: ${libraryProfile.ageRange}
- Primary Subjects: ${libraryProfile.subjects.join(', ')}
- Current Inventory Size: ${libraryProfile.inventorySize}
- Budget: ${libraryProfile.budget}
- Popular Genres: ${libraryProfile.popularGenres.join(', ')}

Provide:
1. Suitability score (0-100)
2. Target audience alignment
3. Potential demand prediction
4. Collection gaps it fills
5. Recommendation (Buy/Skip/Consider)

Format as JSON with keys: suitabilityScore, targetAudience, demandPrediction, collectingGaps, recommendation.
`;

    const response = await openrouterClient.post('/chat/completions', {
      model: ANALYSIS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a library acquisition expert. Analyze book suitability and provide recommendations in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    const content = response.data.choices[0].message.content;
    return parseJSON(content);
  } catch (error) {
    console.error('Error analyzing book suitability:', error);
    throw new Error('Failed to analyze book suitability');
  }
};

/**
 * Generate natural language query response
 */
export const queryAI = async (question, context = {}) => {
  try {
    const systemPrompt = `You are an intelligent library management assistant. You have access to library data and can provide insights, answer questions, and make recommendations. Be concise and helpful.`;

    const userPrompt = `
Context:
- Library Name: ${context.libraryName || 'Smart Library'}
- Total Users: ${context.totalUsers || 'N/A'}
- Total Books: ${context.totalBooks || 'N/A'}

Question: ${question}
`;

    const response = await openrouterClient.post('/chat/completions', {
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: userPrompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000
    });

    return response.data.choices[0].message.content;
  } catch (error) {
    console.error('Error querying AI:', error);
    throw new Error('Failed to process AI query');
  }
};

/**
 * Identify student reading patterns
 */
export const analyzeReadingPatterns = async (studentData) => {
  try {
    const prompt = `
Analyze the reading patterns of students in our library:

Student Reading Data:
- Total Active Students: ${studentData.totalStudents}
- Average Books Per Student: ${studentData.avgBooksPerStudent}
- Reading Frequency Distribution: ${JSON.stringify(studentData.frequencyDistribution)}
- Popular Genres: ${studentData.popularGenres.join(', ')}
- Average Reading Level: ${studentData.avgReadingLevel}
- Engagement Rate: ${studentData.engagementRate}%

Provide:
1. Identified reading segments and their characteristics
2. Engagement improvement strategies
3. Content recommendations by segment
4. Risk factors for low engagement
5. Growth opportunities

Format as JSON with keys: readingSegments, engagementStrategies, contentRecommendations, riskFactors, opportunities.
`;

    const response = await openrouterClient.post('/chat/completions', {
      model: BUSINESS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a reading behavior analyst. Analyze patterns and provide strategic recommendations in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1500
    });

    const content = response.data.choices[0].message.content;
    return parseJSON(content);
  } catch (error) {
    console.error('Error analyzing reading patterns:', error);
    throw new Error('Failed to analyze reading patterns');
  }
};

/**
 * Generate management report
 */
export const generateManagementReport = async (reportData) => {
  try {
    const prompt = `
Generate a comprehensive library management report based on the following data:

Period: ${reportData.period}

Key Metrics:
- Total Issues: ${reportData.totalIssues}
- Total Returns: ${reportData.totalReturns}
- Overdue Rate: ${reportData.overdueRate}%
- New Registrations: ${reportData.newRegistrations}
- Active Users: ${reportData.activeUsers}
- Revenue (if applicable): ${reportData.revenue}

Performance Analysis:
- Top Performing Categories: ${reportData.topCategories.join(', ')}
- Underperforming Categories: ${reportData.underCategories.join(', ')}
- Staff Efficiency: ${reportData.staffEfficiency}%
- System Uptime: ${reportData.uptime}%

Please generate:
1. Executive Summary
2. Performance Highlights
3. Areas for Improvement
4. Actionable Recommendations
5. Future Outlook

Format as JSON with keys: executiveSummary, highlights, improvements, recommendations, outlook.
`;

    const response = await openrouterClient.post('/chat/completions', {
      model: BUSINESS_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You are a professional business analyst. Generate comprehensive management reports in JSON format.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 2500
    });

    const content = response.data.choices[0].message.content;
    return parseJSON(content);
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate management report');
  }
};

/**
 * Helper function to parse JSON from AI response
 */
function parseJSON(content) {
  try {
    // Try to extract JSON from markdown code blocks if present
    const jsonMatch = content.match(/```json\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[1]);
    }
    // Try to parse directly
    return JSON.parse(content);
  } catch (error) {
    console.warn('Could not parse JSON response, returning as string:', error);
    return { response: content };
  }
}

/**
 * Stream AI response (for long-running operations)
 */
export const streamAIResponse = async (prompt, onChunk, onComplete, onError) => {
  try {
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Smart Library Admin',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: DEFAULT_MODEL,
        messages: [
          {
            role: 'system',
            content: 'You are a helpful library management assistant.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        stream: true,
        temperature: 0.7
      })
    });

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') {
            onComplete?.();
            continue;
          }
          try {
            const json = JSON.parse(data);
            const content = json.choices[0]?.delta?.content || '';
            if (content) onChunk?.(content);
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  } catch (error) {
    console.error('Error streaming AI response:', error);
    onError?.(error);
  }
};

const openrouterApiService = {
  generateLibraryInsights,
  getBookRecommendations,
  predictLibraryTrends,
  analyzeBookSuitability,
  queryAI,
};

export default openrouterApiService;
