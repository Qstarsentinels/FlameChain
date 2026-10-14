import os
import json
import subprocess
import time

class TermuxMetrics:
    @staticmethod
    def get_mem_available_mb() -> float:
        try:
            with open('/proc/meminfo', 'r') as f:
                for line in f:
                    if 'MemAvailable:' in line:
                        return float(line.split()[1]) / 1024.0
            return 512.0
        except Exception:
            return 512.0

    @staticmethod
    def get_power_sample() -> dict:
        sample = {
            "timestamp": time.time(),
            "percentage": 100,
            "voltage_mv": 3800.0,
            "current_ma": 500.0,
            "power_watts": 1.90
        }
        try:
            res = subprocess.run(["termux-battery-status"], capture_output=True, text=True, timeout=2)
            if res.returncode == 0:
                data = json.loads(res.stdout)
                sample["percentage"] = data.get("percentage", 100)
                sample["voltage_mv"] = float(data.get("voltage", 3800))
                curr = abs(float(data.get("current", 500)))
                sample["current_ma"] = curr / 1000.0 if curr > 10000 else curr
        except Exception:
            pass

        sample["power_watts"] = (sample["voltage_mv"] / 1000.0) * (sample["current_ma"] / 1000.0)
        return sample
