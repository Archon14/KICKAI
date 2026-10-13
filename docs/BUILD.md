# Build and run

## Streamlit (current product)

Run from the `PROJEKT` folder (the KICKAI app root):

```bash
cd PROJEKT
python -m pip install -r requirements.txt
streamlit run app.py
```

Windows: `powershell -File PROJEKT/scripts/run_web.ps1`

## API

```bash
cd PROJEKT
python -m api.server
```

Health: `http://127.0.0.1:8765/health`

## Tests

```bash
cd PROJEKT
python -m unittest tests.test_core
```

## Windows EXE (not claimed complete)

Requires a working local venv with dependencies, then PyInstaller:

```bash
pip install pyinstaller
pyinstaller --noconfirm --onefile --name kickai-api api/server.py
```

The Streamlit UI is not a single-file GUI. Preferred shape: API exe + browser/Tauri shell.

## Android APK (not claimed complete)

The APK must be a client of `kickai-core` HTTP. There is no independent football engine in Android.

Suggested path: Kotlin app posting video to `/v1/analyze` once a real job endpoint exists. No APK is generated in this repository until Android SDK + signing are available.

## Linux

Same Python API + Streamlit, or a Tauri shell loading `http://127.0.0.1:8501`.
