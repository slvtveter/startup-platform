import { expect, test } from "@playwright/test";

for (const path of ["/", "/startups", "/people", "/login", "/register", "/robots.txt", "/sitemap.xml"]) {
  test(`smoke ${path}`, async ({ request }) => {
    const res = await request.get(path);
    expect(res.status()).toBe(200);
  });
}

test("unknown page is 404", async ({ request }) => {
  expect((await request.get("/no-such-page")).status()).toBe(404);
});

test("api health through proxy", async ({ request }) => {
  expect(await (await request.get("/api/health")).json()).toEqual({ status: "ok", db: "ok" });
});
