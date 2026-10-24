// После прогона удаляем пользователей *@e2e.example.com и всё, что они создали:
// иначе тестовые стартапы попадают в витрину локального стенда (KAN-87).
export default async function globalTeardown() {
  // Против prod-стека чистить нечего (там эндпоинт отвечает 404).
  if (process.env.PROD_CHECK) return;
  const base = process.env.E2E_BASE_URL ?? "http://localhost:8080";
  try {
    const res = await fetch(`${base}/api/testing/cleanup-e2e`, { method: "POST" });
    if (!res.ok) console.warn(`E2E cleanup: HTTP ${res.status}`);
  } catch (e) {
    console.warn("E2E cleanup failed", e);
  }
}
