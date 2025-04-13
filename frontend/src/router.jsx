import { createBrowserRouter, RouterProvider } from "react-router-dom";

// Auth pages
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";

// Game flow pages
import Home from "@/pages/Home";
import Lobby from "@/pages/Lobby";
import Game from "@/pages/Game";
import Leaderboard from "@/pages/LeaderboardPage";
import History from "@/pages/MatchHistory";

const router = createBrowserRouter([
  { path: "/", element: <Login /> },
  { path: "/login", element: <Login /> },
  { path: "/register", element: <Register /> },
  { path: "/home", element: <Home /> },
  { path: "/lobby/:roomCode", element: <Lobby /> },
  { path: "/game/:roomCode", element: <Game /> },
  { path: "/leaderboard/:roomCode", element: <Leaderboard /> },
  { path: "/history", element: <History /> },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
