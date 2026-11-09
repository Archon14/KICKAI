#!/usr/bin/env python3
"""KickAI Start Script — Launches backend (port 8000) and frontend (port 3000)."""
import subprocess, os, sys, time, platform

PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
BACKEND_DIR = os.path.join(PROJECT_ROOT, "backend")
FRONTEND_DIR = os.path.join(PROJECT_ROOT, "frontend")
VENV_BIN = os.path.join(PROJECT_ROOT, "venv", "bin")
BACKEND_LOG = "/tmp/kickai_backend.log"
FRONTEND_LOG = "/tmp/kickai_frontend.log"
PID_FILE = "/tmp/kickai_pids.txt"


def log(msg):
    print(f"[KickAI] {msg}", flush=True)


def find_uvicorn():
    """Locate uvicorn executable: prefer project venv, then backend venv, then PATH."""
    candidates = [
        os.path.join(VENV_BIN, "uvicorn"),
        os.path.join(BACKEND_DIR, "venv", "bin", "uvicorn"),
    ]
    for c in candidates:
        if os.path.exists(c) and os.access(c, os.X_OK):
            return c
    # Fall back to system PATH
    from shutil import which
    w = which("uvicorn")
    if w:
        return w
    return None


def main():
    log("Starting KickAI pipeline...")

    # ── Backend ──────────────────────────────────────────────────────
    uvicorn_bin = find_uvicorn()
    if not uvicorn_bin:
        log("ERROR: uvicorn not found. Install backend deps:")
        log(f"  {sys.executable} -m pip install -r {os.path.join(BACKEND_DIR, 'requirements.txt')}")
        sys.exit(1)

    backend_log = open(BACKEND_LOG, "w")
    backend = subprocess.Popen(
        [uvicorn_bin, "main:app", "--host", "127.0.0.1", "--port", "8000"],
        cwd=BACKEND_DIR,
        stdout=backend_log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    log(f"Backend  -> PID {backend.pid}  http://localhost:8000/health  (log: {BACKEND_LOG})")

    # ── Frontend ────────────────────────────────────────────────────
    npm = "npm.cmd" if platform.system() == "Windows" else "npm"
    frontend_log = open(FRONTEND_LOG, "w")
    frontend = subprocess.Popen(
        [npm, "run", "dev", "--", "--hostname", "0.0.0.0"],
        cwd=FRONTEND_DIR,
        stdout=frontend_log,
        stderr=subprocess.STDOUT,
        start_new_session=True,
    )
    log(f"Frontend -> PID {frontend.pid}  http://localhost:3000/face   (log: {FRONTEND_LOG})")

    # Persist PIDs for down.py
    with open(PID_FILE, "w") as f:
        f.write(f"{backend.pid}\n{frontend.pid}\n")

    # ── Health check ────────────────────────────────────────────────
    log("Waiting for services to come up...")
    import urllib.request
    ok = False
    for attempt in range(15):
        time.sleep(1)
        try:
            with urllib.request.urlopen("http://localhost:8000/health", timeout=2) as resp:
                log(f"Backend health OK ({resp.status})")
                ok = True
                break
        except Exception:
            continue

    if not ok:
        log("Backend did not respond in time — check " + BACKEND_LOG)

    log("")
    log("=" * 52)
    log("  KickAI is running")
    log("  Backend   : http://localhost:8000")
    log("  Frontend  : http://localhost:3000/face")
    log("  Stop with : python down.py")
    log("=" * 52)

    # Keep alive so Ctrl+C also stops children
    try:
        while backend.poll() is None and frontend.poll() is None:
            time.sleep(1)
    except KeyboardInterrupt:
        log("\nInterrupted — stopping services...")
        try:
            os.killpg(os.getpgid(backend.pid), 15)
            os.killpg(os.getpgid(frontend.pid), 15)
        except Exception:
            pass


if __name__ == "__main__":
    main()
