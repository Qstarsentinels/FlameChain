#!/usr/bin/env python3
import random, math
from typing import Tuple, List

class TorusFHE:
    TORUS_MODULUS = 2**32
    def __init__(self, key_size: int = 256, noise_dev: float = 1e-5):
        self.key_size = key_size
        self.noise_dev = noise_dev
        self.secret_key = [random.choice([0, 1]) for _ in range(self.key_size)]

    def encrypt_torus_sample(self, message_bit: int) -> Tuple[List[int], int]:
        phase = int((0.125 if message_bit == 0 else 0.625) * self.TORUS_MODULUS)
        a = [random.randint(0, self.TORUS_MODULUS - 1) for _ in range(self.key_size)]
        dot = sum(x * y for x, y in zip(a, self.secret_key)) % self.TORUS_MODULUS
        b = (dot + phase + int(random.gauss(0, self.noise_dev) * self.TORUS_MODULUS)) % self.TORUS_MODULUS
        return (a, b)

    def decrypt_torus_sample(self, ct: Tuple[List[int], int]) -> int:
        a, b = ct
        dot = sum(x * y for x, y in zip(a, self.secret_key)) % self.TORUS_MODULUS
        phase = (b - dot) % self.TORUS_MODULUS
        return 1 if 0.375 <= (phase / self.TORUS_MODULUS) < 0.875 else 0

    def homomorphic_add(self, ct1: Tuple[List[int], int], ct2: Tuple[List[int], int]) -> Tuple[List[int], int]:
        a1, b1 = ct1
        a2, b2 = ct2
        return ([(x + y) % self.TORUS_MODULUS for x, y in zip(a1, a2)], (b1 + b2) % self.TORUS_MODULUS)
