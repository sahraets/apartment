/** Feil som controllerne oversetter til HTTP-statuskoder. */
export class ServiceError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ServiceError";
  }
}

export class ValidationError extends ServiceError {
  constructor(message: string) {
    super(message, 400);
    this.name = "ValidationError";
  }
}

export class NotFoundError extends ServiceError {
  constructor(message: string) {
    super(message, 404);
    this.name = "NotFoundError";
  }
}

export class UnauthorizedError extends ServiceError {
  constructor(message = "Ikke innlogget") {
    super(message, 401);
    this.name = "UnauthorizedError";
  }
}
