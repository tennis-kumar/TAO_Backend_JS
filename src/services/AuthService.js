import { generateToken } from "../utils/jwtUtils.js";

class AuthService {
  static async loginUser(req, user) {
    return new Promise((resolve, reject) => {
      req.logIn(user, (err) => (err ? reject(err) : resolve()));
    });
  }

  static generateAuthToken(user) {
    return generateToken(user);
  }

  static getAuthSuccessUrl(token) {
    const redirectUrl = new URL("/auth-success", process.env.CLIENT_URL);
    redirectUrl.searchParams.set("token", token);
    return redirectUrl.toString();
  }
}

export default AuthService;