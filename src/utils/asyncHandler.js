/*
    1. asyncHandler is a higher-order function, because:
        - It takes another function (fn) as input
        - It returns a new function that wraps the original one with extra behavior (like error handling)

    2. asyncHandler helps to avoid writing try/catch in every async route.

    3. When do I need it(HOF)?
    => 	When you want to abstract and reuse logic (like error handling, logging, etc.)

*/


// you must return the inner async function, because that’s what Express will run as your route handler.
const asyncHandler = (fn)=> async (req, res, next)=>{
    try {
        await fn(req, res, next)
    } catch (error) {
        res.status(error.code || 500).json({
            success:false,
            message:error.message
        })
    }
}



export {asyncHandler}