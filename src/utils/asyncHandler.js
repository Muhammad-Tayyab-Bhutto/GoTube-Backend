const asyncHandler = (requestHandler) => {
    return (request, response, next) => {
        Promise.resolve(requestHandler(request, response, next)).catch((error) => next(error));
    }
}

// or we can do above like below
/** 
 * const asyncHandler = (requestHandler) => (async (request, response, next) => {
 *  try {
 *      await requestHandler(request, response, next);
 *  } catch (e) {
 *      response.status(e.statusCode || 500).json({ success: false, message: e.message});
 *  }
 * }
 */

export { asyncHandler }