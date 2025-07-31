// asyncHandler middleware: Wraps an async route handler (fn) so that any thrown error is caught and passed to next (Express's error handler).
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
