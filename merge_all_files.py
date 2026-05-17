import os

PROJECT_DIR = "."   # current project folder
OUTPUT_FILE = "FULL_PROJECT_IN_ONE_FILE.txt"

# Ignore useless folders
IGNORE_FOLDERS = {
    "venv",
    "__pycache__",
    ".git",
    "node_modules",
    ".vscode",
    "dist",
    "build"
}

# Ignore output file itself
IGNORE_FILES = {OUTPUT_FILE}

def is_ignored(path):
    parts = path.split(os.sep)
    return any(folder in IGNORE_FOLDERS for folder in parts)

with open(OUTPUT_FILE, "w", encoding="utf-8") as out:
    for root, dirs, files in os.walk(PROJECT_DIR):
        dirs[:] = [d for d in dirs if d not in IGNORE_FOLDERS]

        for file in files:
            if file in IGNORE_FILES:
                continue

            filepath = os.path.join(root, file)

            if is_ignored(filepath):
                continue

            rel_path = os.path.relpath(filepath, PROJECT_DIR)

            out.write("\n" + "=" * 80 + "\n")
            out.write(f"FILE: {rel_path}\n")
            out.write("=" * 80 + "\n\n")

            try:
                with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                    out.write(f.read())
            except Exception as e:
                out.write(f"[Could not read file: {e}]")

            out.write("\n\n")

print(f"✅ Done! All files merged into: {OUTPUT_FILE}")