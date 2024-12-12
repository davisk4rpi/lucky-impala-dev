import type { Route } from "./+types/home";
import { Link } from "react-router-dom";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return { message: context.VALUE_FROM_EXPRESS };
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <main className="flex flex-col items-center justify-end h-screen w-screen bg-black text-white">
      <div className="flex-grow flex flex-col items-center justify-center">
        <h1 className="text-9xl font-bold uppercase">
          More<sup>*</sup>
        </h1>
      </div>
      <small className="text-base font-extralight mb-2">
        <sup>*</sup>coming soon
      </small>
      <p className="py-4 text-xl ">
        But if you're bored, watch this&nbsp;
        <a
          href="/particle-spiral"
          className="hover:text-blue-400 underline italic"
        >
          Particle Spiral
        </a>
      </p>
    </main>
  );
}
