import os
from stable_baselines3 import SAC, HerReplayBuffer
from stable_baselines3.common.callbacks import CheckpointCallback, EvalCallback
from stable_baselines3.common.env_util import make_vec_env
from stable_baselines3.common.vec_env import SubprocVecEnv, VecMonitor, VecNormalize

# Import your custom environment class
from environment import VoidFrontEnv
from tensorboard_logger import TensorBoardRecorderCallback


def make_env():
    """Factory function to instantiate the custom environment."""
    return VoidFrontEnv(
        # render_mode="rgb_array",
    )


def trainSAC():
    # -------------------------------------------------------------------------
    # 1. DIRECTORY SETUP
    # -------------------------------------------------------------------------
    log_dir = "./logs/tensorboard/sac"
    model_dir = "./models/checkpoints/sac"
    best_model_dir = "./models/best_model/sac"
    final_model_dir = "./models/final/sac"

    os.makedirs(log_dir, exist_ok=True)
    os.makedirs(model_dir, exist_ok=True)
    os.makedirs(best_model_dir, exist_ok=True)
    os.makedirs(final_model_dir, exist_ok=True)

    # -------------------------------------------------------------------------
    # 2. VECTORIZED ENVIRONMENTS
    # -------------------------------------------------------------------------
    NUM_ENVS = 8  # Parallel environments (adjust based on CPU cores)
    SEED = 42
    n_sampled_goal = 4

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

    # -------------------------------------------------------------------------
    # 3. CALLBACKS (Checkpointing & Best Model Tracking)
    # -------------------------------------------------------------------------
    # Save periodic checkpoints every N timesteps
    checkpoint_callback = CheckpointCallback(
        save_freq=max(50_000 // NUM_ENVS, 1),
        save_path=model_dir,
        name_prefix="sac_navigation",
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

    # video_recorder = TensorBoardRecorderCallback(eval_env, render_freq=5000)

    # -------------------------------------------------------------------------
    # 4. POLICY NETWORK & SAC INITIALIZATION
    # -------------------------------------------------------------------------
    # Custom MLP architecture for dictionary features
    policy_kwargs = dict(
        net_arch=dict(
            pi=[256, 256, 256],  # Actor (policy) network layers
            qf=[256, 256, 256],  # Critic (value function) network layers
        )
    )

    model = SAC(
        policy="MultiInputPolicy",
        env=train_env,
        # learning_rate=1e-3,
        learning_rate=3e-4,
        learning_starts=25000,
        batch_size=256,
        gamma=0.99,
        ent_coef=0.01,
        policy_kwargs=policy_kwargs,
        tensorboard_log=log_dir,
        verbose=1,
        device="auto",
        # replay_buffer_class=HerReplayBuffer,
        # replay_buffer_kwargs={
        #     "n_sampled_goal": n_sampled_goal,
        #     "goal_selection_strategy": "future",
        # },
    )

    # -------------------------------------------------------------------------
    # 5. RUN TRAINING
    # -------------------------------------------------------------------------
    TOTAL_TIMESTEPS = 3_000_000
    # TOTAL_TIMESTEPS = 4_0_000

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
        tb_log_name="Navigation_SAC",
        progress_bar=True,
    )

    # Save final model
    model.save(f"{final_model_dir}/final")
    print("Training complete! Model saved.")

    train_env.save(f"{final_model_dir}/sacvec_normalize.pkl")
    model.save(f"{final_model_dir}/final_navigation")

    train_env.close()
    eval_env.close()
