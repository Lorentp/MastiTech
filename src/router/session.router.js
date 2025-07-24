const express = require("express")
const router = express.Router()
const UserModel = require("../models/user.model")

router.post("/", async (req, res) => {
    const {username, password}= req.body
    try {
        const user = await UserModel.findOne ({ username: username })

        if(!user){
            req.session.errors = { username: "Error, el usuario no existe"}
            return res.redirect("/")
        }
        if(user.password !== password){
            req.session.errors = {password:"Error, contraseña incorrecta"}
            return res.redirect("/")
        }
        

        req.session.login = true
        req.session.user = user

       

        req.session.save((err) => {
            if (err) {
                console.error("Error al guardar la sesión:", err);
                return res.redirect("/");
            }
            res.redirect("/home");
        });
    } catch (error) {
        res.send(error)   
    }
})

router.get("/logout", async (req, res) => {
  if (req.session.login) {
    req.session.destroy();
  }
  res.redirect("/")
});

module.exports = router;