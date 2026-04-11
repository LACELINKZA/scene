import sql from "@/app/api/utils/sql";
import * as argon2 from "argon2";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { error: "Username and password required" },
        { status: 400 },
      );
    }

    // Find admin user
    const admins = await sql`
      SELECT * FROM admin_users WHERE username = ${username}
    `;

    if (admins.length === 0) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const admin = admins[0];

    // Verify password
    const valid = await argon2.verify(admin.password_hash, password);

    if (!valid) {
      return Response.json({ error: "Invalid credentials" }, { status: 401 });
    }

    // Generate simple token (in production, use JWT)
    const token = Buffer.from(`${admin.id}:${Date.now()}`).toString("base64");

    return Response.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
      },
    });
  } catch (error) {
    console.error("Admin login error:", error);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
