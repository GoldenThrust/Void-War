import time

import numpy
from stable_baselines3 import PPO

from environment import VoidFrontEnv
from pathlib import Path
from stable_baselines3.common.vec_env import VecNormalize


def watchPPO(path: str = None):
    env = VoidFrontEnv(
        render_mode="human",
    )

    # try:
    #     env = VecNormalize.load("./models/final/ppo/ppovec_normalize.pkl", env)
    # except Exception:
    #     pass

    # env.training = False
    # env.norm_reward = False

    # checkpoint_dir = Path("./models/checkpoints/ppo") if path == None else Path(path)
    checkpoint_dir = Path("./models/best_model/ppo") if path == None else Path(path)

    step = -1
    total_reward = 0

    latest = max(
        checkpoint_dir.glob("*.zip"),
        key=lambda p: p.stat().st_mtime,
    )

    model = PPO.load(latest)

    obs, info = env.reset()
    print(f"Episode info:\n {info}")

    last_modify = None

    while True:
        step += 1
        newest = max(
            checkpoint_dir.glob("*.zip"),
            key=lambda p: p.stat().st_mtime,
        )

        if last_modify != newest.stat().st_mtime:
            try:
                print("Loading", newest)
                model = PPO.load(newest)

                last_modify = newest.stat().st_mtime
            except Exception:
                pass

        action, _ = model.predict(obs, deterministic=True)

        # action = numpy.random.uniform(0, 1, 2)
    
        obs, reward, terminated, truncated, info = env.step(action)
        total_reward += reward

        if step == -1 or step >= 10000:
            print(f"Total Episode reward: {total_reward}")
            print(f"Episode info:\n {info}")
            step = 0

        env.render()

        if terminated or truncated:
            obs, info = env.reset()
            total_reward = 0
            print(f"Episode info:\n {info}, Steps = {step}, Rewards = {total_reward}")

        time.sleep(0.01)
