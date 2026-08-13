// Error domain aplikasi: membawa status HTTP + kode error machine-readable.
// Dilempar dari service/controller, dirender errorHandler sebagai `{ error: { code, message } }`.
export class AppError extends Error {
  status: number;
  code: string;

  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
