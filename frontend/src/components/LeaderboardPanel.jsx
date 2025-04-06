import React from "react";

const LeaderboardPanel = ({ leaderboard }) => {
  return (
    <div className="w-64 p-4 bg-white shadow-md border-l border-gray-200">
      <h2 className="text-xl font-semibold mb-4">Leaderboard</h2>
      <ul>
        {leaderboard.map((player, index) => (
          <li key={player.id} className="mb-2">
            <span className="font-medium">{index + 1}. {player.username}</span> – {player.score}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default LeaderboardPanel;
