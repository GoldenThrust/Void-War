import os
from stable_baselines3 import PPO
from stable_baselines3.common.callbacks import CheckpointCallback, EvalCallback
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import SubprocVecEnv, VecFrameStack, VecMonitor, VecNormalize
import torch

from environment import VoidFrontEnv
from tensorboard_logger import TensorBoardRecorderCallback

# Import your custom environment class
# torch.set_num_threads(2)

def linear_schedule(initial_value):
    def func(progress_remaining):
        return progress_remaining * initial_value
    return func

def make_env():
    """Factory function to instantiate the custom environment."""
    return VoidFrontEnv(
        render_mode=None
        # render_mode="rgb_array",
    )


def trainPPO():
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

    train_env = VecMonitor(train_env)  # Wraps env to log episodic rewards and length

    train_env = VecNormalize(
        train_env,
        norm_obs=True,
        norm_reward=True,
        clip_obs=10.0,
        clip_reward=10.0
    )
    
    train_env = VecFrameStack(
    train_env,
    n_stack=4,
)


    # Separate single evaluation environment
    eval_env = make_vec_env(make_env, n_envs=1, seed=SEED + 1)
    eval_env = VecMonitor(eval_env)
    eval_env = VecNormalize(
        eval_env,
        training=False,
        norm_obs=True,
        norm_reward=False,
        
    )
    
    eval_env = VecFrameStack(
    eval_env,
    n_stack=4,
)
    eval_env.obs_rms = train_env.obs_rms

    # -------------------------------------------------------------------------
    # 3. CALLBACKS (Checkpointing & Best Model Tracking)
    # -------------------------------------------------------------------------
    # Save periodic checkpoints every N timesteps
    checkpoint_callback = CheckpointCallback(
        save_freq=max(1_000_000 // NUM_ENVS, 1),
        save_path=model_dir,
        name_prefix="ppo_navigation",
        save_replay_buffer=False,
    )

    # Save the best performing model based on evaluation score
    eval_callback = EvalCallback(
        eval_env,
        best_model_save_path=best_model_dir,
        log_path=log_dir,
        eval_freq=max(1_000_000 // NUM_ENVS, 1),
        n_eval_episodes=10,
        deterministic=True,
        render=False,
    )

    # video_recorder = TensorBoardRecorderCallback(eval_env, render_freq=5000)

    # -------------------------------------------------------------------------
    # 4. POLICY NETWORK & PPO INITIALIZATION
    # -------------------------------------------------------------------------
    # Custom MLP architecture for dictionary features
    # policy_kwargs = dict(
    #     net_arch=dict(
    #         pi=[256, 256, 256],  # Actor (policy) network layers
    #         vf=[256, 256, 256],  # Critic (value function) network layers
    #     )
    # )
    policy_kwargs = dict(
        net_arch=dict(
            pi=[512, 512, 256],  # Actor (policy) network layers
            vf=[512, 512, 256],  # Critic (value function) network layers
        )
    )
    
    model_path = f"{final_model_dir}/final_navigation.zip"

    if os.path.exists(model_path):
        model = PPO.load(
            model_path,
            env=train_env,
            device="auto",
        )
    else:
        model = PPO(
            policy="MultiInputPolicy",  # Supports Gym Dict observation spaces
            env=train_env,
            # learning_rate=1e-3,
            learning_rate=linear_schedule(3e-4),
            n_steps=2048,  # Steps per env before updating policy
            batch_size=512,
            n_epochs=10,
            gamma=0.995,  # Discount factor
            gae_lambda=0.95,  # Generalized Advantage Estimation parameter
            clip_range=0.2,  # PPO clipping ratio
            ent_coef=0.005,  # Entropy coefficient for exploration
            vf_coef=0.5,  # Value function loss coefficient
            max_grad_norm=0.5,  # Gradient clipping
            policy_kwargs=policy_kwargs,
            tensorboard_log=log_dir,
            verbose=1,
            device="auto",  # "cuda" or "cpu" or "auto"
        )

    # -------------------------------------------------------------------------
    # 5. RUN TRAINING
    # -------------------------------------------------------------------------
    TOTAL_TIMESTEPS = 100_000_000
    # TOTAL_TIMESTEPS = 30_000

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
    )

    # Save final model
    model.save(f"{final_model_dir}/final")
    print("Training complete! Model saved.")

    train_env.save(f"{final_model_dir}/ppovec_normalize.pkl")
    model.save(f"{final_model_dir}/final_navigation")

    train_env.close()
    eval_env.close()
