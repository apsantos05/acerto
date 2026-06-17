import { createClient } from "@/lib/supabase/server";
import type { FeedAuthor, FeedComment, FeedMaterial, FeedPost } from "@/lib/feed-types";

type ProfileRow = {
  id: string;
  full_name: string | null;
  email: string | null;
  city: string | null;
};

type MaterialRow = {
  id: string;
  title: string;
  subject: string | null;
  material_type: string | null;
};

type FeedPostRow = {
  id: string;
  content: string;
  tags: string[] | null;
  created_at: string;
  author: ProfileRow | ProfileRow[] | null;
  material: MaterialRow | MaterialRow[] | null;
};

type CommentRow = {
  id: string;
  post_id: string;
  content: string;
  created_at: string;
  author: ProfileRow | ProfileRow[] | null;
};

type IdRow = {
  post_id: string;
  user_id?: string;
};

function firstRelation<T>(value: T | T[] | null): T | null {
  if (Array.isArray(value)) {
    return value[0] ?? null;
  }

  return value;
}

function normalizeAuthor(profile: ProfileRow | ProfileRow[] | null): FeedAuthor {
  const author = firstRelation(profile);
  const name =
    author?.full_name || author?.email?.split("@")[0] || "Estudante Acerte";

  return {
    id: author?.id ?? "",
    name,
    email: author?.email ?? null,
    city: author?.city ?? null,
  };
}

function normalizeMaterial(material: MaterialRow | MaterialRow[] | null): FeedMaterial | null {
  const item = firstRelation(material);

  if (!item) {
    return null;
  }

  return {
    id: item.id,
    title: item.title,
    subject: item.subject ?? "Interdisciplinar",
    materialType: item.material_type ?? "Material",
  };
}

function formatDate(date: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

function groupComments(comments: CommentRow[]) {
  return comments.reduce<Record<string, FeedComment[]>>((acc, comment) => {
    const normalized: FeedComment = {
      id: comment.id,
      postId: comment.post_id,
      content: comment.content,
      createdAt: comment.created_at,
      author: normalizeAuthor(comment.author),
    };

    acc[comment.post_id] = [...(acc[comment.post_id] ?? []), normalized];
    return acc;
  }, {});
}

function countByPost(rows: IdRow[]) {
  return rows.reduce<Record<string, number>>((acc, row) => {
    acc[row.post_id] = (acc[row.post_id] ?? 0) + 1;
    return acc;
  }, {});
}

export async function getFeedData() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        posts: [],
        error: "Entre para acessar o feed da comunidade.",
      };
    }

    const { data: postsData, error: postsError } = await supabase
      .from("feed_posts")
      .select(
        `
          id,
          content,
          tags,
          created_at,
          author:profiles!feed_posts_author_id_fkey(id, full_name, email, city),
          material:materials!feed_posts_material_id_fkey(id, title, subject, material_type)
        `,
      )
      .order("created_at", { ascending: false })
      .limit(40);

    if (postsError) {
      throw postsError;
    }

    const rows = (postsData ?? []) as FeedPostRow[];
    const postIds = rows.map((post) => post.id);

    if (postIds.length === 0) {
      return {
        posts: [],
        error: null,
      };
    }

    const [commentsResult, likesResult, savedResult] = await Promise.all([
      supabase
        .from("post_comments")
        .select(
          `
            id,
            post_id,
            content,
            created_at,
            author:profiles!post_comments_author_id_fkey(id, full_name, email, city)
          `,
        )
        .in("post_id", postIds)
        .order("created_at", { ascending: true }),
      supabase
        .from("post_likes")
        .select("post_id,user_id")
        .in("post_id", postIds),
      supabase
        .from("saved_posts")
        .select("post_id,user_id")
        .eq("user_id", user.id)
        .in("post_id", postIds),
    ]);

    if (commentsResult.error) {
      throw commentsResult.error;
    }

    if (likesResult.error) {
      throw likesResult.error;
    }

    if (savedResult.error) {
      throw savedResult.error;
    }

    const commentsByPost = groupComments((commentsResult.data ?? []) as CommentRow[]);
    const likes = (likesResult.data ?? []) as IdRow[];
    const saved = (savedResult.data ?? []) as IdRow[];
    const likesByPost = countByPost(likes);
    const savedIds = new Set(saved.map((row) => row.post_id));
    const likedIds = new Set(
      likes
        .filter((row) => row.user_id === user.id)
        .map((row) => row.post_id),
    );

    const posts: FeedPost[] = rows.map((post) => {
      const comments = commentsByPost[post.id] ?? [];

      return {
        id: post.id,
        content: post.content,
        tags: post.tags ?? [],
        createdAt: post.created_at,
        publishedAt: formatDate(post.created_at),
        author: normalizeAuthor(post.author),
        material: normalizeMaterial(post.material),
        comments,
        likesCount: likesByPost[post.id] ?? 0,
        commentsCount: comments.length,
        isLikedByMe: likedIds.has(post.id),
        isSavedByMe: savedIds.has(post.id),
      };
    });

    return {
      posts,
      error: null,
    };
  } catch {
    return {
      posts: [],
      error:
        "Não foi possível carregar o feed. Confira a configuração do Supabase.",
    };
  }
}
