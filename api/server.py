from __future__ import annotations

from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
import json
from urllib.parse import urlparse

from core.engine import KickAIEngine
from core.limitations import LIMITATION_STRATEGIES
from core.redteam import run_red_team
from core.world import simulated_attacking_third


ENGINE = KickAIEngine()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, format, *args) -> None:  # noqa: A003
        return

    def _json(self, code: int, payload: dict) -> None:
        raw = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(raw)))
        self.end_headers()
        self.wfile.write(raw)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path in ("/", "/health"):
            self._json(200, {"service": "kickai-core", "ok": True})
            return
        if path == "/v1/lab":
            self._json(200, ENGINE.lab())
            return
        if path == "/v1/redteam":
            self._json(200, run_red_team())
            return
        if path == "/v1/limitations":
            self._json(200, LIMITATION_STRATEGIES)
            return
        self._json(404, {"error": "not found"})

    def do_POST(self) -> None:  # noqa: N802
        length = int(self.headers.get("Content-Length", "0"))
        body = json.loads(self.rfile.read(length) or b"{}")
        path = urlparse(self.path).path
        if path == "/v1/analyze":
            seed = int(body.get("seed", 7))
            family = str(body.get("family", "balanced"))
            state = simulated_attacking_third(seed)
            payload = ENGINE.analyze_state(state, family=family)
            payload["note"] = "POST /v1/analyze currently uses the labeled SIMULATED world unless tracking is supplied by a client."
            self._json(200, payload)
            return
        self._json(404, {"error": "not found"})


def main(host: str = "127.0.0.1", port: int = 8765) -> None:
    server = ThreadingHTTPServer((host, port), Handler)
    print(f"KICKAI API http://{host}:{port}")
    server.serve_forever()


if __name__ == "__main__":
    main()
