#!/usr/bin/env python3
"""
FlameChain Absolute Path Enforcement Engine
Bootstraps sys.path, environment variables, package markers, and workspace directories.
"""

import os
import sys
import stat
from pathlib import Path
from typing import Dict, Tuple, List

def enforce_paths(root_override: str = None) -> str:
    """
    Guarantees absolute canonical workspace paths, seeds package __init__.py markers,
    prepends flame_root and core_path to sys.path, and configures environment variables.
    Returns the absolute flame_root path string.
    """
    if root_override:
        flame_root = os.path.abspath(root_override)
    else:
        flame_root = os.path.abspath(os.getenv("FLAME_ROOT", os.path.expanduser("~/.flamechain")))

    # 1. Enforce top-level flame_root in sys.path
    if flame_root not in sys.path:
        sys.path.insert(0, flame_root)

    # 2. Enforce core_path in sys.path
    core_path = os.path.join(flame_root, "core")
    if core_path not in sys.path:
        sys.path.insert(0, core_path)

    root_dir = Path(flame_root).resolve()

    subdirectories = [
        "config",
        "core",
        "shards",
        "data",
        "checkpoints",
        "telemetry",
        "logs",
        "ipc"
    ]

    # Ensure workspace root exists
    root_dir.mkdir(parents=True, exist_ok=True)

    # Ensure all required subdirectories exist with 0700 permissions
    for sub in subdirectories:
        dir_path = root_dir / sub
        dir_path.mkdir(parents=True, exist_ok=True)
        try:
            os.chmod(dir_path, stat.S_IRWXU)
        except Exception:
            pass  # Guard for non-POSIX Android mounts

    # Seed Python package initialization markers
    for pkg in ("core", "shards", "telemetry"):
        init_file = root_dir / pkg / "__init__.py"
        if not init_file.exists():
            init_file.touch(mode=0o600, exist_ok=True)

    # Export canonical environment variables
    os.environ["FLAME_ROOT"] = flame_root
    os.environ["FLAME_CORE"] = core_path
    os.environ["PYTHONPATH"] = f"{flame_root}:{core_path}:" + os.environ.get("PYTHONPATH", "")

    return flame_root


class PathEnforcer:
    """Enforces spatial file system requirements for the FlameChain runtime."""

    def __init__(self, root_override: str = None):
        self.root_path_str = enforce_paths(root_override=root_override)
        self.root_path = Path(self.root_path_str)

    def enforce_workspace_integrity(self) -> Dict[str, str]:
        subdirectories = ["config", "core", "shards", "data", "checkpoints", "telemetry", "logs", "ipc"]
        manifest = {"root": str(self.root_path)}
        for sub in subdirectories:
            manifest[sub] = str(self.root_path / sub)
        return manifest

    def verify_paths_writable(self) -> Tuple[bool, List[str]]:
        failing_paths = []
        subdirectories = ["config", "core", "shards", "data", "checkpoints", "telemetry", "logs", "ipc"]
        for sub_dir in subdirectories:
            target = self.root_path / sub_dir
            test_file = target / ".write_test"
            try:
                test_file.touch()
                test_file.unlink()
            except Exception as err:
                failing_paths.append(f"{target}: {err}")

        return len(failing_paths) == 0, failing_paths


if __name__ == "__main__":
    root = enforce_paths()
    print(f"[✓] Path Enforcer Active. Root bound to: {root}")
