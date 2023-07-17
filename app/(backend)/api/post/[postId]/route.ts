import { revalidatePath } from "next/cache";
import { NextRequest, NextResponse } from "next/server";



import { postSelectContent } from "@/lib/helpers";
import { prisma } from "@/lib/prisma";





type paramsProps = { params: { postId: string } }

export async function GET(request: NextRequest, { params }: paramsProps) {
  const { postId } = params
  const getPost = await prisma.post.findFirst({
    where: {
      id: Number(postId),
    },
    select: postSelectContent,
  })
  // console.log(getPost)
  revalidatePath("/")
  return NextResponse.json(getPost)
}



export async function DELETE(request: NextRequest, { params }: paramsProps) {
  const { postId } = params

  const votesForPost = await prisma.vote.findMany({
    where: {
      postId: parseInt(postId),
    },
  })

  if (votesForPost.length > 0) {
    await prisma.vote.deleteMany({
      where: {
        postId: parseInt(postId),
      },
    })
  }


  const deletedPost = await prisma.post.delete({
    where: {
      id: Number(postId),
    },
  })

  return NextResponse.json(deletedPost)
}


export async function POST(request: NextRequest, { params }: paramsProps) {
  try {
     const { postId } = params

    if (!postId) {
      return new Response("Post ID is missing", { status: 400 })
    }

    const viewedPost = await prisma.post.update({
      where: { id: parseInt(postId) },
      data: { viewsNum: { increment: 1 } },
    })
    return NextResponse.json(viewedPost)
  } catch (error: any) {
    console.error("Error updating views:", error)
    return new Response("Internal Server Error", { status: 500 })
  }
}



export async function PUT(request: NextRequest, { params }: paramsProps) {
  try {
    const { postId } = params

    if (!postId) {
      return new Response("Post ID is missing", { status: 400 })
    }

    const {
      cohortName,
      syllabusName,
      sessionName,
      leaderName,
      summary,
    } = await request.json();

    const cohort = await prisma.cohort.upsert({
      where: { name: cohortName },
      create: { name: cohortName },
      update: {},
    });

    const syllabus = await prisma.syllabus.upsert({
      where: { name: syllabusName },
      create: { name: syllabusName },
      update: {},
    });

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(postId) },
      data: {
        sessionName,
        leaderName,
        cohort: { connect: { id: cohort.id } },
        syllabus: { connect: { id: syllabus.id } },
        summary,
      },
    });

    return NextResponse.json(updatedPost)
  } catch (error: any) {
    console.error("Error updating post", error);
    return new Response("Internal Server Error", { status: 500 })
  } finally {
    prisma.$disconnect();
  }
}