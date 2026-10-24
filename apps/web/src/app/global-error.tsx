"use client";

/**
 * Падение корневого layout (KAN-108): globals.css и шрифты здесь недоступны,
 * поэтому стили inline в токенах дизайн-системы и без внешних ресурсов.
 */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ru">
      <body style={{ margin: 0, background: "#ffffff", color: "#121633", fontFamily: "system-ui, sans-serif" }}>
        <main style={{ maxWidth: 560, margin: "0 auto", padding: "96px 16px" }}>
          <h1 style={{ fontSize: 32, lineHeight: 1.2, margin: 0 }}>Сайт споткнулся</h1>
          <p style={{ marginTop: 12, fontSize: 18, color: "#565b77" }}>
            Мы уже видим ошибку в логах. Попробуйте ещё раз — обычно этого хватает.
          </p>
          <button
            type="button"
            onClick={reset}
            style={{ marginTop: 24, padding: "12px 20px", border: 0, borderRadius: 12, background: "#3d3df5", color: "#ffffff", fontSize: 16, fontWeight: 600, cursor: "pointer" }}
          >
            Обновить страницу
          </button>
        </main>
      </body>
    </html>
  );
}
