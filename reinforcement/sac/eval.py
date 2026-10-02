import time
from stable_baselines3 import SAC
from environment import VoidFrontEnv
from stable_baselines3.common.vec_env import VecNormalize


def evaluateSAC():
    # 1. Instantiate Environment
    env = VoidFrontEnv(
        # render_mode="human",
    )

    try:
        env = VecNormalize.load("./models/final/sac/sacvec_normalize.pkl", env)
    except Exception:
        pass
    
    env.training = False
    env.norm_reward = False
    

    # 2. Load Trained Model
    model_path = "./models/best_model/sac/best_model.zip"
    model = SAC.load(model_path, env=env)
    model.train = "False"
    print(f"Successfully loaded model from {model_path}")

    # 3. Evaluation Loop
    episodes = 5
    for ep in range(1, episodes + 1):
        obs, info = env.reset()
        done = False
        total_reward = 0.0
        steps = 0

        while not done:
            # Predict action (deterministic=True picks the greedy best action)
            action, _ = model.predict(obs, deterministic=True)

            obs, reward, terminated, truncated, info = env.step(action)
            # env.render()  # Render the environment for visualization
            done = terminated or truncated

            total_reward += reward
            steps += 1

            # Optional delay for human visual inspection
            time.sleep(0.01)

        print(f"Episode {ep}: Total Reward = {total_reward:.2f}, Steps = {steps}")

    env.close()
