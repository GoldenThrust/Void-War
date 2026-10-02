"""
Export a trained SB3 PPO actor to ONNX.

The exported model contains ONLY the actor/action network.
The value network is used during training but is not required
by the frontend.

Usage:

    python scripts/export_onnx.py \
        --load models/nav_ppo.zip \
        --out web/nav_policy.onnx \
        --obs-dim 5
"""

import argparse
import os
import sys

import numpy as np
import torch
import torch.nn as nn
from stable_baselines3 import PPO, SAC

# Allow importing project modules from the project root
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


class PPOActor(nn.Module):
    def __init__(self, policy):
        super().__init__()
        self.policy = policy

    def forward(self, self_obs, enemy_obs):

        obs = {
            "self": self_obs,
            "enemies": enemy_obs,
        }

        features = self.policy.extract_features(obs)

        latent_pi, _ = self.policy.mlp_extractor(features)

        mean_actions = self.policy.action_net(latent_pi)

        # deterministic PPO action
        return torch.tanh(mean_actions)


class SACActor(nn.Module):
    def __init__(self, actor):
        super().__init__()
        self.actor = actor

    def forward(self, self_obs, enemy_obs):

        obs = {
            "self": self_obs,
            "enemies": enemy_obs,
        }

        return self.actor(obs).mean


def export(load_path: str, out_path: str, type: str):
    # --------------------------------------------------
    # Load trained PPO model
    # --------------------------------------------------

    model = (
        PPO.load(
            load_path,
            device="cpu",
        )
        if type == "ppo"
        else SAC.load(load_path, device="cpu")
    )

    model.policy.eval()
    if type == "ppo":

        actor = PPOActor(model.policy)
        actor.eval()

        print("PPO exported successfully.")
    
    else:
        actor = SACActor(model.policy.actor)
        actor.eval()

    dummy_self = torch.zeros(1, 4, dtype=torch.float32)
    dummy_enemy = torch.zeros(1, 4, dtype=torch.float32)

    torch.onnx.export(
        actor,
        (dummy_self, dummy_enemy),
        out_path,
        input_names=[
            "self_obs",
            "enemy_obs",
        ],
        output_names=[
            "action",
        ],
        opset_version=17,
        external_data=False
    )

    print("Model exported successfully.")

    import onnxruntime as ort

    self_obs = np.random.uniform(0, 1, (2, 4)).astype(np.float32)
    enemy_obs = np.random.uniform(0, 1, (2, 4)).astype(np.float32)

    # PyTorch output
    with torch.no_grad():

        torch_logits = actor(
            torch.from_numpy(self_obs),
            torch.from_numpy(enemy_obs),
        ).numpy()

    # ONNX output
    session = ort.InferenceSession(
        out_path,
        providers=["CPUExecutionProvider"],
    )

    onnx_logits = session.run(
        None,
        {
            "self_obs": self_obs,
            "enemy_obs": enemy_obs,
        },
    )[0]

    # Compare outputs
    max_diff = np.abs(torch_logits - onnx_logits).max()

    print(f"Max abs difference: {max_diff:.2e}")

    assert max_diff < 1e-4, "ONNX export mismatch. " "Do not ship this model."

    print("PyTorch/ONNX parity check passed.")


if __name__ == "__main__":

    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--load",
        type=str,
        default="models/best_model/ppo/best_model.zip",
    )

    parser.add_argument(
        "--out",
        type=str,
        default="web/nav_policy.onnx",
    )

    parser.add_argument(
        "--type",
        type=str,
        default="ppo",
    )

    args = parser.parse_args()

    export(
        args.load,
        args.out,
        args.type
    )
