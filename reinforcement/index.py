import argparse

from ppo.eval import evaluatePPO
from ppo.train import trainPPO
from ppo.continue_training import continue_trainPPO
from ppo.watch import watchPPO
from sac.eval import evaluateSAC
from sac.train import trainSAC
from sac.watch import watchSAC

def run(action, run, path):
    if run == "ppo":
        if action == "eval":
            evaluatePPO()
        elif action == "watch":
            watchPPO(path)
        elif action == "learn":
            continue_trainPPO()
        else:
            trainPPO()

    if run == "sac":
        if action == "eval":
            evaluateSAC()
        elif action == "watch":
            watchSAC(path)
        else:
            trainSAC()
    
    if run == "export":
        pass
        
if __name__ == "__main__":
    parser = argparse.ArgumentParser()

    parser.add_argument(
        "--action",
        type=str,
        default="train", # train, eval, watch
    )

    parser.add_argument(
        "--path",
        type=str,
        default=None,
    )
    
    parser.add_argument(
        "--run",
        type=str,
        default="ppo", # ppo, sac, export
    )

    args = parser.parse_args()

    run(args.action, args.run, args.path)
    
