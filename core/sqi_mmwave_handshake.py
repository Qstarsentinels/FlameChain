#!/usr/bin/env python3
import hashlib, hmac, math, time, os
from typing import Dict

class BiometricStateHandshake:
    def __init__(self, node_secret: str = None):
        self.node_secret = (node_secret or os.getenv("SQI_SECRET_KEY", "SQI_QUANTUM_DEF_SECRET_2026")).encode('utf-8')
        self.wavelength_mm = float(os.getenv("MMWAVE_WAVELENGTH_MM", "12.0"))

    def generate_handshake_token(self, device_id: str, distance_mm: float, doppler_hz: float, ppg_intervals: list, hr_bpm: float) -> Dict[str, str]:
        if distance_mm > self.wavelength_mm or not (0.5 <= abs(doppler_hz) <= 4.0):
            raise PermissionError("12mm mmWave Signal out of physical envelope bounds.")
        diffs = [(ppg_intervals[i+1] - ppg_intervals[i])**2 for i in range(len(ppg_intervals) - 1)]
        rmssd = math.sqrt(sum(diffs) / len(diffs)) if diffs else 0.0
        timestamp = str(int(time.time()))
        payload = f"{device_id}:{distance_mm}:{rmssd}:{timestamp}"
        sig = hmac.new(self.node_secret, payload.encode('utf-8'), hashlib.sha256).hexdigest()
        return {"device_id": device_id, "status": "AUTHENTICATED", "handshake_ticket": sig, "timestamp": timestamp}
