import { z } from "zod";

const ALLOWED_ATTACHMENT_HOST_SUFFIXES = [
  "stream-io-api.com",
  "stream-io-cdn.com",
  "getstream.io",
] as const;

const hasAllowedAttachmentHost = (url: string): boolean => {
  let host: string;
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    return false;
  }

  return ALLOWED_ATTACHMENT_HOST_SUFFIXES.some(
    (suffix) => host === suffix || host.endsWith(`.${suffix}`),
  );
};

export const ChatMessageAttachmentSchema = z
  .object({
    type: z.string().min(1).max(50).optional(),
    asset_url: z.string().url().max(2000).optional(),
    image_url: z.string().url().max(2000).optional(),
    thumb_url: z.string().url().max(2000).optional(),
    title: z.string().max(255).optional(),
    file_size: z
      .number()
      .int()
      .positive()
      .max(20 * 1024 * 1024)
      .optional(),
    mime_type: z.string().max(255).optional(),
  })
  .superRefine((attachment, refinementCtx) => {
    const urlFields = [
      { key: "asset_url", value: attachment.asset_url },
      { key: "image_url", value: attachment.image_url },
      { key: "thumb_url", value: attachment.thumb_url },
    ] as const;

    for (const field of urlFields) {
      if (!field.value) {
        continue;
      }

      if (!hasAllowedAttachmentHost(field.value)) {
        refinementCtx.addIssue({
          code: z.ZodIssueCode.custom,
          path: [field.key],
          message: "Attachment URL must use an approved chat file host",
        });
      }
    }
  });

export const SendChatMessageSchema = z
  .object({
    text: z.string().trim().min(1).max(5000).optional(),
    attachments: z.array(ChatMessageAttachmentSchema).max(5).optional(),
  })
  .refine(
    (value) => {
      const hasText = typeof value.text === "string" && value.text.length > 0;
      const hasAttachments =
        Array.isArray(value.attachments) && value.attachments.length > 0;
      return hasText || hasAttachments;
    },
    {
      message: "Message must include text or at least one attachment",
      path: ["text"],
    },
  );

export type SendChatMessageInput = z.infer<typeof SendChatMessageSchema>;
