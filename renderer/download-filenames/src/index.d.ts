declare namespace NodeJS {
  interface Global {
    logger: import('winston').Logger
  }
}

declare const logger: import('winston').Logger
