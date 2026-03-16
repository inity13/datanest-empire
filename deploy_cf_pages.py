#!/usr/bin/env python3
"""Deploy empire directories to Cloudflare Pages using Direct Upload API.

Usage:
    python3 deploy_cf_pages.py [empire_prefix ...]
    python3 deploy_cf_pages.py                    # Deploy all 5 empires
    python3 deploy_cf_pages.py neonbazaar-stores   # Deploy one empire
"""

import os
import sys
import json
import hashlib
import mimetypes
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import HTTPError
import io

# Load credentials
def load_env():
    env_file = os.path.expanduser("~/.cloudflare.env")
    env = {}
    with open(env_file) as f:
        for line in f:
            line = line.strip()
            if "=" in line and not line.startswith("#"):
                # Handle export FOO=bar and FOO=bar
                if line.startswith("export "):
                    line = line[7:]
                k, v = line.split("=", 1)
                env[k.strip()] = v.strip().strip('"').strip("'")
    return env

env = load_env()
ACCOUNT_ID = env["CLOUDFLARE_ACCOUNT_ID"]
API_TOKEN = env["CLOUDFLARE_API_TOKEN"]
BASE_URL = f"https://api.cloudflare.com/client/v4/accounts/{ACCOUNT_ID}/pages/projects"

DEPLOY_DIR = os.path.dirname(os.path.abspath(__file__))

ALL_EMPIRES = [
    "pixelempire-stores",
    "datanest-stores",
    "codevault-stores",
    "neonbazaar-stores",
    "cryptoforge-stores",
]

def get_content_type(filepath):
    ct, _ = mimetypes.guess_type(filepath)
    return ct or "application/octet-stream"

def create_multipart_body(files_dict, boundary):
    """Create multipart/form-data body manually.
    
    files_dict: {relative_path: absolute_path}
    """
    body = b""
    for rel_path, abs_path in files_dict.items():
        # Ensure path starts with /
        upload_path = "/" + rel_path.lstrip("/")
        ct = get_content_type(abs_path)
        
        with open(abs_path, "rb") as f:
            file_data = f.read()
        
        body += f"--{boundary}\r\n".encode()
        body += f'Content-Disposition: form-data; name="{upload_path}"; filename="{upload_path}"\r\n'.encode()
        body += f"Content-Type: {ct}\r\n\r\n".encode()
        body += file_data
        body += b"\r\n"
    
    body += f"--{boundary}--\r\n".encode()
    return body


def collect_files(empire_dir):
    """Collect all files in empire directory, return {rel_path: abs_path}."""
    files = {}
    base = Path(empire_dir)
    for fpath in sorted(base.rglob("*")):
        if fpath.is_file():
            rel = str(fpath.relative_to(base))
            files[rel] = str(fpath)
    return files


def deploy_empire(project_name, empire_dir):
    """Deploy one empire to Cloudflare Pages using Direct Upload."""
    print(f"\n{'='*60}")
    print(f"Deploying: {project_name}")
    print(f"Source: {empire_dir}")
    
    files = collect_files(empire_dir)
    print(f"Files: {len(files)}")
    
    if not files:
        print("  [SKIP] No files to deploy")
        return False
    
    # Create multipart body
    boundary = "----CFPagesUpload" + hashlib.md5(project_name.encode()).hexdigest()[:16]
    body = create_multipart_body(files, boundary)
    
    print(f"Upload size: {len(body) / 1024:.1f} KB")
    
    url = f"{BASE_URL}/{project_name}/deployments"
    
    req = Request(url, data=body, method="POST")
    req.add_header("Authorization", f"Bearer {API_TOKEN}")
    req.add_header("Content-Type", f"multipart/form-data; boundary={boundary}")
    
    try:
        resp = urlopen(req, timeout=300)
        result = json.loads(resp.read().decode())
        
        if result.get("success"):
            dep = result.get("result", {})
            deploy_url = dep.get("url", "?")
            deploy_id = dep.get("id", "?")[:8]
            print(f"  ✓ Deployed: {deploy_url}")
            print(f"  ✓ ID: {deploy_id}")
            print(f"  ✓ Live at: https://{project_name}.pages.dev/")
            return True
        else:
            errors = result.get("errors", [])
            print(f"  ✗ Deploy failed: {errors}")
            return False
            
    except HTTPError as e:
        error_body = e.read().decode()
        print(f"  ✗ HTTP {e.code}: {error_body[:500]}")
        return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def main():
    empires = sys.argv[1:] if len(sys.argv) > 1 else ALL_EMPIRES
    
    results = {}
    for empire in empires:
        empire_dir = os.path.join(DEPLOY_DIR, empire)
        if not os.path.isdir(empire_dir):
            print(f"[SKIP] Directory not found: {empire_dir}")
            results[empire] = False
            continue
        results[empire] = deploy_empire(empire, empire_dir)
    
    print(f"\n{'='*60}")
    print("DEPLOYMENT RESULTS")
    print(f"{'='*60}")
    for name, ok in results.items():
        status = "✓ SUCCESS" if ok else "✗ FAILED"
        print(f"  {name}: {status}")
    
    succeeded = sum(1 for v in results.values() if v)
    print(f"\n{succeeded}/{len(results)} empires deployed successfully")
    
    return 0 if all(results.values()) else 1


if __name__ == "__main__":
    sys.exit(main())
