import PlayerAvatar from '../ui/PlayerAvatar';
import { Match, Player } from '../../types';
import { computePlayerActualTotal, formatActualTotal } from '../../utils';

interface MatchRankingTableProps {
  match: Match;
  players: Player[];
}

export default function MatchRankingTable({ match, players }: MatchRankingTableProps) {
  const rankedPlayers = match.players
    .map((matchPlayer) => {
      const player = players.find((p) => p.id === matchPlayer.playerId);
      if (!player) return null;

      const greenCount = match.rounds.reduce((count, round) => {
        const score = round.scores.find((s) => s.playerId === matchPlayer.playerId);
        if (!score) return count;
        return score.bid > 0 && score.actualWins === score.bid ? count + 1 : count;
      }, 0);

      return {
        ...matchPlayer,
        player,
        greenCount,
        actualTotal: computePlayerActualTotal(match.rounds, matchPlayer.playerId),
      };
    })
    .filter((entry): entry is NonNullable<typeof entry> => entry !== null)
    .sort((a, b) => {
      if (b.actualTotal !== a.actualTotal) return b.actualTotal - a.actualTotal;
      return b.greenCount - a.greenCount;
    });

  return (
    <div className="glass-card rounded-3xl overflow-hidden">
      <div className="px-4 py-3 border-b border-white/5">
        <h2 className="font-display text-lg font-semibold text-white">Ranking</h2>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full ranking-table text-sm">
          <thead>
            <tr>
              <th>Player name</th>
              <th>Actual total</th>
              <th>Total Green</th>
            </tr>
          </thead>
          <tbody>
            {rankedPlayers.map((entry, index) => (
              <tr key={entry.playerId}>
                <td>
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`rank-badge rank-${index + 1} shrink-0`}>{index + 1}</span>
                    <PlayerAvatar avatar={entry.player.avatar} color={entry.player.color} name={entry.player.name} size="sm" />
                    <span className="text-white font-medium truncate">{entry.player.name}</span>
                  </div>
                </td>
                <td className={`font-mono font-bold ${entry.actualTotal >= 0 ? 'text-gold-400' : 'text-crimson-400'}`}>
                  {formatActualTotal(entry.actualTotal)}
                </td>
                <td>
                  <span className="inline-flex min-w-8 justify-center rounded-md bg-jade-400/15 px-2 py-1 font-mono font-bold text-jade-400">
                    {entry.greenCount}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
