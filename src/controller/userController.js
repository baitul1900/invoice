const { userProfileCreate, loginUserService, readProfileService, updateUserService } = require('../service/userService');


exports.userRegistration = async (req, res) => {
    try {
        const resBody = await userProfileCreate(req);
        return res.status(200).json(resBody);
    } catch (e) {
        console.error('Error in userRegistration:', e);
        return res.status(500).json({ status: "fail", message: "something went wrong" });
    }
}

exports.userLoginController = async (req, res) => {
    try {
        const result = await loginUserService(req);
        if (result.status === "success") {
            const cookieOption = { expires: new Date(Date.now() + 24 * 60 * 60 * 1000), httpOnly: true };
            res.cookie('token', result.token, cookieOption);
            return res.status(200).json(result);
        } else {
            return res.status(401).json({ status: "fail", message: "Invalid credentials" });
        }
    } catch (e) {
        console.error('Error in userLoginController:', e);
        return res.status(500).json({ status: "fail", message: "something went wrong" });
    }
};

exports.profileDetails = async (req, res) => {
    try {
        const result = await readProfileService(req);
        if (result.status === "success") {
            return res.status(200).json(result);
        } else {
            return res.status(404).json(result);
        }
    } catch (e) {
        console.error('Error in profileDetails:', e);
        return res.status(500).json({ status: "fail", message: "something went wrong" });
    }
};

exports.updateProfile = async (req, res) => {
    try {
        const result = await updateUserService(req);
        return res.status(200).json(result);
    } catch (e) {
        console.error('Error in updateProfile:', e);
        return res.status(500).json({ status: "fail", message: "something went wrong" });
    }
};
