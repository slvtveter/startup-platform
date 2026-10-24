// После прогона удаляем пользователей *@e2e.example.com и всё, что они создали:
// иначе тестовые стартапы попадают в витрину локального стенда (KAN-87).
export default async function globalTeardown() {
  const base = process.env.E2E_BASE_URL ?? "http://localhost:8080";
  const res = await fetch(`${base}/api/testing/cleanup-e2e`, { method: "POST" });
  if (!res.ok) console.warn(`E2E cleanup: HTTP ${res.status}`);
}
