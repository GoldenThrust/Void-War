import time

from stable_baselines3 import SAC

from environment import VoidFrontEnv
from pathlib import Path
from stable_baselines3.common.vec_env import VecNormalize


def watchSAC(path: str = None):
    env = VoidFrontEnv(
        render_mode="human",
    )
    
    try:
        env = VecNormalize.load("./models/final/ppo/ppovec_normalize.pkl", env)
    except Exception:
        pass

    env.training = False
    env.norm_reward = False

    checkpoint_dir = Path("./models/checkpoints/sac") if path == None else Path(path)
    checkpoint_dir = Path("./models/best_model/sac") if path == None else Path(path)

    latest = max(
        checkpoint_dir.glob("*.zip"),
        key=lambda p: p.stat().st_mtime,
    )

    total_reward = 0
    step = 0

    model = SAC.load(latest)

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
                model = SAC.load(newest)
                last_modify = newest.stat().st_mtime
            except Exception:
                pass

        action, _ = model.predict(obs, deterministic=True)

        obs, reward, terminated, truncated, info = env.step(action)
        total_reward += reward

        if step >= 10000:
            print(f"Total Episode reward: {total_reward}")
            print(f"Episode info:\n {info}")
            step = 0

        env.render()

        if terminated or truncated:
            obs, info = env.reset()
            print(f"Episode info:\n {info}, Steps {step}, Rewards = {total_reward}")
            

        time.sleep(0.01)
