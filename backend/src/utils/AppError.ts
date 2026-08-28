export class AppError extends Error {
  public readonly statusCode: number;
  public readonly userMessage: string;

  constructor(userMessage: string, statusCode = 500, internalMessage?: string) {
    super(internalMessage ?? userMessage);
    this.statusCode = statusCode;
    this.userMessage = userMessage;
    this.name = "AppError";
  }
}
