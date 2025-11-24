export interface AdminConfig {
  systemInstruction: string;
  voiceName: string;
}

export enum VoiceName {
  Puck = 'Puck',
  Charon = 'Charon',
  Kore = 'Kore',
  Fenrir = 'Fenrir',
  Zephyr = 'Zephyr',
}

export interface TranscriptionItem {
  text: string;
  sender: 'user' | 'model';
  timestamp: number;
}
