import { UserDetails } from "../../../common/types"
import { AuthServiceInterface } from "../auth.service"

const currentUser: UserDetails = {
  id: 'peteid',
  username: 'pete',
  type: 'human'
}

export class FakeAuthService implements AuthServiceInterface {
  useCurrentUser () {
    return currentUser
  }

  async login () {
    return currentUser
  }

  async logout () { return true }

  complete () {}
}
