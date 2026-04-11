import sql from "@/app/api/utils/sql";
import argon2 from "argon2";

export async function POST(request) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return Response.json(
        { error: "Username and password are required" },
        { status: 400 },
      );
    }

    // Find user by username
    const users = await sql`
      SELECT * FROM users WHERE username = ${username}
    `;

    if (users.length === 0) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const user = users[0];

    // Verify password
    if (!user.password_hash) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    const valid = await argon2.verify(user.password_hash, password);

    if (!valid) {
      return Response.json(
        { error: "Invalid username or password" },
        { status: 401 },
      );
    }

    // Return user data (without password)
    const { password_hash, ...userData } = user;
    return Response.json(userData);
  } catch (error) {
    console.error("Error signing in:", error);
    return Response.json({ error: "Failed to sign in" }, { status: 500 });
  }
}
