import React from "react";

const getMedalEmoji = (index) => {
  if (index === 0) return "🥇";
  if (index === 1) return "🥈";
  if (index === 2) return "🥉";
  return "";
};

const Leaderboard = ({ scores = [], highlightUserId = null }) => {
  const sorted = [...scores].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white shadow rounded-lg p-6 w-full max-w-md">
      <ol className="space-y-2">
        {sorted.length === 0 ? (
          <p className="text-gray-500 text-center">No scores available.</p>
        ) : (
          sorted.map((player, index) => (
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
          ))
        )}
      </ol>
    </div>
  );
};

export default Leaderboard;
