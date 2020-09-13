const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

const pool = require('../database');
const helpers = require('./helpers');

passport.use('local.signin', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'contraseña',
  passReqToCallback: true
}, async (req, correo, contraseña, done) => {
  const rows = await pool.query('SELECT * FROM usuario WHERE correo = ?', [correo]);
  if (rows.length > 0) {
    console.log("iniicio usuario");
    const user = rows[0];
    const validPassword = await helpers.matchPassword(contraseña, user.contraseña)
    if (validPassword) {
      done(null, user, req.flash('success', 'Welcome ' + user.nombre));

    } else {
      done(null, false, req.flash('message', 'Incorrect Password'));
    }
  } else {
    console.log("iniicio tecnico");
    const rows2 = await pool.query('SELECT * FROM tecnicos WHERE correo = ?', [correo]);
    if (rows2.length > 0) {
      const user = rows2[0];
      const validPassword = await helpers.matchPassword(contraseña, user.contraseña);
      if (validPassword) {
        await pool.query('UPDATE  tecnicos SET estado = 1 WHERE correo=?', [correo]);
        done(null, user, req.flash('success', 'Welcome ' + user.nombre));

      } else {
        done(null, false, req.flash('message', 'Incorrect Password'));
      }

    } else {
      const rows3 = await pool.query('SELECT * FROM admin WHERE correo = ?', [correo]);
      if (rows3.length > 0) {
        const user = rows3[0];
        if (contraseña = user.contraseña) {
          done(null, user, req.flash('success', 'Welcome ' + user.nombre));
        }else{
          return done(null, false, req.flash('message', 'The Username does not exists.'));
        }
      }
      return done(null, false, req.flash('message', 'The Username does not exists.'));
    }
  }

}));

passport.use('local.signup', new LocalStrategy({
  usernameField: 'correo',
  passwordField: 'contraseña',
  passReqToCallback: true
}, async (req, correo, contraseña, done) => {
  console.log("paso correo");

  const { nombre, apellido, identificacion, rol } = req.body;
  let newUser = {
    identificacion,
    nombre,
    apellido, correo, contraseña, rol
  };
  console.log(newUser.rol + "rolllllll");
  newUser.contraseña = await helpers.encryptPassword(contraseña);
  // Saving in the Database
  if (newUser.rol == "1") {

    
    const result = await pool.query('INSERT INTO usuario SET ? ', [newUser]);

  } else if (newUser.rol == "2") {

    const result = await pool.query('INSERT INTO tecnicos SET ? ', [newUser]);
  }
  console.log(newUser.identificacion + "identiiiiii");
  return done(null, newUser);
}));

passport.serializeUser((user, done) => {
  done(null, user.identificacion);
});

passport.deserializeUser(async (identificacion, done) => {
  console.log(identificacion);
  const rows = await pool.query('SELECT * FROM usuario WHERE identificacion = ?', [identificacion]);
  if (rows.length == 0) {
    const rows2 = await pool.query('SELECT * FROM tecnicos WHERE identificacion = ?', [identificacion]);
    if(rows2.length==0){
      const rows3= await pool.query('SELECT * FROM admin WHERE identificacion=?', [identificacion]);
      done(null, rows3[0]);
    }else{
      done(null, rows2[0]);
    }
    
  } else {
    done(null, rows[0]);
  }
});

