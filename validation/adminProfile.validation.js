import isEmpty from '../lib/isEmpty';

export const adminProfilesValid=(req,res,next)=>{

    let errors = {}, reqBody = req.body;
    let emailRegex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,6}))$/;

    if (isEmpty(reqBody.name)) {
        errors.name = "Name field is required";
    } 
    if (isEmpty(reqBody.phonenumber)) {
        errors.phonenumber = "Phonenumber field is required";
    } 
    if (!isEmpty(errors)) {
        return res.status(400).json({ "errors": errors })
    }

    return next();
}