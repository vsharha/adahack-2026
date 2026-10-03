# /// script
# dependencies = ["numpy", "pandas", "pyproj", "shapely", "pyarrow"]
# ///
"""Serve the isolated map app and refresh only its own data snapshot."""

import json
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Lock

from export_data import export

ROOT = Path(__file__).resolve().parent
REFRESH_LOCK = Lock()


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == "/api/refresh":
            try:
                with REFRESH_LOCK:
                    counts = export()
                content = json.dumps(counts).encode()
                self.send_response(200)
                self.send_header("Content-Type", "application/json")
                self.send_header("Content-Length", str(len(content)))
                self.end_headers()
                self.wfile.write(content)
            except (OSError, ValueError, KeyError) as exc:
                self.send_error(500, str(exc))
            return
        if self.path.startswith("/api/data"):
            content = (ROOT / "data/snapshot.json.gz").read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Encoding", "gzip")
            self.send_header("Content-Length", str(len(content)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(content)
            return
        super().do_GET()


if __name__ == "__main__":
    if not (ROOT / "data/snapshot.json.gz").exists():
        export()
    print("PeatPulse map: http://127.0.0.1:8766", flush=True)
    ThreadingHTTPServer(
        ("127.0.0.1", 8766), partial(Handler, directory=str(ROOT))
    ).serve_forever()
