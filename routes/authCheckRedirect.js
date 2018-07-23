let locations = [
  new RegExp('/mon-espace/?.*'),
  new RegExp('/profile-modif/?.*')
];


module.exports = function(app){
  locations.map(location => {
    app.get(location, (req, res, next) => {
      if(req.isAuthenticated()){
        next();
      }else{
        res.redirect('/connexion');
      }
    });
  });
}
