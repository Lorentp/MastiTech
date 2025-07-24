const express = require("express")
const router = express.Router()
const UserModel = require("../models/user.model")

router.post("/", async (req,res) =>{
    const {username, password, farmname} = req.body
    try {
        await UserModel.create ({
            username,
            password,
            farmname
        })
        res.send({ message: "Usuario creado con exito"})
    } catch (error) {
        res.send(error)
    }
})

module.exports = router