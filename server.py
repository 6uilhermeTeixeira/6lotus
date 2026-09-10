from __future__ import annotations

import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class LandingPageHandler(SimpleHTTPRequestHandler):
    """Serve static assets and send obsolete application routes to the landing page."""

    def _should_redirect(self) -> bool:
        request_path = unquote(urlsplit(self.path).path)
        if request_path == "/" or Path(request_path).suffix:
            return False
        return not os.path.exists(self.translate_path(request_path))

    def _redirect_to_landing(self) -> None:
        self.send_response(302)
        self.send_header("Location", "/")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()

    def do_GET(self) -> None:  # noqa: N802
        if self._should_redirect():
            self._redirect_to_landing()
            return
        super().do_GET()

    def do_HEAD(self) -> None:  # noqa: N802
        if self._should_redirect():
            self._redirect_to_landing()
            return
        super().do_HEAD()


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 1113), LandingPageHandler).serve_forever()
