type ApiErrorBody = { error?: { code?: string; message?: string; details?: unknown } };

/** Сообщение для пользователя из единого формата ошибок API. */
export function errorMessage(error: unknown, fallback = "Что-то пошло не так. Попробуй ещё раз.") {
  const body = error as ApiErrorBody | undefined;
  const message = body?.error?.message ?? fallback;
  const details = body?.error?.details;
  if (Array.isArray(details) && details.every((d) => typeof d === "string") && details.length) {
    return `${message}: ${details.join(", ").toLowerCase()}`;
  }
  return message;
}

/** Ошибки валидации по полям: { email: "..." }. */
export function fieldErrors(error: unknown): Record<string, string> {
  const details = (error as ApiErrorBody | undefined)?.error?.details;
  if (!Array.isArray(details)) return {};
  const out: Record<string, string> = {};
  for (const d of details) {
    if (d && typeof d === "object" && "field" in d && "message" in d) {
      out[String((d as { field: string }).field)] = String((d as { message: string }).message);
    }
  }
  return out;
}

/** Код ошибки API (error.code), например "publication_consent_required". */
export function apiCode(error: unknown) {
  return (error as { error?: { code?: string } } | undefined)?.error?.code;
}
