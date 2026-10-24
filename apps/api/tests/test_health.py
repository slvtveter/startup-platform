async def test_health(client):
    resp = await client.get("/api/health")
    assert resp.status_code == 200
    assert resp.json() == {"status": "ok", "db": "ok"}
    assert resp.headers["x-request-id"]


async def test_error_format_404(client):
    resp = await client.get("/api/startups/nope")
    assert resp.status_code == 404
    assert resp.json()["error"]["code"] == "not_found"


async def test_error_format_422(client):
    resp = await client.post("/api/auth/register", json={"email": "bad", "password": "1"})
    assert resp.status_code == 422
    body = resp.json()["error"]
    assert body["code"] == "validation_error"
    assert {d["field"] for d in body["details"]} == {"email", "password"}


async def test_origin_check_blocks_foreign_site(client):
    resp = await client.post(
        "/api/auth/login",
        json={"email": "a@b.ru", "password": "x"},
        headers={"origin": "https://evil.example"},
    )
    assert resp.status_code == 403
