from http.server import HTTPServer, SimpleHTTPRequestHandler
import json
import os
import socket
import urllib.parse

PORT = 3000
DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')

if not os.path.exists(DATA_DIR):
    os.makedirs(DATA_DIR)

def get_local_ip():
    s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        s.connect(('8.8.8.8', 80))
        ip = s.getsockname()[0]
    except Exception:
        ip = '127.0.0.1'
    finally:
        s.close()
    return ip

class CustomHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        parsed_url = urllib.parse.urlparse(self.path)
        pathname = parsed_url.path
        query = urllib.parse.parse_qs(parsed_url.query)

        if pathname == '/api/ip':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'ip': get_local_ip(), 'port': PORT}).encode('utf-8'))
            return

        if pathname == '/api/data':
            data_type = query.get('type', [None])[0]
            if data_type not in ['sites', 'reports', 'purchases']:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Invalid data type'}).encode('utf-8'))
                return

            file_path = os.path.join(DATA_DIR, f'{data_type}.json')
            if not os.path.exists(file_path):
                self.send_response(200)
                self.send_header('Content-Type', 'application/json; charset=utf-8')
                self.end_headers()
                self.wfile.write(b'[]')
                return

            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            with open(file_path, 'r', encoding='utf-8') as f:
                self.wfile.write(f.read().encode('utf-8'))
            return

        # デフォルトファイル処理
        if pathname == '/':
            self.path = '/ledger_manager.html'
        super().do_GET()

    def do_POST(self):
        parsed_url = urllib.parse.urlparse(self.path)
        pathname = parsed_url.path

        if pathname == '/api/data':
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length).decode('utf-8')
            try:
                payload = json.loads(post_data)
                data_type = payload.get('type')
                data_list = payload.get('data')

                if data_type not in ['sites', 'reports', 'purchases'] or not isinstance(data_list, list):
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.end_headers()
                    self.wfile.write(json.dumps({'error': 'Invalid payload'}).encode('utf-8'))
                    return

                file_path = os.path.join(DATA_DIR, f'{data_type}.json')
                with open(file_path, 'w', encoding='utf-8') as f:
                    json.dump(data_list, f, indent=2, ensure_ascii=False)

                self.send_response(200)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'success': True}).encode('utf-8'))
            except Exception as e:
                self.send_response(400)
                self.send_header('Content-Type', 'application/json')
                self.end_headers()
                self.wfile.write(json.dumps({'error': str(e)}).encode('utf-8'))
            return

        self.send_response(404)
        self.end_headers()

if __name__ == '__main__':
    # 親機のカレントディレクトリを作業ディレクトリに合わせる
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    server = HTTPServer(('0.0.0.0', PORT), CustomHandler)
    print('===================================================')
    print(' 業務日報・現場台帳 社内LAN共有サーバー(Python版)起動完了')
    print('===================================================')
    print(f' 親機IPアドレス: http://{get_local_ip()}:{PORT}')
    print(f' このPC（親機）: http://localhost:{PORT}')
    print('===================================================')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\nServer stopped.')
