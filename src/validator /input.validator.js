const inputValidateRules = (name, email,password, phone,image,res) => {

    const validationRules = {
      name: () => res.status(400).json({ message: "Name is required" }),
      email: () => res.status(400).json({ message: "Email is required " }),
      password: () => res.status(400).json({ message: "password is required " }),
      phone: () => res.status(400).json({ message: "phone is required " }),
      image: () => res.status(400).json({ message: "image is required " }),

    };
  
    for (const field of Object.keys(validationRules)) {
      if (!eval(field)) {
        return validationRules[field]();
      }
    }
  
    // Code to handle when all fields exist
  };
module.exports=inputValidateRules;