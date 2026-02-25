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
    const sitters = chooseSitters(
      players,
      benchCount,
      lastBench,
      benchPerInning,
      inning
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
 */
function chooseSitters(players, benchCount, lastBench, count, inningIndex) {
  if (count === 0) return [];

  // Sort candidates: prefer players who haven't sat yet (or sat least),
  // but NEVER pick someone who sat last inning.
  const eligible = players.filter((p) => !lastBench[p.id]);

  // Sort by bench count descending (most rested first), then by id for stability
  const sorted = [...eligible].sort((a, b) => {
    const diff = benchCount[a.id] - benchCount[b.id];
    if (diff !== 0) return diff; // fewer bench stints first (opposite – pick those with fewer to spread)
    return a.id.localeCompare(b.id);
  });

  // We want equal bench time: pick those with fewest bench innings
  // But also distribute fairly – rotate who sits
  // Use a secondary sort: rotate by player index offset by inning
  const withScore = eligible.map((p) => ({
    p,
    score: benchCount[p.id] * 1000 + players.indexOf(p), // primary: fewer bench stints
  }));
  withScore.sort((a, b) => a.score - b.score);

  return withScore.slice(0, count).map((x) => x.p.id);
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
  // Handle 1B restriction
  let remaining = [...players];
  let remainingPos = [...positions];

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
 */
function greedyAssign(players, positions, playedAt) {
  const result = {};
  const usedPlayers = new Set();
  const shuffledPositions = [...positions];

  // Sort positions by how many times they've been played (rarest first)
  shuffledPositions.sort((a, b) => {
    const totalA = players.reduce((s, p) => s + (playedAt[p.id][a] || 0), 0);
    const totalB = players.reduce((s, p) => s + (playedAt[p.id][b] || 0), 0);
    return totalA - totalB;
  });

  for (const pos of shuffledPositions) {
    const available = players.filter((p) => !usedPlayers.has(p.id));
    if (available.length === 0) break;

    // Pick the player with least experience at this position
    available.sort(
      (a, b) => (playedAt[a.id][pos] || 0) - (playedAt[b.id][pos] || 0)
    );
    const picked = available[0];
    result[picked.id] = pos;
    usedPlayers.add(picked.id);
  }

  return result;
}

/**
 * Generate a random batting order (Fisher-Yates shuffle).
 * Returns a new array of players in a randomised order.
 */
export function generateBattingOrder(players) {
  const order = [...players];
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
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
