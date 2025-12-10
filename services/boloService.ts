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
    You are 'Bolo', a high-precision speech processor.

    **CRITICAL MANDATE: NOISE & MUSIC ELIMINATION**
    1.  **STRICTLY IGNORE** background music, songs, lyrics, TV sounds, traffic noise, and distant background chatter.
    2.  **ISOLATE** the main human speaker. If there is music with vocals, IGNORE the vocals unless it is clearly the main user dictating.
    3.  **SILENCE HANDLING**: If the audio contains ONLY noise, music, or unintelligible sounds, YOU MUST return the string "SILENCE" in the "text" field. DO NOT return "[Music]", "[Noise]", or descriptions.

    **FORMATTING RULES:**
    1.  **Punctuation**: Add correct punctuation (commas, periods, ?, !) for professional readability.
    2.  **Capitalization**: Capitalize the first letter of sentences and proper nouns.
    3.  **Flow**: Ensure the text flows logically.
    4.  **No Filler**: Remove "um", "uh", "ah".

    **Linguistic Capabilities:**
    1.  **Multilingual**: English, Nepali, Hindi.
    2.  **Code-Switching**: Handle mixed languages gracefully.
    3.  **Translation**: Provide a fluent English translation.
  `;

  const prompt = `
    ${languageContext}

    **Task**:
    1.  **Transcribe** the clear foreground speech.
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
                description: "The professionally formatted transcription. Return 'SILENCE' if only noise/music detected." 
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