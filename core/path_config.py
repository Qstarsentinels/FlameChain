#!/usr/bin/env python3
import os, sys, importlib
from pathlib import Path

class UniversalPathResolver:
    USER_HOME = Path(os.path.expanduser("~")).resolve()
    FLAME_ROOT = USER_HOME / ".flamechain"
    NODE_ROOT = USER_HOME / "flamechain_node"
    CORE_DIR = FLAME_ROOT / "core"
    CONFIG_DIR = FLAME_ROOT / "config"
    DATA_DIR = FLAME_ROOT / "data"
    LOG_DIR = FLAME_ROOT / "logs"
    SHARD_DIR = FLAME_ROOT / "shards"
    SQI_CLOUD_DIR = FLAME_ROOT / "sqi_cloud"
    SQC_CLOUD_DIR = FLAME_ROOT / "sqc_cloud"

    @classmethod
    def get_search_paths(cls):
        return [
            str(cls.CORE_DIR), str(cls.SQI_CLOUD_DIR), str(cls.SQC_CLOUD_DIR),
            str(cls.FLAME_ROOT), str(cls.NODE_ROOT / "core"), str(cls.NODE_ROOT)
        ]

    @classmethod
    def initialize_workspace(cls):
        for path in [cls.FLAME_ROOT, cls.NODE_ROOT, cls.CORE_DIR, cls.CONFIG_DIR,
                     cls.DATA_DIR, cls.LOG_DIR, cls.SHARD_DIR, cls.SQI_CLOUD_DIR]:
            path.mkdir(parents=True, exist_ok=True)
            if path in [cls.CORE_DIR, cls.SQI_CLOUD_DIR]:
                (path / "__init__.py").touch(exist_ok=True)

        if not cls.SQC_CLOUD_DIR.exists() and not cls.SQC_CLOUD_DIR.is_symlink():
            try:
                cls.SQC_CLOUD_DIR.symlink_to(cls.SQI_CLOUD_DIR, target_is_directory=True)
            except Exception:
                pass

    @classmethod
    def inject_sys_paths(cls):
        cls.initialize_workspace()
        for path_str in cls.get_search_paths():
            if os.path.exists(path_str) and path_str not in sys.path:
                sys.path.insert(0, path_str)

UniversalPathResolver.inject_sys_paths()
