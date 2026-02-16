export const CHAT_UPLOAD_POLICY = {
  maxFilesPerMessage: 5,
  maxFileSizeBytes: 20 * 1024 * 1024,
} as const;

export function validateChatUploadFiles(files: File[]): string | null {
  if (files.length > CHAT_UPLOAD_POLICY.maxFilesPerMessage) {
    return `You can upload up to ${CHAT_UPLOAD_POLICY.maxFilesPerMessage} files per message.`;
  }

  for (const file of files) {
    if (file.size > CHAT_UPLOAD_POLICY.maxFileSizeBytes) {
      return `File "${file.name}" exceeds the 20MB upload limit.`;
    }
  }

  return null;
}
