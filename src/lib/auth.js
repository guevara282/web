module.exports = {
    isLoggedIn (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        return res.redirect('/signin');
    }

    , isNotLogguedIn(req, res, next){

        if (!req.isAuthenticated()) {
            console.log(' no iniciado')
            
            return next();

        }
        console.log(' iniciado0000000');
         return res.redirect('/profile');
    }
};