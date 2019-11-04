import { ELOFormula } from '../elo'

it('can calculate ELO', () => {
  const formula = ELOFormula(32)
  const newRating = formula(1500, 1200, 'loss')
  console.log('new rating: ', newRating)

  expect(newRating).toEqual(1473)
})
