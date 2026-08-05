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
    const { title, description, pubDate, heroImage, content } = await request.json();

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
        { error: 'Konfigurasi GitHub API belum lengkap di .env.local.' },
        { status: 500 }
      );
    }

    const slug = slugify(title);
    const dateStr = pubDate || new Date().toISOString().split('T')[0];

    // Format Frontmatter + Body HTML/Markdown
    const markdownContent = `---
title: '${title.replace(/'/g, "''")}'
description: '${(description || '').replace(/'/g, "''")}'
pubDate: '${dateStr}'
${heroImage ? `heroImage: '${heroImage}'` : ''}
---

${content}
`;

    // Path target di repository Astro (sesuaikan jika folder content collections berbeda)
    const filePath = `src/content/blog/${slug}.md`;
    const githubApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

    // Encode konten ke Base64 (wajib untuk GitHub API)
    const encodedContent = Buffer.from(markdownContent, 'utf-8').toString('base64');

    // Cek apakah file sudah ada di repo (untuk mendapatkan SHA jika ini update)
    let sha: string | undefined;
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

    // Commit file ke GitHub
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

    if (!commitRes.ok) {
      const errorData = await commitRes.json();
      return NextResponse.json(
        { error: errorData.message || 'Gagal menyimpan file ke GitHub.' },
        { status: commitRes.status }
      );
    }

    const commitData = await commitRes.json();

    return NextResponse.json({
      success: true,
      message: 'Artikel berhasil dipublikasikan!',
      filePath: commitData.content.path,
      commitSha: commitData.commit.sha,
    });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}