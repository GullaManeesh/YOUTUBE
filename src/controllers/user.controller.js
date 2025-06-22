import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/apiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";

//generating access and refresh tokens
const generateAccessAndRefreshTokens = async (userId) => {
  const user = await User.findById(userId);
  const accessToken = user.generateAccessToken();
  const refreshToken = user.generateRefreshToken();

  user.refreshToken = refreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken, refreshToken };
};

//register user
const registerUser = asyncHandler(async (req, res) => {
  //get data from user
  //validate user check fields are not empty
  //check whether user exists or not
  //check for images and avatar
  //upload images in cloudinary
  //create user in database
  //remove password and refreshtoken field from response
  //check user created or not
  //return res

  const { username, email, fullname, password } = req.body;

  if (
    [username, email, fullname, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) {
    throw new ApiError(409, "username or email already exists");
  }

  const avatarLocalPath = req.files?.avatar[0]?.path;
  //   const coverImageLocalPath = req.files?.coverImage[0]?.path;

  let coverImageLocalPath;

  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(400, "avatar is required");
  }

  const user = await User.create({
    username: username?.toLowerCase(),
    email,
    fullname,
    password,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
  });

  const createduser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createduser) {
    throw new ApiError(404, "something went wrong while registering user ");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createduser, "user registered successfully"));

  //end
});

//login user
const loginUser = asyncHandler(async (req, res) => {
  //get user data from form->req.body
  //check with username or email
  //check user data exists in database
  //if user exists check password is correct or not
  //if user cred correct -> access and refresh token generate
  //send token in cookies

  const { username, email, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "username or email are required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "user not found");
  }

  const isPasswordCorrect = user.isPasswordCorrect(password);

  if (!isPasswordCorrect) {
    throw new ApiError(401, "invalid password");
  }

  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .cookie("accessToken:", accessToken, options)
    .cookie("refreshToken:", refreshToken, options)
    .json(
      ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User logged in successfully"
      )
    );

  //end
});

//logout
const logoutUser = asyncHandler(async (req, res) => {
  User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    { new: true }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged out successfully"));
});

export { registerUser, loginUser, logoutUser };
