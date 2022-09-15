const checkAuth = (req, res, next) => {
    if(req.session.isAuth) {
        return next();
    }
    return res.send({
        status: 400,
        message: "Invalid Session. Please log in."
    })
}

module.exports = { checkAuth };