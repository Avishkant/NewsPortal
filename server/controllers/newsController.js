import News from "../models/News.js";
import District from "../models/District.js";
import Category from "../models/Category.js";
import { v2 as cloudinary } from "cloudinary";

// Helper: strip HTML tags and entities for server-side validation
function stripHtml(s = "") {
  let t = String(s || "");
  // remove tags
  t = t.replace(/<[^>]*>/g, "");
  // remove common HTML entities (e.g. &nbsp;) and any &...; patterns
  t = t.replace(/&[^;]+;/g, " ");
  // collapse whitespace
  t = t.replace(/\s+/g, " ").trim();
  return t;
}
export async function listNews(req, res) {
  const filter = {};

  const normalize = (s = "") =>
    String(s || "")
      .toLowerCase()
      .replace(/[\s\-]+/g, "")
      .replace(/[^\p{L}\p{N}]+/gu, "")
      .trim();

  // CATEGORY handling (robust: exact, normalized, or state shortcut)
  if (req.query.category) {
    const cat = String(req.query.category || "").trim();
    if (cat) {
      const key = normalize(cat);
      if (key.includes("madhya") || key.includes("मध्य")) {
        // expand to all MP districts
        try {
          const districts = await District.find({
            $or: [
              { state: /madhya/i },
              { slug: /madhya-pradesh/i },
              { name: /madhya|मध्य/i },
            ],
          }).lean();
          const names = (districts || []).map((d) => d.name).filter(Boolean);
          if (names.length) filter.district = { $in: names };
        } catch (err) {
          console.error("Failed to expand MP districts from category", err);
        }
      } else {
        // try to resolve category name from Category collection
        const esc = cat.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
        try {
          const exact = await Category.findOne({
            name: { $regex: `^${esc}$`, $options: "i" },
          }).lean();
          if (exact && exact.name) {
            filter.category = exact.name;
          } else {
            const cats = await Category.find().lean();
            const found = (cats || []).find((c) => normalize(c.name) === key);
            if (found && found.name) filter.category = found.name;
            else filter.category = { $regex: `^${esc}$`, $options: "i" };
          }
        } catch (err) {
          console.error("Category lookup failed", err);
          filter.category = { $regex: `^${esc}$`, $options: "i" };
        }
      }
    }
  }

  // DISTRICT handling (support madhya-pradesh as state shortcut)
  if (req.query.district || req.query.state) {
    const districtParam = req.query.district || req.query.state;
    const key = normalize(String(districtParam || ""));
    if (key.includes("madhya") || key.includes("मध्य")) {
      try {
        const districts = await District.find({
          $or: [
            { state: /madhya/i },
            { slug: /madhya-pradesh/i },
            { name: /madhya|मध्य/i },
          ],
        }).lean();
        const names = (districts || []).map((d) => d.name).filter(Boolean);
        if (names.length) filter.district = { $in: names };
      } catch (err) {
        console.error("Failed to expand MP districts", err);
      }
    } else {
      const dval = String(districtParam || "").trim();
      if (dval) {
        const escD = dval.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&");
        filter.district = { $regex: `^${escD}$`, $options: "i" };
      }
    }
  }

  // STATUS filter (e.g., pending, approved, rejected)
  if (req.query.status) {
    const s = String(req.query.status || "")
      .trim()
      .toLowerCase();
    if (s) filter.status = s;
  }

  // SEARCH
  if (req.query.q) {
    const q = String(req.query.q || "").trim();
    if (q) {
      const re = new RegExp(q.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&"), "i");
      filter.$or = filter.$or || [];
      filter.$or.push({ title: re }, { content: re });
    }
  }

  // Authorization: reporters see own pending too; public sees only approved
  if (!req.user || req.user.role !== "owner") {
    if (req.user && req.user.role === "reporter") {
      filter.$or = [{ approved: true }, { author: req.user._id }];
    } else {
      filter.approved = true;
    }
  }

  // pagination
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
  const skip = (page - 1) * limit;

  const total = await News.countDocuments(filter);

  const items = await News.find(filter)
    .populate("author", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);
  // Try to ensure images are valid. To avoid making too many Cloudinary admin
  // API calls for large lists, validate only the first N items; for the rest
  // we fall back to constructing best-effort URLs.
  try {
    const MAX_VALIDATE = 25;
    const validateCount = Math.min(items.length, MAX_VALIDATE);
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const hasImage = !!it.image;
      const looksLikeUrl = hasImage && /^https?:\/\//i.test(it.image);
      if (it.cloudinaryPublicId && !looksLikeUrl) {
        if (i < validateCount) {
          try {
            const info = await cloudinary.api.resource(it.cloudinaryPublicId);
            if (info && info.secure_url) it.image = info.secure_url;
            else
              it.image = cloudinary.url(it.cloudinaryPublicId, {
                secure: true,
                fetch_format: "auto",
                quality: "auto",
              });
          } catch (err) {
            const isNotFound =
              err &&
              (err.http_code === 404 || /not found/i.test(err.message || ""));
            if (isNotFound) {
              it.image = null;
            } else {
              try {
                it.image = cloudinary.url(it.cloudinaryPublicId, {
                  secure: true,
                  fetch_format: "auto",
                  quality: "auto",
                });
              } catch (_) {
                if (it.cloudinaryPublicId)
                  it.image = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${it.cloudinaryPublicId}`;
              }
            }
          }
        } else {
          // For items beyond the validation cap, build a best-effort URL.
          try {
            it.image = cloudinary.url(it.cloudinaryPublicId, {
              secure: true,
              fetch_format: "auto",
              quality: "auto",
            });
          } catch (err) {
            if (it.cloudinaryPublicId)
              it.image = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${it.cloudinaryPublicId}`;
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to build cloudinary URLs for listNews", err);
  }

  res.json({ items, total, page, limit });
}

// Return news authored by authenticated user
export async function listMine(req, res) {
  const filter = { author: req.user._id };
  // optional filter by status: all | pending | approved
  const clientFilter = String(req.query.filter || "all").toLowerCase();
  if (clientFilter === "pending") {
    filter.$or = [{ status: "pending" }, { approved: false }];
  } else if (clientFilter === "approved") {
    filter.status = "approved";
    filter.approved = { $ne: false };
  }
  const page = Math.max(1, parseInt(req.query.page || "1", 10));
  const limit = Math.max(1, parseInt(req.query.limit || "10", 10));
  const skip = (page - 1) * limit;

  const total = await News.countDocuments(filter);

  const items = await News.find(filter)
    .populate("author", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  res.json({ items, total, page, limit });
}

// Headlines endpoint
export async function headlines(req, res) {
  const baseFilter = { headline: true };
  if (!req.user || req.user.role !== "owner") {
    if (req.user && req.user.role === "reporter") {
      baseFilter.$or = [{ approved: true }, { author: req.user._id }];
    } else {
      baseFilter.approved = true;
    }
  }

  let items = await News.find(baseFilter)
    .populate("author", "name email")
    .sort({ createdAt: -1 })
    .limit(5);

  if (!items || items.length === 0) {
    const recentFilter = {};
    if (!req.user || req.user.role !== "owner") {
      if (req.user && req.user.role === "reporter") {
        recentFilter.$or = [{ approved: true }, { author: req.user._id }];
      } else {
        recentFilter.approved = true;
      }
    }
    items = await News.find(recentFilter)
      .populate("author", "name email")
      .sort({ createdAt: -1 })
      .limit(5);
  }
  // Ensure cloudinary URLs for headlines
  try {
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      const hasImage = !!it.image;
      const looksLikeUrl = hasImage && /^https?:\/\//i.test(it.image);
      if (it.cloudinaryPublicId && !looksLikeUrl) {
        try {
          const info = await cloudinary.api.resource(it.cloudinaryPublicId);
          if (info && info.secure_url) it.image = info.secure_url;
          else
            it.image = cloudinary.url(it.cloudinaryPublicId, {
              secure: true,
              fetch_format: "auto",
              quality: "auto",
            });
        } catch (err) {
          const isNotFound =
            err &&
            (err.http_code === 404 || /not found/i.test(err.message || ""));
          if (isNotFound) {
            it.image = null;
          } else {
            try {
              it.image = cloudinary.url(it.cloudinaryPublicId, {
                secure: true,
                fetch_format: "auto",
                quality: "auto",
              });
            } catch (_) {
              if (it.cloudinaryPublicId)
                it.image = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${it.cloudinaryPublicId}`;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error("Failed to build cloudinary URLs for headlines", err);
  }

  res.json(items);
}

// Create a news item (reporter or owner)
export async function createNews(req, res) {
  console.log("POST /api/news body:", req.body);
  let {
    title,
    slug,
    content,
    category,
    image,
    imagePublicId,
    district,
    youtubeLink,
  } = req.body || {};

  const missing = [];
  if (!title || !String(title).trim()) missing.push("title");
  if (!slug || !String(slug).trim()) {
    if (title) {
      try {
        slug = String(title)
          .toLowerCase()
          .replace(/[^\u0000-\u007F\p{L}\p{N}]+/gu, "-")
          .replace(/(^-|-$)/g, "");
      } catch (err) {
        slug = String(title)
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
      }
    }
    if (!slug) slug = `news-${Date.now()}`;
  }
  if (!content || !stripHtml(content)) missing.push("content");
  if (missing.length)
    return res.status(400).json({ message: "Missing fields", missing });

  const exists = await News.findOne({ slug });
  if (exists) return res.status(400).json({ message: "Slug must be unique" });

  const isReporter = req.user && req.user.role === "reporter";
  const news = await News.create({
    title,
    slug,
    content,
    category,
    district,
    youtubeLink,
    image,
    cloudinaryPublicId: imagePublicId,
    author: req.user._id,
    headline: !!req.body.headline,
    status: isReporter ? "pending" : "approved",
    approved: isReporter ? false : true,
  });
  res.status(201).json(news);
}

// Get a news item by id and increment views
export async function getNewsById(req, res) {
  const news = await News.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  ).populate("author", "name email");
  if (!news) return res.status(404).json({ message: "Not found" });
  if (!news.approved) {
    const isOwner = req.user && req.user.role === "owner";
    const isAuthor =
      req.user &&
      news.author &&
      (news.author._id
        ? news.author._id.toString() === String(req.user._id)
        : news.author.toString() === String(req.user._id));
    if (!isOwner && !isAuthor)
      return res.status(404).json({ message: "Not found" });
  }
  // If image is stored as a Cloudinary public id (or missing full URL),
  // attempt to resolve the actual secure URL using Cloudinary admin API.
  try {
    const hasImage = !!news.image;
    const looksLikeUrl = hasImage && /^https?:\/\//i.test(news.image);
    if (news.cloudinaryPublicId && !looksLikeUrl) {
      try {
        // Prefer asking Cloudinary for resource info (gives secure_url)
        const info = await cloudinary.api.resource(news.cloudinaryPublicId);
        if (info && info.secure_url) {
          news.image = info.secure_url;
        } else {
          // fallback to URL builder
          news.image = cloudinary.url(news.cloudinaryPublicId, {
            secure: true,
            fetch_format: "auto",
            quality: "auto",
          });
        }
      } catch (err) {
        // If resource not found (404) then don't return a broken URL.
        // Cloudinary errors often include an http_code property.
        const isNotFound =
          err &&
          (err.http_code === 404 || /not found/i.test(err.message || ""));
        if (isNotFound) {
          news.image = null; // let client show placeholder instead
        } else {
          // non-404 error: try best-effort URL construction
          try {
            news.image = cloudinary.url(news.cloudinaryPublicId, {
              secure: true,
              fetch_format: "auto",
              quality: "auto",
            });
          } catch (err2) {
            if (news.cloudinaryPublicId) {
              news.image = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/${news.cloudinaryPublicId}`;
            }
          }
        }
      }
    }
  } catch (err) {
    console.error(
      "Failed to resolve cloudinary image URL for getNewsById",
      err
    );
  }

  res.json(news);
}

// Update a news item
export async function updateNews(req, res) {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ message: "Not found" });
  const isOwner = req.user && req.user.role === "owner";
  const isAuthor =
    req.user &&
    news.author &&
    (news.author._id
      ? news.author._id.toString() === String(req.user._id)
      : news.author.toString() === String(req.user._id));
  if (!isOwner && !isAuthor)
    return res.status(403).json({ message: "Forbidden" });

  const allowed = [
    "title",
    "slug",
    "content",
    "category",
    "district",
    "image",
    "youtubeLink",
    "imagePublicId",
    "headline",
    "status",
    "approved",
  ];

  if (
    req.body.imagePublicId &&
    req.body.imagePublicId !== news.cloudinaryPublicId
  ) {
    if (news.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(news.cloudinaryPublicId);
      } catch (err) {
        console.error(
          "Failed to delete previous cloudinary image on update",
          err
        );
      }
    }
    news.cloudinaryPublicId = req.body.imagePublicId;
  }

  if (req.user.role !== "owner" && news.approved) {
    const draft = {
      title: req.body.title !== undefined ? req.body.title : news.title,
      slug: (news.slug || "news") + "-edit-" + Date.now().toString(36),
      content: req.body.content !== undefined ? req.body.content : news.content,
      category:
        req.body.category !== undefined ? req.body.category : news.category,
      district:
        req.body.district !== undefined ? req.body.district : news.district,
      youtubeLink:
        req.body.youtubeLink !== undefined
          ? req.body.youtubeLink
          : news.youtubeLink,
      image: req.body.image !== undefined ? req.body.image : news.image,
      cloudinaryPublicId:
        req.body.imagePublicId !== undefined
          ? req.body.imagePublicId
          : news.cloudinaryPublicId,
      author: req.user._id,
      headline: !!req.body.headline,
      status: "pending",
      approved: false,
      replaces: news._id,
    };

    let exists = await News.findOne({ slug: draft.slug });
    if (exists)
      draft.slug = draft.slug + "-" + Math.random().toString(36).slice(2, 8);

    const created = await News.create(draft);
    console.log(
      `Created draft ${created._id} by reporter ${req.user._id} to replace ${news._id}`
    );
    return res.status(201).json(created);
  }

  allowed.forEach((k) => {
    if (k === "imagePublicId") return;
    if ((k === "approved" || k === "status") && req.user.role !== "owner")
      return;
    if (req.body[k] !== undefined) news[k] = req.body[k];
  });

  await news.save();

  if (req.user.role === "owner" && news.replaces && news.approved) {
    try {
      const original = await News.findById(news.replaces);
      if (original) {
        if (
          news.cloudinaryPublicId &&
          news.cloudinaryPublicId !== original.cloudinaryPublicId
        ) {
          if (original.cloudinaryPublicId) {
            try {
              await cloudinary.uploader.destroy(original.cloudinaryPublicId);
            } catch (err) {
              console.error(
                "Failed to delete previous cloudinary image on replace",
                err
              );
            }
          }
          original.cloudinaryPublicId = news.cloudinaryPublicId;
        }

        original.title = news.title;
        original.content = news.content;
        original.category = news.category;
        original.district = news.district;
        original.youtubeLink = news.youtubeLink;
        original.image = news.image;
        original.headline = news.headline;
        original.status = "approved";
        original.approved = true;

        await original.save();
        await News.findByIdAndDelete(news._id);
        return res.json(original);
      }
    } catch (err) {
      console.error("Failed to apply approved draft to original", err);
    }
  }

  if (req.user.role !== "owner") {
    news.status = "pending";
    news.approved = false;
    await news.save();
  }

  res.json(news);
}

// Delete a news item
export async function deleteNews(req, res) {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ message: "Not found" });
  const isOwnerDel = req.user && req.user.role === "owner";
  const isAuthorDel =
    req.user &&
    news.author &&
    (news.author._id
      ? news.author._id.toString() === String(req.user._id)
      : news.author.toString() === String(req.user._id));
  if (!isOwnerDel && !isAuthorDel)
    return res.status(403).json({ message: "Forbidden" });
  if (req.user.role === "reporter" && !news.approved) {
    return res
      .status(403)
      .json({ message: "Pending articles cannot be deleted by reporter" });
  }

  if (news.cloudinaryPublicId) {
    try {
      await cloudinary.uploader.destroy(news.cloudinaryPublicId);
    } catch (err) {
      console.error("Failed to delete cloudinary image", err);
    }
  }

  await News.findByIdAndDelete(news._id);
  res.json({ message: "Deleted" });
}

// Request delete (reporter)
export async function requestDelete(req, res) {
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ message: "Not found" });
  const isAuthorReq =
    req.user &&
    news.author &&
    (news.author._id
      ? news.author._id.toString() === String(req.user._id)
      : news.author.toString() === String(req.user._id));
  if (!isAuthorReq) return res.status(403).json({ message: "Forbidden" });
  if (!news.approved)
    return res.status(400).json({
      message: "Only approved articles can be requested for deletion",
    });
  news.deletionRequested = true;
  news.deletionRequestedBy = req.user._id;
  news.deletionRequestedAt = new Date();
  await news.save();
  res.json({ message: "Deletion requested; owner will review" });
}

// Owner: list deletion requests
export async function listDeletionRequests(req, res) {
  if (req.user.role !== "owner")
    return res.status(403).json({ message: "Forbidden" });
  const items = await News.find({ deletionRequested: true })
    .populate("author", "name email")
    .sort({ deletionRequestedAt: -1 });
  res.json(items);
}

// Owner: handle deletion request
export async function handleDeletion(req, res) {
  if (req.user.role !== "owner")
    return res.status(403).json({ message: "Forbidden" });
  const news = await News.findById(req.params.id);
  if (!news) return res.status(404).json({ message: "Not found" });
  const approve = !!req.body.approve;
  if (!news.deletionRequested)
    return res
      .status(400)
      .json({ message: "No deletion request for this article" });

  if (approve) {
    if (news.cloudinaryPublicId) {
      try {
        await cloudinary.uploader.destroy(news.cloudinaryPublicId);
      } catch (err) {
        console.error(
          "Failed to delete cloudinary image during owner-approved deletion",
          err
        );
      }
    }
    await News.findByIdAndDelete(news._id);
    return res.json({ message: "Deleted" });
  }

  news.deletionRequested = false;
  news.deletionRequestedBy = undefined;
  news.deletionRequestedAt = undefined;
  await news.save();
  res.json(news);
}
