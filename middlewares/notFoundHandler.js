
const notFoundHandler = (req, res, next) => {
    res.status(404).render('user/404');
};

module.exports = notFoundHandler;