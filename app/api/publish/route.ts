import { NextResponse } from 'next/server';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, pubDate, heroImage, content } = body;

    if (!title || !content) {
      return NextResponse.json(
        { error: 'Judul dan konten wajib diisi.' },
        { status: 400 }
      );
    }

    const token = process.env.GITHUB_TOKEN;
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    if (!token || !owner || !repo) {
      return NextResponse.json(
        { error: 'Variabel GITHUB_TOKEN, GITHUB_OWNER, atau GITHUB_REPO belum diset di .env.local.' },
        { status: 500 }
      );
    }

    const slug = slugify(title);
    const dateStr = pubDate || new Date().toISOString().split('T')[0];

    const markdownContent = `---
title: '${title.replace(/'/g, "''")}'
description: '${(description || '').replace(/'/g, "''")}'
pubDate: '${dateStr}'
${heroImage ? `heroImage: '${heroImage}'` : ''}
---

${content}
`;

    const filePath = `src/content/blog/${slug}.md`;
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    const encodedContent = Buffer.from(markdownContent, 'utf-8').toString('base64');

    let sha: string | undefined;

    // Cek keberadaan file
    const checkFileRes = await fetch(`${githubApiUrl}?ref=${branch}`, {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
      },
      cache: 'no-store',
    });

    if (checkFileRes.ok) {
      const fileData = await checkFileRes.json();
      sha = fileData.sha;
    }

    // Commit ke GitHub
    const commitRes = await fetch(githubApiUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: 'application/vnd.github+json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: sha ? `docs(blog): update ${slug}` : `docs(blog): add ${slug}`,
        content: encodedContent,
        branch,
        ...(sha && { sha }),
      }),
    });

    const commitData = await commitRes.json();

    if (!commitRes.ok) {
      return NextResponse.json(
        { error: commitData.message || `GitHub API Error (${commitRes.status})` },
        { status: commitRes.status }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil dipublikasikan!',
      filePath: commitData.content.path,
      commitSha: commitData.commit.sha,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error('API Route Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error pada Next.js Backend.' },
      { status: 500 }
    );
  }
}