import { zfd } from "zod-form-data";
import { z } from "zod";

// Ideally this code would just be generated from proto
export const createCounterSchema = zfd.formData({
  title: zfd.text(z.string().min(5, "Too short").max(50, "Too long")),
  eventTitle: zfd.text(z.string().min(5, "Too short").max(50, "Too long")),
});

export const incrementCounterSchema = zfd.formData({
  id: zfd.text(z.string().min(5, "Too short").max(50, "Too long")),
  title: zfd.text(z.string().min(5, "Too short").max(50, "Too long")),
});
