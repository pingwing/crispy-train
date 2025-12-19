export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NotANumberError extends ValidationError {
  constructor(input: unknown) {
    super('Value is not a number', { input });
    this.name = 'NotANumberError';
  }
}
