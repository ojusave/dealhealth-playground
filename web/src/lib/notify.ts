import { notifications } from "@mantine/notifications";
import type { AppError } from "./api";

export function notifyError(error: AppError): void {
  const message = [error.message, error.hint].filter(Boolean).join(" ");
  notifications.show({
    title: error.title,
    message,
    color: "red",
    autoClose: 9000,
  });
}

export function notifyRateLimit(message: string, hint?: string): void {
  notifications.show({
    title: "Rate limit reached",
    message: [message, hint].filter(Boolean).join(" "),
    color: "yellow",
    autoClose: false,
  });
}
