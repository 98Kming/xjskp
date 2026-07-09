// src/router/errors.ts

export class NavigationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'NavigationError'
  }
}
