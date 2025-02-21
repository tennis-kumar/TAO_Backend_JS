const errorHandler = (error, req, res, next) => {
    console.error("Error:", error.stack || error.message);
    res.status(error.statusCode || 500).json({
      message: error.message || "Internal Server Error",
    });
  };
  
  export default errorHandler;  