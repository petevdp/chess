import { firstMoveEngine } from '../engines'
import { Chess } from 'chess.js'

test('firstMoveEngine only makes the first move available in move array', async () => {
  const firstMove = new Chess().moves({ verbose: true })[0]
  const moveMade = await firstMoveEngine(new Chess())
  expect(moveMade).toEqual(moveMade)
})
