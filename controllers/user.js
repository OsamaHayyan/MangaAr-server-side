import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import nodemalier from "nodemailer";
import sendgridTransport from "nodemailer-sendgrid-transport";
import dotenv from "dotenv";
import User from "../models/user.js";

import { errorCode, errorHandler } from "../error/errorsHandler.js";
import { deleteDirAndFiles } from "../util/file.js";
import { isObjectId } from "../util/is_objectId.js";
import webpConvertion from "../util/webpConvertion.js";
dotenv.config();

export const signup = async (req, res, next) => {
  try {
    const email = req.body.email;
    const username = req.body.username;
    const password = req.body.password;
    const confirmPw = req.body.confirm;
    const photoPath = req.file
      ? await webpConvertion("profile_photo", req.file.path)
      : "public/profile_photo/default/placeholder-avatar.png";

    if (password != confirmPw) {
      const message = "confirm passwrod is wrong";
      errorCode(message, 400);
    }
    const hashedPw = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email,
      username: username,
      photo: photoPath,
      password: hashedPw,
    });
    res.status(201).json({
      message: "User Created",
      userId: user._id,
    });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const login = async (req, res, next) => {
  try {
    const email = req.body.email;
    const user = await User.findOne({ email: email })
      .select("email admin username photo superuser favorite")
      .lean();

    const token = jwt.sign(
      {
        email: user.email,
        username: user.username,
        image: user.photo,
        userId: user._id.toString(),
        admin: user.admin,
        superuser: user.superuser,
        favorite: user.favorite,
      },
      process.env.SECRECT_KEY,
      { expiresIn: "3h" }
    );

    return res
      .cookie("access_token", token, {
        expires: new Date(Date.now() + 3 * (60 * 60 * 1000)),
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
      })
      .status(201)
      .json({
        message: "Logged in successfully 😊 👌",
      });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const logout = async (req, res, next) => {
  try {
    return res
      .clearCookie("access_token")
      .status(200)
      .json({ message: "Successfully logged out 😏 🍀" });
  } catch (error) {
    next(errorHandler(error));
  }
};

export const sendResetPwToken = async (req, res, next) => {
  try {
    const email = req.body.email;

    const token = Math.floor(Math.random() * 100000);
    const date = Date.now() + 300000;
    await User.updateOne(
      { email: email },
      { resetToken: token, resetTokenExpiration: date }
    );

    //send to email
    const transport = nodemalier.createTransport(
      sendgridTransport({
        auth: {
          api_key: process.env.SENDGRID_API_KEY,
        },
      })
    );

    await transport.sendMail({
      to: email,
      from: "mangasitedevelopment@gmail.com",
      subject: "reset password",
      html: `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
      <html data-editor-version="2" class="sg-campaigns" xmlns="http://www.w3.org/1999/xhtml">
          <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1">
            <!--[if !mso]><!-->
            <meta http-equiv="X-UA-Compatible" content="IE=Edge">
            <!--<![endif]-->
            <!--[if (gte mso 9)|(IE)]>
            <xml>
              <o:OfficeDocumentSettings>
                <o:AllowPNG/>
                <o:PixelsPerInch>96</o:PixelsPerInch>
              </o:OfficeDocumentSettings>
            </xml>
            <![endif]-->
            <!--[if (gte mso 9)|(IE)]>
        <style type="text/css">
          body {width: 600px;margin: 0 auto;}
          table {border-collapse: collapse;}
          table, td {mso-table-lspace: 0pt;mso-table-rspace: 0pt;}
          img {-ms-interpolation-mode: bicubic;}
        </style>
      <![endif]-->
            <style type="text/css">
          body, p, div {
            font-family: inherit;
            font-size: 14px;
          }
          body {
            color: #000000;
          }
          body a {
            color: #1188E6;
            text-decoration: none;
          }
          p { margin: 0; padding: 0; }
          table.wrapper {
            width:100% !important;
            table-layout: fixed;
            -webkit-font-smoothing: antialiased;
            -webkit-text-size-adjust: 100%;
            -moz-text-size-adjust: 100%;
            -ms-text-size-adjust: 100%;
          }
          img.max-width {
            max-width: 100% !important;
          }
          .column.of-2 {
            width: 50%;
          }
          .column.of-3 {
            width: 33.333%;
          }
          .column.of-4 {
            width: 25%;
          }
          ul ul ul ul  {
            list-style-type: disc !important;
          }
          ol ol {
            list-style-type: lower-roman !important;
          }
          ol ol ol {
            list-style-type: lower-latin !important;
          }
          ol ol ol ol {
            list-style-type: decimal !important;
          }
          @media screen and (max-width:480px) {
            .preheader .rightColumnContent,
            .footer .rightColumnContent {
              text-align: left !important;
            }
            .preheader .rightColumnContent div,
            .preheader .rightColumnContent span,
            .footer .rightColumnContent div,
            .footer .rightColumnContent span {
              text-align: left !important;
            }
            .preheader .rightColumnContent,
            .preheader .leftColumnContent {
              font-size: 80% !important;
              padding: 5px 0;
            }
            table.wrapper-mobile {
              width: 100% !important;
              table-layout: fixed;
            }
            img.max-width {
              height: auto !important;
              max-width: 100% !important;
            }
            a.bulletproof-button {
              display: block !important;
              width: auto !important;
              font-size: 80%;
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
            .columns {
              width: 100% !important;
            }
            .column {
              display: block !important;
              width: 100% !important;
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }
            .social-icon-column {
              display: inline-block !important;
            }
          }
        </style>
            <!--user entered Head Start--><link href="https://fonts.googleapis.com/css?family=Chivo&display=swap" rel="stylesheet"><style>
      body {font-family: 'Chivo', sans-serif;}
      </style><!--End Head user entered-->
          </head>
          <body>
            <center class="wrapper" data-link-color="#1188E6" data-body-style="font-size:14px; font-family:inherit; color:#000000; background-color:#FFFFFF;">
              <div class="webkit">
                <table cellpadding="0" cellspacing="0" border="0" width="100%" class="wrapper" bgcolor="#FFFFFF">
                  <tr>
                    <td valign="top" bgcolor="#FFFFFF" width="100%">
                      <table width="100%" role="content-container" class="outer" align="center" cellpadding="0" cellspacing="0" border="0">
                        <tr>
                          <td width="100%">
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                              <tr>
                                <td>
                                  <!--[if mso]>
          <center>
          <table><tr><td width="600">
        <![endif]-->
                                          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%; max-width:600px;" align="center">
                                            <tr>
                                              <td role="modules-container" style="padding:0px 0px 0px 0px; color:#000000; text-align:left;" bgcolor="#FFFFFF" width="100%" align="left"><table class="module preheader preheader-hide" role="module" data-type="preheader" border="0" cellpadding="0" cellspacing="0" width="100%" style="display: none !important; mso-hide: all; visibility: hidden; opacity: 0; color: transparent; height: 0; width: 0;">
          <tr>
            <td role="module-content">
              <p></p>
            </td>
          </tr>
        </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:0px 0px 0px 0px;" bgcolor="#FFFFFF" data-distribution="1">
          <tbody>
            <tr role="module-content">
              <td height="100%" valign="top"><table width="600" style="width:600px; border-spacing:0; border-collapse:collapse; margin:0px 0px 0px 0px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
            <tbody>
              <tr>
                <td style="padding:0px;margin:0px;border-spacing:0;"><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="00cedc83-bd19-445a-9c66-2bb531df0ee8">
          <tbody>
            <tr>
              <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
                <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:100% !important; width:100%; height:auto !important;" width="600" alt="" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/954c252fedab403f/defda58d-23f4-46cb-828f-77dee4a44953/600x24.png">
              </td>
            </tr>
          </tbody>
        </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="a731ff8e-714a-4629-85fe-07a3791ae070" data-mc-module-version="2019-10-22">
          <tbody>
            <tr>
              <td style="padding:18px 0px 18px 0px; line-height:40px; text-align:inherit; background-color:#94e55a;" height="100%" valign="top" bgcolor="#94e55a" role="module-content"><div><h1 style="text-align: center">Manga Ar - Reset Password</h1><div></div></div></td>
            </tr>
          </tbody>
        </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="0439ab5b-e48d-4678-b644-de6e5a115565">
          <tbody>
            <tr>
              <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%" valign="top" bgcolor="">
                <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="7px" style="line-height:7px; font-size:7px;">
                  <tbody>
                    <tr>
                      <td style="padding:0px 0px 7px 0px;" bgcolor="#ffffff"></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table></td>
              </tr>
            </tbody>
          </table></td>
            </tr>
          </tbody>
        </table><table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" role="module" data-type="columns" style="padding:50px 0px 0px 30px;" bgcolor="#fff7ea" data-distribution="1">
          <tbody>
            <tr role="module-content">
              <td height="100%" valign="top"><table width="550" style="width:550px; border-spacing:0; border-collapse:collapse; margin:0px 10px 0px 10px;" cellpadding="0" cellspacing="0" align="left" border="0" bgcolor="" class="column column-0">
            <tbody>
              <tr>
                <td style="padding:0px;margin:0px;border-spacing:0;"><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="b16a4afb-f245-4156-968e-8080176990ea" data-mc-module-version="2019-10-22">
          <tbody>
            <tr>
              <td style="padding:18px 40px 0px 0px; line-height:22px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="color: #00634a; font-size: 24px">We received a request to reset your account</span></div><div></div></div></td>
            </tr>
          </tbody>
        </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="b16a4afb-f245-4156-968e-8080176990ea.1" data-mc-module-version="2019-10-22">
          <tbody>
            <tr>
              <td style="padding:18px 40px 10px 0px; line-height:18px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="color: #00634a"><strong>Protecting your data is important to us.</strong></span></div>
      <div style="font-family: inherit; text-align: inherit"><span style="color: #00634a"><strong>Please copy the code below and past it in reset password page</strong></span></div><div></div></div></td>
            </tr>
          </tbody>
        </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="d9460159-480c-495a-889f-8c7537faa9ed" data-mc-module-version="2019-10-22">
          <tbody>
            <tr>
              <td style="padding:18px 0px 18px 0px; line-height:20px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: center"><span style="font-size: 30px; font-family: &quot;courier new&quot;, courier, monospace"><strong>${token}</strong></span></div><div></div></div></td>
            </tr>
          </tbody>
        </table><table class="module" role="module" data-type="spacer" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="c97177b8-c172-4c4b-b5bd-7604cde23e3f">
          <tbody>
            <tr>
              <td style="padding:0px 0px 10px 0px;" role="module-content" bgcolor="">
              </td>
            </tr>
          </tbody>
        </table><table class="module" role="module" data-type="text" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="b16a4afb-f245-4156-968e-8080176990ea.1.1" data-mc-module-version="2019-10-22">
          <tbody>
            <tr>
              <td style="padding:18px 40px 10px 0px; line-height:18px; text-align:inherit;" height="100%" valign="top" bgcolor="" role="module-content"><div><div style="font-family: inherit; text-align: inherit"><span style="color: #00634a">If you did not request a password change, please just ignore this email</span></div><div></div></div></td>
            </tr>
          </tbody>
        </table></td>
              </tr>
            </tbody>
          </table></td>
            </tr>
          </tbody>
        </table><table class="module" role="module" data-type="divider" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="38ec2680-c847-4765-8c5f-aa2aba19a2b3">
          <tbody>
            <tr>
              <td style="padding:0px 0px 0px 0px;" role="module-content" height="100%" valign="top" bgcolor="">
                <table border="0" cellpadding="0" cellspacing="0" align="center" width="100%" height="7px" style="line-height:7px; font-size:7px;">
                  <tbody>
                    <tr>
                      <td style="padding:0px 0px 7px 0px;" bgcolor="#ffffff"></td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          </tbody>
        </table><table class="wrapper" role="module" data-type="image" border="0" cellpadding="0" cellspacing="0" width="100%" style="table-layout: fixed;" data-muid="7a8a420f-bc0f-4307-bd09-412a5ff00998">
          <tbody>
            <tr>
              <td style="font-size:6px; line-height:10px; padding:0px 0px 0px 0px;" valign="top" align="center">
                <img class="max-width" border="0" style="display:block; color:#000000; text-decoration:none; font-family:Helvetica, arial, sans-serif; font-size:16px; max-width:100% !important; width:100%; height:auto !important;" width="600" alt="" data-proportionally-constrained="true" data-responsive="true" src="http://cdn.mcauto-images-production.sendgrid.net/954c252fedab403f/93a17c3c-cf4b-40a6-9cae-ff0c223945a4/600x56.png">
              </td>
            </tr>
          </tbody>
        </table></td>
                                            </tr>
                                          </table>
                                          <!--[if mso]>
                                        </td>
                                      </tr>
                                    </table>
                                  </center>
                                  <![endif]-->
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </div>
            </center>
          </body>
        </html>`,
    });
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const checkToken = async (req, res, next) => {
  try {
    const token = req.body.token;
    const email = req.body.email;
    const codeCheck = await User.exists({
      email: email,
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!codeCheck) {
      const message = "Please try again";
      errorCode(message, 400);
    }

    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const token = req.body.token;
    const codeCheck = await User.exists({
      email: email,
      resetToken: token,
      resetTokenExpiration: { $gt: Date.now() },
    });
    if (!codeCheck) {
      const message = "Please try again";
      errorCode(message, 400);
    }

    const hashPassword = await bcrypt.hash(password, 12);
    await User.updateOne(
      { email: email },
      { password: hashPassword, resetToken: null, resetTokenExpiration: null }
    ).lean();
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    if (!userId) {
      const message = "no user found";
      errorCode(message, 400);
    }
    const user = await User.findById(userId)
      .select("username email recent favorite")
      .lean();
    res.status(200).json(user);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const editeUser = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const username = req.body.username;
    const email = req.body.email;
    const photo = req.file
      ? await webpConvertion("profile_photo", req.file.path)
      : undefined;
    const user = await User.findById(userId).select("photo -_id").lean();

    if (req.file) {
      const prePhoto = user.photo;
      await deleteDirAndFiles(prePhoto);
    }

    await User.findByIdAndUpdate(userId, {
      username: username,
      email: email,
      photo: photo,
    });

    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const editePassword = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const newPw = req.body.password;

    const hashedPw = await bcrypt.hash(newPw, 12);
    await User.updateOne({ _id: userId }, { password: hashedPw });

    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getAllUsers = async (req, res, next) => {
  try {
    const page = req.query?.page || 1;
    const PAGE_SIZE = 10;
    const skip = (page - 1) * PAGE_SIZE;
    const users = await User.find().skip(skip).limit(PAGE_SIZE).lean();
    res.status(200).json(users);
  } catch (error) {
    next(errorHandler(error));
  }
};

export const addAdmin = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    await User.updateOne({ _id: userId }, { admin: true });
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const removeAdmin = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    await User.updateOne({ _id: userId }, { admin: false });
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const userId = req.body.userId;

    const user = await User.findOneAndDelete({ _id: userId })
      .select("photo -_id")
      .lean();
    if (!user) {
      errorCode("User not found", 404);
    }
    const photoPath = user.photo;
    if (photoPath != "public/profile_photo/default/placeholder-avatar.png") {
      await deleteDirAndFiles(photoPath);
    }
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const addFavorite = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const mangaId = req.params.mangaId;
    if (!userId || !mangaId) {
      const message = "User Or Manga not found";
      errorCode(message, 400);
    }
    await isObjectId([mangaId, userId]);

    const mangaExist = await User.exists({ _id: userId, favorite: mangaId });
    if (req.user.superuser === false && !mangaExist) {
      await User.updateOne({ _id: userId }, { $push: { favorite: mangaId } });
    }
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getFavorite = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId)
      .select("favorite")
      .populate("favorite", "image title")
      .lean();
  } catch (error) {
    next(errorHandler(error));
  }
};

export const deleteFavorite = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const mangaId = req.params.mangaId;

    if (!userId || !mangaId) {
      const message = "Manga not found";
      errorCode(message, 400);
    }

    await User.updateOne({ _id: userId }, { $pull: { favorite: mangaId } });
    res.status(200).json("success");
  } catch (error) {
    next(errorHandler(error));
  }
};

export const getRecent = async (req, res, next) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      const message = "User Not Found";
      errorCode(message, 400);
    }

    const recent = await User.findOne({ _id: userId }).select("recent").lean();
    return res.status(200).json(recent);
  } catch (error) {
    next(errorHandler(error));
  }
};
