declare module 'expo-file-system' {
  export const documentDirectory: string | null;

  export const EncodingType: {
    UTF8: string;
    Base64: string;
  };

  export function getInfoAsync(
    fileUri: string
  ): Promise<{ exists: boolean; size?: number; uri?: string }>;

  export function makeDirectoryAsync(
    fileUri: string,
    options?: { intermediates?: boolean }
  ): Promise<void>;

  export function writeAsStringAsync(
    fileUri: string,
    contents: string,
    options?: { encoding?: string }
  ): Promise<void>;

  export function readAsStringAsync(
    fileUri: string,
    options?: { encoding?: string }
  ): Promise<string>;

  export function deleteAsync(
    fileUri: string,
    options?: { idempotent?: boolean }
  ): Promise<void>;
}

declare module 'expo-file-system/legacy' {
  export * from 'expo-file-system';
}
