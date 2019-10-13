import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { BotDetails } from '../../common/types'

class BotManager {
  private botProcessMap = new Map<string, ChildProcessWithoutNullStreams>()

  constructor () { }

  addBot (details: BotDetails) {
    console.log('adding bot', details.username)

    if (details.type !== 'bot') {
      throw new Error('user must be bot')
    }
    const bot = spawn(
      'ts-node',
      ['../bots/botClient.ts', '--json', JSON.stringify(details)]
    )

    const { id } = details

    const logOutput = (data: any) => {
      console.log(`bot ${details.username}: ${data}`)
    }

    this.botProcessMap.set(id, bot)
    bot
      .on('exit', () => {
        this.botProcessMap.delete(id)
        bot.removeAllListeners()
      })

    // log child logs and errors
    bot.stdout.on('data', logOutput)
    bot.stderr.on('data', logOutput)
  }

  removeBot (id: string) {
    const bot = this.botProcessMap.get(id)
    if (!bot) {
      throw new Error(`bot with id ${id} not found`)
    }
    bot.kill()
    this.botProcessMap.delete(id)
  }
}

export default BotManager
