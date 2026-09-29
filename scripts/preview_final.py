"""Serve only the generated public site, with its real GitHub Pages base path."""
from http.server import SimpleHTTPRequestHandler,ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
class Handler(SimpleHTTPRequestHandler):
    def __init__(self,*a,**kw):super().__init__(*a,directory=str(ROOT/'docs'),**kw)
    def do_GET(self):
        if self.path=='/':
            self.send_response(302);self.send_header('Location','/Finansiering-2026/');self.end_headers();return
        if self.path.startswith('/Finansiering-2026/'):
            self.path=self.path[len('/Finansiering-2026'):]
        super().do_GET()
print('http://127.0.0.1:8765/Finansiering-2026/',flush=True)
ThreadingHTTPServer(('127.0.0.1',8765),Handler).serve_forever()
