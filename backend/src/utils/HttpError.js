export class HttpError extends Error {
  // fields (optional): which inputs were wrong, e.g. { password: "Password is required" }
  constructor(status, code, message, fields) {
    super(message);
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}
