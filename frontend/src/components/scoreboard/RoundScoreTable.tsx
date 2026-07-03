import { useEffect, useRef, useState } from 'react';
import { Trash2 } from 'lucide-react';
import PlayerAvatar from '../ui/PlayerAvatar';
import { isPlaceholderRoundId } from '../../api/mappers';
import { Match, Player } from '../../types';
import { computePlayerActualTotal, formatActualTotal } from '../../utils';

const AUTO_SAVE_DELAY_MS = 700;
type ScoreField = 'bid' | 'actualWins';

interface RoundScoreTableProps {
  match: Match;
  players: Player[];
  readOnly?: boolean;
  updateRoundScore?: (
    matchId: string,
    roundId: string,
    playerId: string,
    bid: number,
    actualWins: number
  ) => void | Promise<void>;
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
  const autoSaveTimers = useRef<Record<string, ReturnType<typeof window.setTimeout>>>({});
  const lastCommittedDrafts = useRef<Record<string, string>>({});

  useEffect(() => {
    const timers = autoSaveTimers.current;
    return () => {
      Object.values(timers).forEach(window.clearTimeout);
    };
  }, []);

  const matchPlayers = match.players
    .map((mp) => {
      const player = players.find((p) => p.id === mp.playerId);
      return player ? { ...mp, player } : null;
    })
    .filter((mp): mp is (typeof match.players)[0] & { player: Player } => Boolean(mp))
    .sort((a, b) => a.seatOrder - b.seatOrder);

  const getRoundStarter = (roundNumber: number) =>
    matchPlayers.length > 0 ? matchPlayers[(roundNumber - 1) % matchPlayers.length] : null;

  const roundKey = (roundNumber: number) => String(roundNumber);
  const cellKey = (rowKey: string, playerId: string) => `${rowKey}:${playerId}`;
  const timerKey = (field: ScoreField, rowKey: string, playerId: string) =>
    `${field}:${cellKey(rowKey, playerId)}`;
  const committedDraftKey = (field: ScoreField, rowKey: string, playerId: string, value: string) =>
    `${timerKey(field, rowKey, playerId)}:${value}`;

  const clearAutoSave = (field: ScoreField, rowKey: string, playerId: string) => {
    const key = timerKey(field, rowKey, playerId);
    const timer = autoSaveTimers.current[key];
    if (!timer) return;
    window.clearTimeout(timer);
    delete autoSaveTimers.current[key];
  };

  const markDraftCommitted = (field: ScoreField, rowKey: string, playerId: string, value: string) => {
    lastCommittedDrafts.current[timerKey(field, rowKey, playerId)] = committedDraftKey(
      field,
      rowKey,
      playerId,
      value
    );
  };

  const wasDraftCommitted = (field: ScoreField, rowKey: string, playerId: string, value: string) =>
    lastCommittedDrafts.current[timerKey(field, rowKey, playerId)] ===
    committedDraftKey(field, rowKey, playerId, value);

  const scheduleAutoSave = (
    field: ScoreField,
    rowKey: string,
    playerId: string,
    commit: () => void
  ) => {
    clearAutoSave(field, rowKey, playerId);
    autoSaveTimers.current[timerKey(field, rowKey, playerId)] = window.setTimeout(() => {
      delete autoSaveTimers.current[timerKey(field, rowKey, playerId)];
      commit();
    }, AUTO_SAVE_DELAY_MS);
  };

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

  const getBid = (rowKey: string, playerId: string, fallback: number) => {
    const draft = bidDrafts[cellKey(rowKey, playerId)];
    if (draft === undefined || draft === '') return fallback;
    const numeric = Number(draft);
    return Number.isNaN(numeric) ? fallback : numeric;
  };

  const getActualWins = (rowKey: string, playerId: string, fallback: number) => {
    const draft = actualWinsDrafts[cellKey(rowKey, playerId)];
    if (draft === undefined || draft === '' || draft === '-') return fallback;
    const numeric = Number(draft);
    return Number.isNaN(numeric) ? fallback : numeric;
  };

  const renderedRounds = match.rounds.map((round) => ({
    ...round,
    scores: round.scores.map((score) => ({
      ...score,
      bid: getBid(roundKey(round.roundNumber), score.playerId, score.bid),
      actualWins: getActualWins(roundKey(round.roundNumber), score.playerId, score.actualWins),
    })),
  }));

  const handleBidChange = (
    roundId: string,
    rowKey: string,
    playerId: string,
    value: string,
    fallbackActualWins: number
  ) => {
    delete lastCommittedDrafts.current[timerKey('bid', rowKey, playerId)];
    setBidDrafts((prev) => ({ ...prev, [cellKey(rowKey, playerId)]: value }));
    scheduleAutoSave('bid', rowKey, playerId, () =>
      handleBidCommit(roundId, rowKey, playerId, fallbackActualWins, value)
    );
  };

  const saveRoundScore = (roundId: string, playerId: string, bid: number, actualWins: number) => {
    Promise.resolve(updateRoundScore?.(match.id, roundId, playerId, bid, actualWins)).catch(() => {
      // The store rolls back optimistic updates and exposes the error globally.
    });
  };

  const handleBidCommit = (
    roundId: string,
    rowKey: string,
    playerId: string,
    fallbackActualWins: number,
    nextDraft?: string
  ) => {
    if (!updateRoundScore) return;

    const key = cellKey(rowKey, playerId);
    const draft = nextDraft ?? bidDrafts[key];
    if (draft === undefined) return;
    if (wasDraftCommitted('bid', rowKey, playerId, draft)) return;

    const bid = draft === '' ? 0 : Math.max(0, Math.min(13, Number(draft)));
    if (Number.isNaN(bid)) return;

    const actualWins = getActualWins(rowKey, playerId, fallbackActualWins);

    clearAutoSave('bid', rowKey, playerId);
    markDraftCommitted('bid', rowKey, playerId, draft);
    setBidDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    saveRoundScore(roundId, playerId, bid, actualWins);
  };

  const handleActualWinsChange = (
    roundId: string,
    rowKey: string,
    playerId: string,
    value: string,
    fallbackBid: number
  ) => {
    const key = cellKey(rowKey, playerId);
    delete lastCommittedDrafts.current[timerKey('actualWins', rowKey, playerId)];
    if (value === '' || value === '-') {
      setActualWinsDrafts((prev) => ({ ...prev, [key]: value }));
      scheduleAutoSave('actualWins', rowKey, playerId, () =>
        handleActualWinsCommit(roundId, rowKey, playerId, fallbackBid, value)
      );
      return;
    }
    const numeric = Number(value);
    if (Number.isNaN(numeric)) return;
    setActualWinsDrafts((prev) => ({ ...prev, [key]: value }));
    scheduleAutoSave('actualWins', rowKey, playerId, () =>
      handleActualWinsCommit(roundId, rowKey, playerId, fallbackBid, value)
    );
  };

  const handleActualWinsCommit = (
    roundId: string,
    rowKey: string,
    playerId: string,
    fallbackBid: number,
    nextDraft?: string
  ) => {
    if (!updateRoundScore) return;

    const key = cellKey(rowKey, playerId);
    const draft = nextDraft ?? actualWinsDrafts[key];
    if (draft === undefined || draft === '') {
      if (draft === '') clearAutoSave('actualWins', rowKey, playerId);
      setActualWinsDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      return;
    }
    if (wasDraftCommitted('actualWins', rowKey, playerId, draft)) return;

    const bid = getBid(rowKey, playerId, fallbackBid);

    clearAutoSave('actualWins', rowKey, playerId);
    markDraftCommitted('actualWins', rowKey, playerId, draft);
    if (draft === '-') {
      setActualWinsDrafts((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
      saveRoundScore(roundId, playerId, bid, 0);
      return;
    }

    const numeric = Number(draft);
    if (Number.isNaN(numeric)) return;
    const maxActual = bid >= 0 ? 13 : bid - 1;
    const clamped = Math.max(-bid, Math.min(maxActual, numeric));
    setActualWinsDrafts((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
    saveRoundScore(roundId, playerId, bid, clamped);
  };

  const clearRoundDrafts = (rowKey: string) => {
    matchPlayers.forEach((mp) => {
      clearAutoSave('bid', rowKey, mp.playerId);
      clearAutoSave('actualWins', rowKey, mp.playerId);
      delete lastCommittedDrafts.current[timerKey('bid', rowKey, mp.playerId)];
      delete lastCommittedDrafts.current[timerKey('actualWins', rowKey, mp.playerId)];
    });

    setBidDrafts((prev) => {
      const next = { ...prev };
      matchPlayers.forEach((mp) => delete next[cellKey(rowKey, mp.playerId)]);
      return next;
    });
    setActualWinsDrafts((prev) => {
      const next = { ...prev };
      matchPlayers.forEach((mp) => delete next[cellKey(rowKey, mp.playerId)]);
      return next;
    });
  };

  const handleDeleteRound = (roundId: string, rowKey: string, roundNumber: number) => {
    if (!deleteRound || isPlaceholderRoundId(roundId)) return;
    const confirmed = window.confirm(`Clear round ${roundNumber} scores? The row will stay in place.`);
    if (!confirmed) return;
    clearRoundDrafts(rowKey);
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
              const rowKey = roundKey(round.roundNumber);
              const roundStarter = getRoundStarter(round.roundNumber);
              const predictedTotal = matchPlayers.reduce((sum, mp) => {
                const rs = round.scores.find((s) => s.playerId === mp.playerId);
                return sum + getBid(rowKey, mp.playerId, rs?.bid ?? 0);
              }, 0);
              const actualEntries = matchPlayers
                .map((mp) => {
                  const rs = round.scores.find((s) => s.playerId === mp.playerId);
                  if (!rs) return null;
                  const key = cellKey(rowKey, mp.playerId);
                  const draft = actualWinsDrafts[key];
                  const hasValue = draft !== undefined ? draft !== '' && draft !== '-' : rs.actualWins !== 0;
                  return {
                    playerId: mp.playerId,
                    actualWins: getActualWins(rowKey, mp.playerId, rs.actualWins),
                    hasValue,
                  };
                })
                .filter((entry): entry is { playerId: string; actualWins: number; hasValue: boolean } => Boolean(entry));
              const enteredActuals = actualEntries.filter((entry) => entry.hasValue);
              const maxActualWins =
                enteredActuals.length > 0 ? Math.max(...enteredActuals.map((entry) => entry.actualWins)) : null;
              return (
                <tr key={round.roundNumber}>
                  <td className="round-col text-white/50 font-mono text-xs">
                    <div className="flex items-center justify-center gap-1.5">
                      <span className="whitespace-nowrap">
                        R{round.roundNumber} ({roundStarter?.player.name ?? '—'})
                      </span>
                      {!readOnly && deleteRound && !isPlaceholderRoundId(round.id) && (
                        <button
                          type="button"
                          onClick={() => handleDeleteRound(round.id, rowKey, round.roundNumber)}
                          className="rounded p-0.5 text-white/20 hover:bg-crimson-500/20 hover:text-crimson-400 transition-all"
                          title={`Clear round ${round.roundNumber}`}
                        >
                          <Trash2 size={11} />
                        </button>
                      )}
                    </div>
                  </td>
                  {matchPlayers.map((mp) => {
                    const rs = round.scores.find((s) => s.playerId === mp.playerId);
                    if (!rs) return <td key={mp.playerId}>-</td>;
                    const bidKey = cellKey(rowKey, mp.playerId);
                    const bidValue =
                      bidDrafts[bidKey] ??
                      (rs.bid === 0 && bidDrafts[bidKey] === undefined ? '' : String(rs.bid));
                    const currentBid = getBid(rowKey, mp.playerId, rs.bid);
                    const actualValue = actualWinsDrafts[bidKey] ?? (rs.actualWins === 0 ? '' : String(rs.actualWins));
                    const currentActualWins = getActualWins(rowKey, mp.playerId, rs.actualWins);
                    const isMaxActualWins =
                      maxActualWins !== null &&
                      actualEntries.some(
                        (entry) => entry.playerId === mp.playerId && entry.hasValue && entry.actualWins === maxActualWins
                      );
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
                              onChange={(event) =>
                                handleBidChange(round.id, rowKey, mp.playerId, event.target.value, rs.actualWins)
                              }
                              onBlur={() => handleBidCommit(round.id, rowKey, mp.playerId, rs.actualWins)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === 'Tab') {
                                  handleBidCommit(round.id, rowKey, mp.playerId, rs.actualWins);
                                }
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
                                handleActualWinsChange(round.id, rowKey, mp.playerId, event.target.value, currentBid)
                              }
                              onBlur={() => handleActualWinsCommit(round.id, rowKey, mp.playerId, currentBid)}
                              onKeyDown={(event) => {
                                if (event.key === 'Enter' || event.key === 'Tab') {
                                  handleActualWinsCommit(round.id, rowKey, mp.playerId, currentBid);
                                }
                              }}
                              className={`cell-input ${getActualClass(currentActualWins, currentBid)} ${
                                isMaxActualWins ? 'max-actual' : ''
                              }`}
                            />
                          </div>
                        </div>
                      </td>
                    );
                  })}
                  <td className="round-col font-mono text-xs text-white/60">
                    {readOnly && predictedTotal === 0 ? '' : predictedTotal}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td className="round-col text-white/60 font-mono text-xs font-bold">Total</td>
              {matchPlayers.map((mp) => {
                const actualTotal = computePlayerActualTotal(renderedRounds, mp.playerId);
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
                {Math.min(renderedRounds.reduce((sum, round) => sum + computeActualTotal(round.scores), 0), 13 * renderedRounds.length)}/
                {13 * renderedRounds.length} ({renderedRounds.reduce((sum, round) => sum + computePredictedTotal(round.scores), 0)})
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
