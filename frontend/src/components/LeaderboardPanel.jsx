import React, { useMemo } from "react";

// Function to get the medal emoji based on the player's position
const getMedalEmoji = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
};

const LeaderboardPanel = React.memo(({ scores = [], highlightUserId = null }) => {
  // Memoize sorted leaderboard to avoid re-sorting on every render
  const sorted = useMemo(() => {
    return [...scores].sort((a, b) => b.score - a.score);
  }, [scores]);

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
      {sorted.length === 0 ? (
        <p className="text-gray-500 text-center">Waiting for players...</p>
      ) : (
        <ol className="space-y-2">
          {sorted.map((player, index) => (
            <li
              key={player._id || player.id || index}
              className={`flex justify-between items-center ${
                highlightUserId && highlightUserId === (player._id || player.id)
                  ? "bg-yellow-100 rounded-lg px-2"
                  : ""
              }`}
            >
              <span className="font-semibold">
                {getMedalEmoji(index)} {index + 1}. {player.username || "Anonymous"}
              </span>
              <span className="text-blue-600 font-bold">{player.score}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
});

export default LeaderboardPanel;
