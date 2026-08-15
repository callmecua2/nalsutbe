import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma/prisma";
import { randomBytes } from "node:crypto";

interface login {
  username: string;
  password: string;
}

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

    const findUser = await prisma.user.findFirst({
      where : {
        name : username,
        password : password
      }
    })

    if(!findUser) {
      return NextResponse.json(
        {message : "User tidak ditemukan"},
        {status : 404}
      )
    }

    const UserToken = randomBytes(32).toString('hex')
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
