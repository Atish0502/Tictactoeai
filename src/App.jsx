import { useEffect, useMemo, useState } from 'react'

const WINS = [
  [0,1,2],[3,4,5],[6,7,8],
  [0,3,6],[1,4,7],[2,5,8],
  [0,4,8],[2,4,6],
]

function evaluate(board) {
  for (const [a,b,c] of WINS) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) return board[a]
  }
  if (board.every(Boolean)) return 'draw'
  return null
}

function availableMoves(board) {
  const idxs = []
  for (let i=0;i<9;i++) if (!board[i]) idxs.push(i)
  return idxs
}

// Minimax with optional depth cap + randomness for difficulty levels
function minimax(board, ai, human, isMaximizing, depth, depthCap) {
  const outcome = evaluate(board)
  if (outcome === ai) return 10 - depth
  if (outcome === human) return depth - 10
  if (outcome === 'draw') return 0
  if (depthCap !== Infinity && depth >= depthCap) return 0

  if (isMaximizing) {
    let best = -Infinity
    for (const i of availableMoves(board)) {
      board[i] = ai
      best = Math.max(best, minimax(board, ai, human, false, depth+1, depthCap))
      board[i] = null
    }
    return best
  } else {
    let best = Infinity
    for (const i of availableMoves(board)) {
      board[i] = human
      best = Math.min(best, minimax(board, ai, human, true, depth+1, depthCap))
      board[i] = null
    }
    return best
  }
}

function pickBestMove(board, ai, human, difficulty) {
  const empties = availableMoves(board)
  if (empties.length === 0) return undefined

  // Difficulty selection
  // easy: 60% random; medium: depth cap; hard: full minimax
  if (difficulty === 'easy' && Math.random() < 0.6) {
    return empties[Math.floor(Math.random()*empties.length)]
  }

  const depthCap = difficulty === 'medium' ? 3 : Infinity
  let bestScore = -Infinity
  let bestMoves = []
  for (const i of empties) {
    board[i] = ai
    const score = minimax(board, ai, human, false, 0, depthCap)
    board[i] = null
    if (score > bestScore) { bestScore = score; bestMoves = [i] }
    else if (score === bestScore) bestMoves.push(i)
  }
  // small randomness to avoid always same opening
  return bestMoves[Math.floor(Math.random()*bestMoves.length)]
}

export default function App() {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [humanPlays, setHumanPlays] = useState('X') // 'X' or 'O'
  const ai = humanPlays === 'X' ? 'O' : 'X'
  const [turn, setTurn] = useState('X') // whose turn symbol
  const [difficulty, setDifficulty] = useState('hard') // easy | medium | hard

  const status = useMemo(() => evaluate(board), [board])

  // If AI's turn, make a move after a short delay
  useEffect(() => {
    if (status || turn !== ai) return
    const id = setTimeout(() => {
      const move = pickBestMove([...board], ai, humanPlays, difficulty)
      if (move !== undefined) {
        setBoard(prev => {
          if (prev[move]) return prev
          const next = [...prev]; next[move] = ai; return next
        })
        setTurn(prev => (prev === 'X' ? 'Y' : 'X') && (ai === 'X' ? 'O' : 'X')) // dummy flip first
        setTurn(humanPlays) // ensure next is human
      }
    }, 400)
    return () => clearTimeout(id)
  }, [board, ai, humanPlays, turn, status, difficulty])

  function handleCell(i) {
    if (status || turn !== humanPlays || board[i]) return
    setBoard(prev => {
      const next = [...prev]; next[i] = humanPlays; return next
    })
    setTurn(ai)
  }

  function reset(newHuman = humanPlays) {
    setBoard(Array(9).fill(null))
    setTurn('X')
    setHumanPlays(newHuman)
  }

  // Auto-move if computer starts as 'X'
  useEffect(() => {
    if (turn === 'X' && humanPlays === 'O' && !status) {
      // trigger AI move on mount/reset
      const id = setTimeout(() => setTurn(ai), 50)
      return () => clearTimeout(id)
    }
  }, [humanPlays, turn, ai, status])

  return (
    <div className="container">
      <div className="card">
        <h1>Tic Tac Toe (Minimax)</h1>
        <p className="sub">Human vs Computer • Difficulty:&nbsp;
          <strong style={{textTransform:'capitalize'}}>{difficulty}</strong>
        </p>

        <div className="controls">
          <label>
            <span style={{marginRight:8}}>Difficulty</span>
            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Impossible</option>
            </select>
          </label>
          <label>
            <span style={{marginRight:8}}>You play</span>
            <select
              value={humanPlays}
              onChange={e => reset(e.target.value)}
            >
              <option value="X">X (first)</option>
              <option value="O">O (second)</option>
            </select>
          </label>
          <button className="ghost" onClick={() => reset(humanPlays)}>Reset</button>
          <button className="primary" onClick={() => reset(humanPlays)}>New Game</button>
        </div>

        <div className="board" style={{marginTop:16}}>
          {board.map((cell, i) => (
            <button
              key={i}
              className="cell"
              onClick={() => handleCell(i)}
              disabled={!!cell || !!status || turn !== humanPlays}
            >
              {cell ?? ''}
            </button>
          ))}
        </div>

        <div className="status">
          {!status ? (
            <span>Turn: <kbd>{turn}</kbd> &nbsp; {turn === humanPlays ? '(You)' : '(Computer)'}</span>
          ) : status === 'draw' ? (
            <span>It&apos;s a draw.</span>
          ) : (
            <span>Winner: <kbd>{status}</kbd> {status === humanPlays ? '🎉 You win!' : '🤖 AI wins'}</span>
          )}
        </div>

        <footer>
          Tip: press <kbd>Reset</kbd> after changing difficulty/side.
        </footer>
      </div>
    </div>
  )
}
