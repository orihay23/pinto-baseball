/**
 * Baseball Roster Algorithm
 *
 * Positions:
 *   Infield  (6): P, C, 1B, 2B, 3B, SS
 *   Outfield (4): LF, LC, RC, RF
 *
 * Constraints:
 *  - No player sits 2 innings in a row
 *  - Equal playing time (within 1 inning)
 *  - Players rotate between infield/outfield each inning
 *  - 1B only assigned to eligible players
 *  - Positions rotated as evenly as possible
 */

export const POSITIONS = {
  infield: ['P', 'C', '1B', '2B', '3B', 'SS'],
  outfield: ['LF', 'LC', 'RC', 'RF'],
};

export const ALL_POSITIONS = [...POSITIONS.infield, ...POSITIONS.outfield];
export const INNINGS = 6;
export const FIELD_SPOTS = ALL_POSITIONS.length; // 10

/**
 * Generate a full 6-inning lineup.
 *
 * @param {Array<{id: string, name: string, canPlayFirst: boolean}>} players
 * @returns {Array<Object>} innings – array of 6 inning objects:
 *   { inning: number, assignments: { [playerId]: position|'BENCH' } }
 */
export function generateLineup(players) {
  const n = players.length;
  if (n < FIELD_SPOTS) {
    throw new Error(`Need at least ${FIELD_SPOTS} players.`);
  }

  const benchPerInning = n - FIELD_SPOTS; // typically 3

  // --- Tracking state ---
  // innings[i] = { [playerId]: 'P'|'C'|...|'BENCH' }
  const innings = [];

  // playedAt[playerId][position] = count of times played that position
  const playedAt = {};
  // benchCount[playerId] = number of innings on bench
  const benchCount = {};
  // lastZone[playerId] = 'infield' | 'outfield' | 'bench' | null
  const lastZone = {};
  // lastBench[playerId] = boolean, was on bench last inning
  const lastBench = {};

  players.forEach((p) => {
    playedAt[p.id] = {};
    ALL_POSITIONS.forEach((pos) => (playedAt[p.id][pos] = 0));
    benchCount[p.id] = 0;
    lastZone[p.id] = null;
    lastBench[p.id] = false;
  });

  for (let inning = 0; inning < INNINGS; inning++) {
    const assignment = {};

    // ---- Step 1: Choose who sits ----
    const forcedBench = inning === 0
      ? players.filter((p) => p.benchFirst).map((p) => p.id)
      : [];
    const sitters = chooseSitters(
      players,
      benchCount,
      lastBench,
      benchPerInning,
      inning,
      forcedBench
    );
    sitters.forEach((id) => {
      assignment[id] = 'BENCH';
      benchCount[id]++;
    });

    // ---- Step 2: Assign field positions ----
    const fielders = players.filter((p) => !sitters.includes(p.id));

    // Separate preferred zone based on last inning
    const preferInfield = fielders.filter(
      (p) => lastZone[p.id] === 'outfield' || lastZone[p.id] === 'bench' || lastZone[p.id] === null
    );
    const preferOutfield = fielders.filter(
      (p) => lastZone[p.id] === 'infield'
    );

    // We need 6 infielders and 4 outfielders
    let infieldPlayers = [];
    let outfieldPlayers = [];

    // First satisfy the swap preference
    if (preferInfield.length >= 6 && preferOutfield.length >= 4) {
      // Perfect – pick the best candidates from each group
      infieldPlayers = pickBest(preferInfield, 6, 'infield', playedAt);
      outfieldPlayers = pickBest(preferOutfield, 4, 'outfield', playedAt);
    } else if (preferInfield.length >= 6) {
      infieldPlayers = pickBest(preferInfield, 6, 'infield', playedAt);
      outfieldPlayers = fielders.filter((p) => !infieldPlayers.includes(p));
    } else if (preferOutfield.length >= 4) {
      outfieldPlayers = pickBest(preferOutfield, 4, 'outfield', playedAt);
      infieldPlayers = fielders.filter((p) => !outfieldPlayers.includes(p));
    } else {
      // Just do best effort
      infieldPlayers = pickBest(fielders, 6, 'infield', playedAt);
      outfieldPlayers = fielders.filter((p) => !infieldPlayers.includes(p));
    }

    // ---- Step 3: Assign specific positions ----
    // Infield – handle 1B constraint first
    const infieldPositions = [...POSITIONS.infield];
    assignPositions(
      infieldPlayers,
      infieldPositions,
      assignment,
      playedAt,
      players.filter((p) => p.canPlayFirst).map((p) => p.id)
    );

    // Outfield
    assignPositions(
      outfieldPlayers,
      [...POSITIONS.outfield],
      assignment,
      playedAt,
      null
    );

    // ---- Step 4: Update tracking ----
    players.forEach((p) => {
      const pos = assignment[p.id];
      if (pos === 'BENCH') {
        lastZone[p.id] = 'bench';
        lastBench[p.id] = true;
      } else {
        if (playedAt[p.id][pos] !== undefined) playedAt[p.id][pos]++;
        lastZone[p.id] = POSITIONS.infield.includes(pos) ? 'infield' : 'outfield';
        lastBench[p.id] = false;
      }
    });

    innings.push({ inning: inning + 1, assignment });
  }

  return innings;
}

/**
 * Choose which players sit this inning.
 * forcedBench: player IDs that must sit (used for inning 1 late arrivals).
 */
function chooseSitters(players, benchCount, lastBench, count, inningIndex, forcedBench = []) {
  if (count === 0) return [];

  // Seed with forced players (up to count), then fill remainder normally.
  const forced = forcedBench.slice(0, count);
  const remaining = count - forced.length;

  const eligible = players.filter(
    (p) => !lastBench[p.id] && !forced.includes(p.id)
  );
  const withScore = eligible.map((p) => ({
    p,
    score: benchCount[p.id] * 1000 + players.indexOf(p),
  }));
  withScore.sort((a, b) => a.score - b.score);

  return [...forced, ...withScore.slice(0, remaining).map((x) => x.p.id)];
}

/**
 * Pick `count` players from a pool who have least experience in the given zone.
 */
function pickBest(pool, count, zone, playedAt) {
  const zonePositions = POSITIONS[zone];
  const scored = pool.map((p) => ({
    p,
    zoneCount: zonePositions.reduce((sum, pos) => sum + (playedAt[p.id][pos] || 0), 0),
  }));
  scored.sort((a, b) => a.zoneCount - b.zoneCount);
  return scored.slice(0, count).map((x) => x.p);
}

/**
 * Assign players to positions, minimizing repeated positions.
 * Handles 1B restriction if firstBaseEligible is provided.
 */
function assignPositions(players, positions, assignment, playedAt, firstBaseEligible) {
  let remaining = [...players];
  let remainingPos = [...positions];

  // Handle C restriction: prefer players who haven't caught yet
  if (remainingPos.includes('C')) {
    const neverCaught = remaining.filter((p) => (playedAt[p.id]['C'] || 0) === 0);
    const pool = neverCaught.length > 0 ? neverCaught : remaining;
    pool.sort((a, b) => (playedAt[a.id]['C'] || 0) - (playedAt[b.id]['C'] || 0));
    const picked = pool[0];
    assignment[picked.id] = 'C';
    remaining = remaining.filter((p) => p.id !== picked.id);
    remainingPos = remainingPos.filter((pos) => pos !== 'C');
  }

  // Handle 1B restriction: only eligible players
  if (firstBaseEligible && remainingPos.includes('1B')) {
    const eligibleFor1B = remaining.filter(
      (p) => firstBaseEligible.includes(p.id)
    );
    if (eligibleFor1B.length > 0) {
      // Pick the eligible player who has played 1B the least
      eligibleFor1B.sort(
        (a, b) => (playedAt[a.id]['1B'] || 0) - (playedAt[b.id]['1B'] || 0)
      );
      const picked = eligibleFor1B[0];
      assignment[picked.id] = '1B';
      remaining = remaining.filter((p) => p.id !== picked.id);
      remainingPos = remainingPos.filter((pos) => pos !== '1B');
    } else {
      // No eligible player – just leave 1B in pool and assign anyone
    }
  }

  // For remaining positions, use a greedy assignment minimizing repeated positions
  // Build a cost matrix and use a simple greedy (good enough for small N)
  const assigned = greedyAssign(remaining, remainingPos, playedAt);
  Object.assign(assignment, assigned);
}

/**
 * Greedy position assignment: for each position (sorted by scarcity of eligible players),
 * pick the player who has played that position least.
 * Players who have already played a position twice receive a large penalty so they
 * are only chosen if there is genuinely no other option.
 */
function greedyAssign(players, positions, playedAt) {
  const result = {};
  const usedPlayers = new Set();
  const shuffledPositions = [...positions];

  // Sort positions: most constrained first (most players already at 2+ plays),
  // then by total plays ascending as a tiebreaker.
  shuffledPositions.sort((a, b) => {
    const constA = players.reduce((s, p) => s + ((playedAt[p.id][a] || 0) >= 2 ? 1 : 0), 0);
    const constB = players.reduce((s, p) => s + ((playedAt[p.id][b] || 0) >= 2 ? 1 : 0), 0);
    if (constA !== constB) return constB - constA;
    const totalA = players.reduce((s, p) => s + (playedAt[p.id][a] || 0), 0);
    const totalB = players.reduce((s, p) => s + (playedAt[p.id][b] || 0), 0);
    return totalA - totalB;
  });

  for (const pos of shuffledPositions) {
    const available = players.filter((p) => !usedPlayers.has(p.id));
    if (available.length === 0) break;

    // Heavily penalise anyone who has already played this position twice or more
    available.sort((a, b) => {
      const countA = playedAt[a.id][pos] || 0;
      const countB = playedAt[b.id][pos] || 0;
      const scoreA = countA >= 2 ? countA + 100 : countA;
      const scoreB = countB >= 2 ? countB + 100 : countB;
      return scoreA - scoreB;
    });
    const picked = available[0];
    result[picked.id] = pos;
    usedPlayers.add(picked.id);
  }

  return result;
}

/**
 * Generate a random batting order (Fisher-Yates shuffle).
 * Players marked benchFirst (late arrivals) are shuffled to the end.
 */
export function generateBattingOrder(players) {
  const shuffle = (arr) => {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  const onTime = players.filter((p) => !p.benchFirst);
  const late   = players.filter((p) => p.benchFirst);
  return [...shuffle(onTime), ...shuffle(late)];
}

/**
 * Build a summary of how many innings each player spent at each position.
 */
export function buildSummary(players, innings) {
  const summary = {};
  players.forEach((p) => {
    summary[p.id] = { name: p.name, positions: {}, bench: 0, played: 0 };
    ALL_POSITIONS.forEach((pos) => (summary[p.id].positions[pos] = 0));
  });

  innings.forEach(({ assignment }) => {
    Object.entries(assignment).forEach(([playerId, pos]) => {
      if (pos === 'BENCH') {
        summary[playerId].bench++;
      } else {
        summary[playerId].positions[pos]++;
        summary[playerId].played++;
      }
    });
  });

  return summary;
}
