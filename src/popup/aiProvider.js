export class AIProviderService {
    static PROVIDERS = {
      OPENAI: 'openai',
      ANTHROPIC: 'anthropic',
      GEMINI: 'gemini',
      CHROME_PROMPT: 'chrome_prompt'
    };
  
    constructor() {
      // Set your default provider here
      this.currentProvider = AIProviderService.PROVIDERS.CHROME_PROMPT;
    }

    /**
     * 
     * Format the response strictly as JSON with this structure:
        {
          "overallRisk": "HIGH_RISK|MEDIUM_RISK|LOW_RISK",
          "summary": "Brief overall assessment",
          "categories": [
            {
              "name": "DATA_COLLECTION",
              "risk": "HIGH|MEDIUM|LOW",
              "details": "Analysis details"
            },
            ...
          ]
        }
     */
    #buildPrompt(content) {
        return `Analyze this privacy policy and provide a structured analysis with:
    
        1. Overall Risk Level:
        Rate as one of: HIGH_RISK, MEDIUM_RISK, or LOW_RISK based on data collection and sharing practices.
    
        2. Provide analysis in these categories, marking each with a risk level (HIGH, MEDIUM, or LOW):
        - DATA_COLLECTION: What personal data is collected
        - DATA_SHARING: How the data is used and shared
        - USER_RIGHTS: Privacy controls and user rights
        - SECURITY: Data security and protection measures

        Format the response strictly as JSON with this structure:
        {
          "overallRisk": "HIGH_RISK|MEDIUM_RISK|LOW_RISK",
          "summary": "Brief overall assessment",
          "categories": [
            {
              "name": "DATA_COLLECTION",
              "risk": "HIGH|MEDIUM|LOW",
              "details": "Analysis details"
            },
            ...
          ]
        }

        Do not include anything other than the JSON and make sure the JSON format is maintained in the response. Do not use any any jargons and use simple language for the analysis and keep it under 2 sentences.
    
        Privacy Policy:
        ${content}`;
    }
  
    async analyzePage(content) {
      switch (this.currentProvider) {
        case AIProviderService.PROVIDERS.OPENAI:
          return this.#analyzeWithOpenAI(content);
        case AIProviderService.PROVIDERS.ANTHROPIC:
          return this.#analyzeWithAnthropic(content);
        case AIProviderService.PROVIDERS.GEMINI:
          return this.#analyzeWithGemini(content);
        case AIProviderService.PROVIDERS.CHROME_PROMPT:
          return this.#analyzeWithChromePrompt(content);
        default:
          throw new Error('Provider not configured');
      }
    }
  
    async #analyzeWithOpenAI(content) {
      try {
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-3.5-turbo",
            messages: [{
              role: "user",
              content: this.#buildPrompt(content)
            }],
            temperature: 0.7,
            max_tokens: 500
          })
        });
  
        if (!response.ok) {
          throw new Error('OpenAI API error');
        }
  
        const data = await response.json();
        return data.choices[0].message.content;
      } catch (error) {
        console.error('OpenAI analysis failed:', error);
        throw error;
      }
    }
  
    async #analyzeWithAnthropic(content) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': process.env.ANTHROPIC_API_KEY,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: "claude-3-sonnet-20240229",
            messages: [{
              role: "user",
              content: this.#buildPrompt(content)
            }],
            max_tokens: 500
          })
        });
  
        if (!response.ok) {
          throw new Error('Anthropic API error');
        }
  
        const data = await response.json();
        return data.content[0].text;
      } catch (error) {
        console.error('Anthropic analysis failed:', error);
        throw error;
      }
    }
  
    async #analyzeWithGemini(content) {
      try {
        const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-goog-api-key': process.env.GEMINI_API_KEY
          },
          body: JSON.stringify({
            contents: [{
              parts: [{
                text: this.#buildPrompt(content)
              }]
            }]
          })
        });

        console.log('Gemini response:', response);
  
        if (!response.ok) {
          throw new Error('Gemini API error');
        }
  
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
      } catch (error) {
        console.error('Gemini analysis failed:', error);
        throw error;
      }
    }

    async #analyzeWithChromePrompt(content) {
      try {
        const capabilities = await chrome.aiOriginTrial.languageModel.capabilities();
        console.log('Chrome Prompt API capabilities:', capabilities.available);
        
        if (capabilities.available === 'no') {
          throw new Error('Chrome Prompt API not available');
        }

        const session = await chrome.aiOriginTrial.languageModel.create();
        console.log('Chrome Prompt API session:', content);

        // Estimate the number of tokens in the content using session.countPromptTokens
        const tokenCount = await session.countPromptTokens(content);
        console.log('Estimated token count:', tokenCount);

        // Trim the content if it exceeds 3000 tokens
        let processedContent = content;
        if (tokenCount > 4000) {
          processedContent = this.#trimContent(content, 300);
          console.log('Trimmed content:', processedContent);
          const trimmedTokenCount = await session.countPromptTokens(processedContent);
          console.log('Trimmed token count:', trimmedTokenCount);
        }

        const result = await session.prompt(this.#buildPrompt(processedContent));
        console.log('Chrome Prompt API result:', result);

        // Log the number of tokens used in the session
        const tokensUsed = await session.tokensSoFar;
        const costPerToken = 0.0001; // Example cost per token
        const totalCost = tokensUsed * costPerToken;
        console.log(`Tokens used: ${tokensUsed}`);
        console.log(`Total cost: $${totalCost.toFixed(4)}`);

        session.destroy();
        return result;
      } catch (error) {
        console.error('Chrome Prompt API analysis failed:', error);
        throw error;
      }
    }

    // Helper method to estimate token count
    #estimateTokenCount(content) {
      // Assuming an average token length of 4 characters
      const averageTokenLength = 4;
      return Math.ceil(content.length / averageTokenLength);
    }

    // Helper method to trim content
    #trimContent(content, tokenCount) {
      // Assuming an average token length of 6 characters
      const averageTokenLength = 6;
      const maxLength = content.length - (tokenCount * averageTokenLength);
      return content.length > maxLength ? content.substring(0, maxLength) : content;
    }

    // Helper method to count words
    #countWords(content) {
        return content.split(/\s+/).filter(word => word.length > 0).length;
    }

    // Helper method to estimate token length
    #estimateTokenLength(content, wordCount) {
        return content.length / wordCount;
    }
}