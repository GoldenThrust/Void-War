import { Link } from "react-router";

export default function Home() {
  return (
    <div className="flex flex-col justify-center items-center gap-10">
      <div className="m-52">Home</div>
      <Link to={"/game/online"}>Online</Link>
      <Link to={"/game/offline"}>Offline</Link>
    </div>
  );
}
