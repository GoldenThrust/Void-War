import os
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import CheckpointCallback, EvalCallback
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import SubprocVecEnv, VecMonitor, VecNormalize

from environment import VoidFrontEnv
from tensorboard_logger import TensorBoardRecorderCallback
from pathlib import Path

# Import your custom environment class


def make_env():
    """Factory function to instantiate the custom environment."""
    return VoidFrontEnv(
        render_mode="human",
        # render_mode="rgb_array",
    )


def continue_trainPPO():
    # -------------------------------------------------------------------------
    # 1. DIRECTORY SETUP
    # -------------------------------------------------------------------------
    log_dir = "./logs/tensorboard/ppo"
    model_dir = "./models/checkpoints/ppo"
    best_model_dir = "./models/best_model/ppo"
    final_model_dir = "./models/final/ppo"

    os.makedirs(log_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(best_model_dir, exist_ok=True)
    os.makedirs(final_model_dir, exist_ok=True)

    # -------------------------------------------------------------------------
    # 2. VECTORIZED ENVIRONMENTS
    # -------------------------------------------------------------------------
    NUM_ENVS = 8  # Parallel environments (adjust based on CPU cores)
    SEED = 42

    # Vectorize envs using SubprocVecEnv for multi-process execution
    train_env = make_vec_env(
        make_env,
        n_envs=NUM_ENVS,
        vec_env_cls=SubprocVecEnv,
        seed=SEED,
    )

    # train_env = VecMonitor(train_env)  # Wraps env to log episodic rewards and length

    train_env = VecNormalize(
        train_env,
        norm_obs=True,
        norm_reward=True,
        clip_obs=10.0,
    )

    # Separate single evaluation environment
    eval_env = make_vec_env(make_env, n_envs=1, seed=SEED + 1)
    # eval_env = VecMonitor(eval_env)
    eval_env = VecNormalize(
        eval_env,
        training=False,
        norm_obs=True,
        norm_reward=False,
    )

    # -------------------------------------------------------------------------
    # 3. CALLBACKS (Checkpointing & Best Model Tracking)
    # -------------------------------------------------------------------------
    # Save periodic checkpoints every N timesteps
    checkpoint_callback = CheckpointCallback(
        save_freq=max(100_000 // NUM_ENVS, 1),
        save_path=model_dir,
        name_prefix="ppo_navigation",
        save_replay_buffer=False,
    )

    # Save the best performing model based on evaluation score
    eval_callback = EvalCallback(
        eval_env,
        best_model_save_path=best_model_dir,
        log_path=log_dir,
        eval_freq=max(100_000 // NUM_ENVS, 1),
        n_eval_episodes=10,
        deterministic=True,
        render=False,
    )
    
    checkpoint_dir = Path("./models/checkpoints/ppo")

    # video_recorder = TensorBoardRecorderCallback(eval_env, render_freq=5000)

    # -------------------------------------------------------------------------
    # 4. POLICY NETWORK & PPO INITIALIZATION
    # -------------------------------------------------------------------------
    # print(f'{best_model_dir}/best-model.zip')
    latest = max(
        checkpoint_dir.glob("*.zip"),
        key=lambda p: p.stat().st_mtime,
    )

    model = PPO.load(latest, env=train_env)

    # -------------------------------------------------------------------------
    # 5. RUN TRAINING
    # -------------------------------------------------------------------------
    TOTAL_TIMESTEPS = 8_000_000

    print(
        f"Starting training for {TOTAL_TIMESTEPS} timesteps across {NUM_ENVS} workers..."
    )
    model.learn(
        total_timesteps=TOTAL_TIMESTEPS,
        callback=[
            checkpoint_callback,
            eval_callback,
            #   video_recorder
        ],
        tb_log_name="Navigation_PPO",
        progress_bar=True,
        reset_num_timesteps=False
    )

    # Save final model
    model.save(f"{final_model_dir}/final")
    print("Training complete! Model saved.")

    train_env.save(f"{final_model_dir}/ppovec_normalize.pkl")
    model.save(f"{final_model_dir}/final_navigation")

    train_env.close()
    eval_env.close()
