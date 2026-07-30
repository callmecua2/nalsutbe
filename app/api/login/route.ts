import { NextRequest, NextResponse } from "next/server";

interface login {
  username: string;
  password: string;
}

const UserName = process.env.APP_USERNAME
const UserPassword = process.env.APP_PASSWORD
const UserToken = "verylongpasswordtocheck"

console.log(UserName, UserPassword)

export async function POST (req : NextRequest) {
  try {
    const body = await req.json();
    const { username, password }: login = body;

    if (!username || !password) {
      return NextResponse.json(
        { message: "Missing required field" },
        { status: 400 },
      );
    }

    if(username !== UserName) {
      return NextResponse.json(
        { message: "Username salah" },
        { status: 400 },
      );
    }

    if(password !== UserPassword) {
      return NextResponse.json(
        { message: "Password Salah" },
        { status: 400 },
      );
    }

    if(username !== UserName && password !== UserPassword) {
      return NextResponse.json(
        { message: "Username dan Password Salah" },
        { status: 400 },
      );
    }

    const response = NextResponse.json({ message: "Success" }, { status: 200 });

    response.cookies.set("userLogin", UserToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60,
      path: "/",
    });

    return response

  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 },
    );
  }
};
