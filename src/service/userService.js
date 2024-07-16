const bcrypt = require('bcrypt');
const { encodeToken } = require("../helpers/jwtAuth");
const userModel = require('../models/userModel');
const Yup = require('yup');

const userProfileCreate = async (req) => {
    try {
        // Validate request body
        const registrationModel = Yup.object().shape({
            name: Yup.string().required('Name is required'),
            email: Yup.string().email().required('Email is required'),
            phone: Yup.string().required('Phone is required'),
            password: Yup.string().required('Password is required')
                                    .min(8, 'Password must be at least 8 characters long')
                                    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
                                    .matches(/[0-9]/, 'Password must contain at least one number')
                                    .matches(/[@$!%*?&#]/, 'Password must contain at least one special character'),
        
           confirmPassword: Yup.string()
                                .required('Confirm password is required')
                                .oneOf([Yup.ref('password'), null], 'Passwords must match')                         
        })

        await registrationModel.validate(req.body, { abortEarly: false });

        // Hash the password
        const password = await bcrypt.hash(req.body.password, 10);

        // Extract user details from the request body
        const { name, email, phone } = req.body;

        // Create user in the database
        await userModel.create({ name, email, phone, password });

        // Return success response
        return { status: "success", message: "User created successfully" };
    } catch (e) {
        // Handle errors
        console.error("Error in userProfileCreate:", e);
        return { status: "fail", message: e.message || "Something went wrong" };
    }
};

const loginUserService = async (req) => {
    try {
        const { email, password } = req.body;

        // Find user by email
        const user = await userModel.findOne({ email });
        if (!user) {
            throw new Error('User not found');
        }

        // Compare passwords
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new Error('Invalid password');
        }

        // Generate token
        const token = encodeToken(user.email, user._id);
        return { status: "success", message: "User logged in", token };
    } catch (error) {
        console.error('Error in loginUserService:', error);
        throw error;
    }
};

const readProfileService = async (req) => {
    try {
        const email = req.headers['email'];
        const userProfile = await userModel.findOne({ email }); // Assuming you only want to find one user profile
        if (userProfile) {
            return { status: "success", data: userProfile };
        } else {
            return { status: "fail", message: "User profile not found" };
        }
    } catch (e) {
        return { status: "fail", message: 'Something went wrong' };
    }
};



const updateUserService = async (req) => {
    try {
        const { password, image, role } = req.body;
        const email = req.headers['email'];

        if (!password && !image && !role) {
            // No fields to update
            return { status: "fail", message: "No fields to update" };
        }

        const updateFields = {};
        if (password) {
            // Validate and hash the new password
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.password = hashedPassword;
        }
        if (image) {
            updateFields.image = image;
        }
        if (role) {
            updateFields.role = role;
        }

        // Update the user document
        await userModel.updateOne({ email }, { $set: updateFields }, { upsert: true });

        return { status: "success", message: "Profile updated" };
    } catch (error) {
        console.error("Error in updateUserService:", error);
        return { status: "fail", message: "Something went wrong in service" };
    }
};

module.exports = {
    userProfileCreate,
    loginUserService,
    readProfileService,
    updateUserService,
};
