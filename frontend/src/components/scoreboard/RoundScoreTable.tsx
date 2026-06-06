import { useState } from 'react';
import { Trash2 } from 'lucide-react';
import PlayerAvatar from '../ui/PlayerAvatar';
import { isPlaceholderRoundId } from '../../api/mappers';
import { Match, Player } from '../../types';
import { computePlayerActualTotal, formatActualTotal } from '../../utils';

interface RoundScoreTableProps {
  match: Match;
  players: Player[];
  readOnly?: boolean;
  updateRoundScore?: (matchId: string, roundId: string, playerId: string, bid: number, actualWins: number) => void;
  deleteRound?: (matchId: string, roundId: string) => void;
}

export default function RoundScoreTable({
  match,
  players,
  readOnly = false,
  updateRoundScore,
  deleteRound,
}: RoundScoreTableProps) {
  const [bidDrafts, setBidDrafts] = useState<Record<string, string>>({});
  const [actualWinsDrafts, setActualWinsDrafts] = useState<Record<string, string>>({});

  const matchPlayers = match.players
    .map((mp) => {
      const player = players.find((p) => p.id === mp.playerId);
      return player ? { ...mp, player } : null;
    })
    .filter(Boolean)
    .sort((a, b) => a.seatOrder - b.seatOrder) as Array<(typeof match.players)[0] & { player: Player }>;

  const getRoundStarter = (roundNumber: number) =>
    matchPlayers.length > 0 ? matchPlayers[(roundNumber - 1) % matchPlayers.length] : null;

  const cellKey = (roundId: string, playerId: string) => `${roundId}:${playerId}`;

  const computeActualTotal = (scores: { actualWins: number; bid: number }[]): number => {
    let negativeBonus = 0;
    let asNegativeCount = 0;

    const total = scores.reduce((sum, s) => {
      const val = s.actualWins;

      if (val < 0) {
        asNegativeCount++;
        negativeBonus += -val - 1;
        return sum + (s.bid - 1);
      }

      const whole = Math.floor(val);
      const decimal = Math.round((val - whole) * 10);

      return sum + whole + decimal;
    }, 0);

    const maxAllowed = Math.min(13, total + negativeBonus);

    if (asNegativeCount > 0) {
      return total > maxAllowed ? total : maxAllowed;
    }
    return total > maxAllowed ? total - negativeBonus : maxAllowed;
  };

  const computePredictedTotal = (scores: { bid: number }[]) =>
    scores.reduce((sum, s) => sum + s.bid, 0);

  const getActualClass = (actual: number, bid: number): string => {
    if (actual < 0) return 'negative';
    if ((actual * 10) % 10 >= 3) return 'over';
    if (actual === bid && actual > 0) return 'match';
    return '';
  };

  const getBid = (roundId: string, playerId: string, fallback: number) => {
    const draft = bidDrafts[cellKey(roundId, playerId)];
    if (draft === undefined || draft === '') return fallback;
    const numeric = Number(draft);
    return Number.isNaN(numeric) ? fallback : numeric;
  };

  const getActualWins = (roundId: string, playerId: string, fallback: number) => {
    const draft = actualWinsDrafts[cellKey(roundId, playerId)];
    if (draft === undefined || draft === '' || draft === '-') return fallback;
    const numeric = Number(draft);
    return Number.isNaN(numeric) ? fallback : numeric;
  };

  const handleBidChange = (roundId: string, playerId: string, value: string) => {
    setBidDrafts((prev) => ({ ...prev, [cellKey(roundId, playerId)]: value }));
  };

  const handleBidCommit = (roundId: string, playerId: string, fallbackActualWins: number) => {
    if (!updateRoundScore) return;

    const key = cellKey(roundId, playerId);
    const draft = bidDrafts[key];
    if (draft === undefined) return;

    const bid = draft === '' ? 0 : Math.max(0, Math.min(13, Number(draft)));
    if (Number.isNaN(bid)) return;

    const actualWins = getActualWins(roundId, playerId, fallbackActualWins);

    setBidDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    updateRoundScore(match.id, roundId, playerId, bid, actualWins);
  };

  const handleActualWinsChange = (roundId: string, playerId: string, value: string) => {
    const key = cellKey(roundId, playerId);
    if (value === '' || value === '-') {
      setActualWinsDrafts((prev) => ({ ...prev, [key]: value }));
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    setActualWinsDrafts((prev) => ({ ...prev, [key]: value }));
  };

  const handleActualWinsCommit = (roundId: string, playerId: string, fallbackBid: number) => {
    if (!updateRoundScore) return;

    const key = cellKey(roundId, playerId);
    const draft = actualWinsDrafts[key];
    if (draft === undefined || draft === '') {
      setActualWinsDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }

    const bid = getBid(roundId, playerId, fallbackBid);

    if (draft === '-') {
      setActualWinsDrafts((prev) => ({ ...prev, [key]: '0' }));
      updateRoundScore(match.id, roundId, playerId, bid, 0);
      return;
    }

    const numeric = Number(draft);
    if (Number.isNaN(numeric)) return;
    const maxActual = bid >= 0 ? 13 : bid - 1;
    const clamped = Math.max(-bid, Math.min(maxActual, numeric));
    setActualWinsDrafts((prev) => ({ ...prev, [key]: String(clamped) }));
    updateRoundScore(match.id, roundId, playerId, bid, clamped);
  };

  const handleDeleteRound = (roundId: string, roundNumber: number) => {
    if (!deleteRound || isPlaceholderRoundId(roundId)) return;
    const confirmed = window.confirm(`Delete round ${roundNumber}? This cannot be undone.`);
    if (!confirmed) return;
    deleteRound(match.id, roundId);
  };

  return (
    <div className="glass-card rounded-3xl overflow-hidden mb-6">
      <div className="round-table-wrap">
        <table className="w-full round-table text-sm">
          <thead>
            <tr>
              <th className="round-col">Round</th>
              {matchPlayers.map((mp) => (
                <th key={mp.playerId}>
                  <div className="flex items-center justify-center gap-2">
                    <PlayerAvatar avatar={mp.player.avatar} color={mp.player.color} name={mp.player.name} size="sm" />
                    <span className="text-xs text-white/80 font-semibold">{mp.player.name}</span>
                  </div>
                </th>
              ))}
              <th className="round-col"> Total Prediction </th>
            </tr>
          </thead>
          <tbody>
            {match.rounds.map((round) => {
              const roundStarter = getRoundStarter(round.roundNumber);
              const predictedTotal = matchPlayers.reduce((sum, mp) => {
                const rs = round.scores.find((s) => s.playerId === mp.playerId);
                return sum + getBid(round.id, mp.playerId, rs?.bid ?? 0);
              }, 0);
              return (
                <tr key={round.id}>
                  <td className="round-col text-white/50 font-mono text-xs">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="whitespace-nowrap">
                        R{round.roundNumber} ({roundStarter?.player.name ?? '—'})
                      </span>
                      {!readOnly && deleteRound && !isPlaceholderRoundId(round.id) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRound(round.id, round.roundNumber)}
                          className="rounded p-0.5 text-white/20 hover:bg-crimson-500/20 hover:text-crimson-400 transition-all"
                          title={`Delete round ${round.roundNumber}`}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                  {matchPlayers.map((mp) => {
                    const rs = round.scores.find((s) => s.playerId === mp.playerId);
                    if (!rs) return <td key={mp.playerId}>-</td>;
                    const bidKey = cellKey(round.id, mp.playerId);
                    const bidValue =
                      bidDrafts[bidKey] ??
                      (rs.bid === 0 && !readOnly && bidDrafts[bidKey] === undefined ? '' : String(rs.bid));
                    const currentBid = getBid(round.id, mp.playerId, rs.bid);
                    const actualValue = actualWinsDrafts[bidKey] ?? (rs.actualWins === 0 && !readOnly ? '' : String(rs.actualWins));
                    return (
                      <td key={mp.playerId}>
                        <div className="cell-editor">
                          <div className="cell-editor-row">
                            <input
                              type="number"
                              max={13}
                              value={bidValue}
                              disabled={readOnly}
                              readOnly={readOnly}
                              onChange={(event) => handleBidChange(round.id, mp.playerId, event.target.value)}
                              onBlur={() => handleBidCommit(round.id, mp.playerId, rs.actualWins)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') handleBidCommit(round.id, mp.playerId, rs.actualWins);
                              }}
                              className="cell-input"
                            />
                            <input
                              type="number"
                              min={-13}
                              max={13}
                              value={actualValue}
                              disabled={readOnly}
                              readOnly={readOnly}
                              onChange={(event) =>
                                handleActualWinsChange(round.id, mp.playerId, event.target.value)
                              }
                              onBlur={() => handleActualWinsCommit(round.id, mp.playerId, currentBid)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter') handleActualWinsCommit(round.id, mp.playerId, currentBid);
                              }}
                              className={`cell-input ${getActualClass(
                                Number(actualWinsDrafts[bidKey] ?? rs.actualWins),
                                currentBid
                              )}`}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="round-col font-mono text-xs text-white/60">{predictedTotal}</td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="round-col text-white/60 font-mono text-xs font-bold">Total</td>
              {matchPlayers.map((mp) => {
                const actualTotal = computePlayerActualTotal(match.rounds, mp.playerId);
                return (
                  <td
                    key={mp.playerId}
                    className={`font-mono text-xs font-bold ${actualTotal >= 0 ? 'text-gold-400' : 'text-crimson-400'}`}
                  >
                    {formatActualTotal(actualTotal)}
                  </td>
                );
              })}
              <td className="round-col font-mono text-xs text-white/60">
                {Math.min(match.rounds.reduce((sum, round) => sum + computeActualTotal(round.scores), 0), 13 * match.rounds.length)}/
                {13 * match.rounds.length} ({match.rounds.reduce((sum, round) => sum + computePredictedTotal(round.scores), 0)})
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
