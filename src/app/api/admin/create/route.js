import sql from "@/app/api/utils/sql";
import * as argon2 from "argon2";

// This route is for initial admin creation only
// After creating your first admin, you should disable this route
export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return Response.json(
        { error: "Username and password required" },
        { status: 400 },
      );
    }

    // Hash password
    const hash = await argon2.hash(password);

    // Insert admin user
    const result = await sql`
      INSERT INTO admin_users (username, password_hash)
      VALUES (${username}, ${hash})
      RETURNING id, username, created_at
    `;

    return Response.json({
      success: true,
      admin: result[0],
      message:
        "Admin created successfully. Please disable this route in production.",
    });
  } catch (error) {
    console.error("Admin creation error:", error);

    if (error.message?.includes("unique")) {
      return Response.json(
        { error: "Admin username already exists" },
        { status: 400 },
      );
    }

    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
