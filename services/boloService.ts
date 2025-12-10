import { GoogleGenAI, Type } from "@google/genai";
import { AppSettings, SupportedLanguage } from "../types";

// Initialize the API client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-2.5-flash';

/**
 * Converts a Blob to a Base64 string for the API.
 */
export const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64Data = result.split(',')[1];
      resolve(base64Data);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

interface BoloResponse {
  text: string;
  detectedLanguage: string;
  englishTranslation: string;
}

/**
 * The Core Bolo Engine.
 * Utilizes Gemini 2.5 Flash with advanced prompting for multilingual ASR.
 */
export const processAudio = async (audioBlob: Blob, settings?: AppSettings): Promise<BoloResponse> => {
  const base64Audio = await blobToBase64(audioBlob);

  // Dynamic Prompt Construction based on Settings
  let languageContext = "The audio contains speech in English, Hindi, Nepali, or a mix of these (Code-switching).";
  
  if (settings?.language && settings.language !== SupportedLanguage.AUTO) {
    languageContext = `The audio is primarily in ${settings.language}, but may contain mixed English terms. Focus on transcribing ${settings.language} accurately.`;
  }

  const systemInstruction = `
    You are 'Bolo', a state-of-the-art Automatic Speech Recognition (ASR) system specialized in South Asian languages.
    
    **CRITICAL AUDIO PROCESSING INSTRUCTIONS:**
    1.  **Noise Cancellation**: The input audio may contain background noise, traffic, or static. Aggressively filter this out and focus ONLY on the clear human voice.
    2.  **Music Suppression**: If there is background music or lyrics playing, IGNORE them completely. Do not transcribe lyrics from background songs. Only transcribe the user's spoken voice.
    3.  **Adaptive Focus**: If there are multiple voices, focus on the dominant, loudest speaker (the user).

    **Linguistic Capabilities:**
    1.  **Multilingual**: English, Nepali, and Hindi.
    2.  **Code-Switching**: Handle sentences that mix languages smoothly.
    3.  **Script**: 
        -   Latin Script for English.
        -   Devanagari Script for Hindi/Nepali.
    4.  **Formatting**: Apply professional punctuation and capitalization.
    5.  **Translation**: Provide a fluent English translation.
  `;

  const prompt = `
    ${languageContext}

    **Task**:
    1.  **Transcribe** the foreground speech verbatim. 
    2.  **Detect** the primary language.
    3.  **Translate** to English.

    **Output Format**:
    Return strictly a JSON object.
  `;

  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: audioBlob.type || 'audio/webm',
              data: base64Audio,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: { 
                type: Type.STRING, 
                description: "The formatted verbatim transcription. Use Devanagari for Hindi/Nepali and Latin for English." 
            },
            detectedLanguage: { 
                type: Type.STRING, 
                description: "The detected primary language." 
            },
            englishTranslation: { 
                type: Type.STRING, 
                description: "The English translation of the spoken content." 
            }
          },
          required: ["text", "detectedLanguage", "englishTranslation"]
        }
      },
    });

    const jsonText = response.text || "{}";
    const result = JSON.parse(jsonText) as BoloResponse;
    return result;

  } catch (error) {
    console.error("Bolo Engine Error:", error);
    throw new Error("Bolo encountered an interference. Please try speaking clearly again.");
  }
};

/**
 * Utility to translate text if the user edits the original and wants to re-translate.
 */
export const translateText = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: `Translate the following text to English. Return only the translated text.\n\nText: ${text}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Translation Error:", error);
    return "Translation failed.";
  }
};