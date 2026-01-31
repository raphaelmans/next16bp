import { openai } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";

export const ScreenshotExtractionSchema = z.object({
  calendarTitle: z.string().optional(),
  month: z.number().int().min(1).max(12),
  year: z.number().int().min(2000).max(2100),
  timeZone: z.string().optional(),
  events: z.array(
    z.object({
      day: z.number().int().min(1).max(31),
      startTime: z.string().min(1),
      title: z.string().optional(),
      resourceLabel: z.string().optional(),
    }),
  ),
});

export type ScreenshotExtraction = z.infer<typeof ScreenshotExtractionSchema>;

const DEFAULT_SCREENSHOT_MODEL = "gpt-5.2";

const buildScreenshotPrompt = () =>
  [
    "Extract booking entries from this calendar screenshot.",
    "Return the month (number) and year shown in the header.",
    "Only include events that belong to the displayed month; ignore leading/trailing days from adjacent months.",
    "Each event needs: day (number), startTime (HH:mm, 24h), and optional title.",
    "If the screenshot does not show a court/resource label, omit resourceLabel.",
    "Use only the visible events in the screenshot.",
    "If you cannot read a time clearly, omit that event.",
  ].join(" ");

export async function extractScreenshotBookings(params: {
  imageBuffer: Buffer;
  model?: string;
}): Promise<ScreenshotExtraction> {
  const { imageBuffer, model = DEFAULT_SCREENSHOT_MODEL } = params;

  const { object } = await generateObject({
    model: openai(model),
    schema: ScreenshotExtractionSchema,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildScreenshotPrompt(),
          },
          {
            type: "image",
            image: imageBuffer,
            providerOptions: { openai: { imageDetail: "low" } },
          },
        ],
      },
    ],
  });

  return object;
}

export const SCREENSHOT_MODEL_DEFAULT = DEFAULT_SCREENSHOT_MODEL;
