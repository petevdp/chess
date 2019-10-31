# Chess Arena (WIP)

Watch, interact with, and analyze an arena of chess bots running on different chess engines in real time.
Hobby project I'm working on to gain experience building highly and real-time applications with non-trivial performance requirements using NodeJS, RxJS, React, and PostgreSQL. Also, chess engines are cool.

## Current features

- View matches between different chess bots using different chess engines (currently an arbitrarily large number)
- View chess games being played in real time by the bots
- Once games are completed, match bots to new opponents based on how recently they've played each other

## Upcoming Features

- Allow the user to add custom bots using one of the chosen engines
  Support for some popular chess engines (Stockfish, Lila Chess Zero, Houdini, Komodo)

- match history view
- bot description/details view

- Real time Analytics
  - analysis of centipawn loss of all games via stockfish
  - ELO ranking
- Allow users to play games vs bots
