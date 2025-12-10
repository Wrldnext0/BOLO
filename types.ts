export enum ViewState {
  CONSOLE = 'CONSOLE',
  EDITOR = 'EDITOR',
  HISTORY = 'HISTORY',
  SETTINGS = 'SETTINGS',
}

export enum SupportedLanguage {
  AUTO = 'Auto-Detect',
  ENGLISH = 'English',
  HINDI = 'Hindi',
  NEPALI = 'Nepali',
}

export interface TranscriptionRecord {
  id: string;
  originalText: string;
  translatedText?: string;
  detectedLanguage: string;
  timestamp: number;
}

export interface AppSettings {
  language: SupportedLanguage;
  handsFreeMode: boolean; // Combined "Auto-Paste" and "VAD"
}