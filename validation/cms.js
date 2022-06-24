const Validator = require("validator");
const isEmpty = require("is-empty");
module.exports = function validateCmsInput(data) {
    let errors = {};
    data.identifier = !isEmpty(data.identifier) ? data.identifier : "";
    data.subject = !isEmpty(data.subject) ? data.subject : "";
    data.content = !isEmpty(data.content) ? data.content : "";
    if (Validator.isEmpty(data.identifier)) {
        errors.identifier = "Identifier field is required";
    }
    if (Validator.isEmpty(data.subject)) {
        errors.subject = "Subject field is required";
    }
    if (Validator.isEmpty(data.content)) {
        errors.content = "Content field is required";
    }
    return {
        errors,
        isValid: isEmpty(errors)
    };
};
