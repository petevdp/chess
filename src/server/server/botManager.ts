import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { BotDetails } from '../../common/types'
import newBotClient, { BotClient } from '../../bots/botClient'

interface BotManagerInterface {
  addBot: (details: BotDetails) => Promise<boolean>;
  removeBot: (id: string) => Promise<boolean>;
}

class SingleThreadedBotManager implements BotManagerInterface {
  private botMap = new Map<string, BotClient>()

  async addBot (details: BotDetails) {
    const resolveBotClient = newBotClient(details)
    resolveBotClient.catch((err) => {
      throw err
    })

    if (this.botMap.has(details.id)) {
      throw new Error(`bot with id ${details.id} already exists`)
    }

    this.botMap.set(details.id, await resolveBotClient)
    return true
  }

  async removeBot (id: string) {
    const bot = this.botMap.get(id)
    if (!bot) {
      throw new Error(`bot with id ${id} not found`)
    }
    this.botMap.delete(id)
    bot.disconnect()
    return true
  }
}

export class MultithreadedBotManager implements BotManagerInterface {
  private botProcessMap = new Map<string, ChildProcessWithoutNullStreams>()

  async addBot (details: BotDetails) {
    console.log('adding bot', details.username)

    if (details.type !== 'bot') {
      throw new Error('user must be bot')
    }

    if (this.botProcessMap.has(details.id)) {
      throw new Error(`bot with id ${details.id} already exists`)
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
    return true
  }

  async removeBot (id: string) {
    const bot = this.botProcessMap.get(id)
    if (!bot) {
      throw new Error(`bot with id ${id} not found`)
    }
    bot.kill()
    return this.botProcessMap.delete(id)
  }
}

export default SingleThreadedBotManager
