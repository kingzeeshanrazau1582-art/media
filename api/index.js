// server/serverless.ts
import express2 from "express";

// server/routes/api.ts
import express from "express";
import multer from "multer";

// server/db.ts
import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
var SEED_FILE = path.join(process.cwd(), "server", "data.json");
var DATA_FILE = process.env.VERCEL ? path.join("/tmp", "mediaportal_data.json") : SEED_FILE;
var ENV_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || "admin";
var ENV_ADMIN_EMAIL = (process.env.DEFAULT_ADMIN_EMAIL || "admin@mediaportal.com").trim().toLowerCase();
var ENV_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || "Admin@12345";
var DEFAULT_ADMIN_HASH = bcrypt.hashSync(ENV_ADMIN_PASSWORD, 10);
var DEFAULT_USER_HASH = bcrypt.hashSync("User@12345", 10);
var INITIAL_DATA = {
  adminSettings: {
    id: "settings_1",
    adminUsername: ENV_ADMIN_USERNAME,
    adminEmail: ENV_ADMIN_EMAIL,
    portalName: "Media Portal",
    maxUploadSizeMb: 50,
    allowRegistration: true,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  },
  users: [
    {
      id: "usr_admin_1",
      name: ENV_ADMIN_USERNAME === "admin" ? "System Administrator" : ENV_ADMIN_USERNAME,
      email: ENV_ADMIN_EMAIL,
      passwordHash: DEFAULT_ADMIN_HASH,
      role: "ADMIN",
      status: "ACTIVE",
      createdAt: "2025-01-01T00:00:00.000Z",
      updatedAt: "2025-01-01T00:00:00.000Z",
      lastLoginAt: (/* @__PURE__ */ new Date()).toISOString()
    },
    {
      id: "usr_user_1",
      name: "Sarah Connor",
      email: "sarah.connor@example.com",
      passwordHash: DEFAULT_USER_HASH,
      role: "USER",
      status: "ACTIVE",
      createdAt: "2025-01-15T10:20:00.000Z",
      updatedAt: "2025-01-15T10:20:00.000Z",
      lastLoginAt: "2025-02-18T14:30:00.000Z"
    },
    {
      id: "usr_user_2",
      name: "Michael Scott",
      email: "michael.scott@example.com",
      passwordHash: DEFAULT_USER_HASH,
      role: "USER",
      status: "ACTIVE",
      createdAt: "2025-01-20T09:15:00.000Z",
      updatedAt: "2025-01-20T09:15:00.000Z",
      lastLoginAt: "2025-02-20T11:45:00.000Z"
    },
    {
      id: "usr_user_3",
      name: "Elena Rostova",
      email: "elena.rostova@example.com",
      passwordHash: DEFAULT_USER_HASH,
      role: "USER",
      status: "ACTIVE",
      createdAt: "2025-02-01T12:00:00.000Z",
      updatedAt: "2025-02-01T12:00:00.000Z",
      lastLoginAt: "2025-02-22T16:10:00.000Z"
    }
  ],
  media: [
    {
      id: "med_vid_1",
      title: "Cinematic Nature & Wildlife 4K Reel",
      description: "An aerial and close-up cinematic compilation capturing the untamed wilderness, alpine lakes, and alpine wildlife in stunning clarity.",
      type: "video",
      fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "34.2 MB",
      duration: "09:56",
      createdAt: "2025-02-10T08:00:00.000Z",
      updatedAt: "2025-02-10T08:00:00.000Z"
    },
    {
      id: "med_vid_2",
      title: "Next-Gen Quantum Computing Explained",
      description: "Educational overview detailing qubit mechanics, cryo-cooling frameworks, and real-world cryptographic implications.",
      type: "video",
      fileUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      thumbnailUrl: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "48.1 MB",
      duration: "10:54",
      createdAt: "2025-02-12T14:30:00.000Z",
      updatedAt: "2025-02-12T14:30:00.000Z"
    },
    {
      id: "med_photo_1",
      title: "Neon Cyberpunk Metropolis at Twilight",
      description: "Ultra high-definition night photography of Shinjuku crossing with rain reflections, glowing neon signs, and atmospheric haze.",
      type: "photo",
      fileUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=85",
      thumbnailUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "6.4 MB",
      createdAt: "2025-02-14T11:20:00.000Z",
      updatedAt: "2025-02-14T11:20:00.000Z"
    },
    {
      id: "med_photo_2",
      title: "Emerald Alpine Glacial Basin",
      description: "Crystal-clear high alpine lake surrounded by snow-capped peaks in the Canadian Rockies under morning sunlight.",
      type: "photo",
      fileUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=85",
      thumbnailUrl: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "8.2 MB",
      createdAt: "2025-02-15T09:40:00.000Z",
      updatedAt: "2025-02-15T09:40:00.000Z"
    },
    {
      id: "med_poster_1",
      title: "Design Forward 2025 Festival Poster",
      description: "Official promotional poster for the annual International Modern Typography and Digital Design Symposium.",
      type: "poster",
      fileUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85",
      thumbnailUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "11.5 MB",
      createdAt: "2025-02-16T16:00:00.000Z",
      updatedAt: "2025-02-16T16:00:00.000Z"
    },
    {
      id: "med_poster_2",
      title: "Solar Odyssey: Deep Space Missions Poster",
      description: "Minimalist retro-futuristic vector poster celebrating deep space solar exploration missions and gravitational assist trajectories.",
      type: "poster",
      fileUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=85",
      thumbnailUrl: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "9.1 MB",
      createdAt: "2025-02-17T13:10:00.000Z",
      updatedAt: "2025-02-17T13:10:00.000Z"
    },
    {
      id: "med_pdf_1",
      title: "Global Engineering Architecture Whitepaper.pdf",
      description: "Comprehensive technical whitepaper exploring cloud-native microservices, zero-trust security boundaries, and low-latency storage replication.",
      type: "pdf",
      fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      thumbnailUrl: "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "4.8 MB",
      pageCount: 32,
      previewContent: "Section 1: Executive Summary\nCloud modernization requires balancing elasticity with observable SLAs. This whitepaper sets the foundational metrics for cross-region disaster recovery and continuous data integrity validation.\n\nSection 2: High Availability Topologies\n- Multi-master consensus clusters\n- Edge-cached static content deliveries\n- Zero-downtime database migration pipelines\n\nSection 3: Security & Governance Compliance\nAll ingress traffic is subjected to TLS 1.3 encryption, automatic JWT validation, and RBAC token evaluation at the gateway level.",
      createdAt: "2025-02-18T10:00:00.000Z",
      updatedAt: "2025-02-18T10:00:00.000Z"
    },
    {
      id: "med_pptx_1",
      title: "Q3 Enterprise Product Strategy & Roadmap.pptx",
      description: "Executive pitch deck outlining product milestones, active customer retention metrics, engineering OKRs, and market penetration plans.",
      type: "presentation",
      fileUrl: "https://view.officeapps.live.com/op/view.aspx?src=sample.pptx",
      thumbnailUrl: "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "18.4 MB",
      slideCount: 14,
      previewContent: "Slide 1: Executive Vision - Delivering Unified Media Workflows\nSlide 2: Market Opportunity & Growth Tailwinds\nSlide 3: User Engagement Metrics (42% Increase MoM)\nSlide 4: System Architecture & Vercel Global Edge Latency\nSlide 5: Enterprise Security & Role-Based Access Control\nSlide 6: Q4 Financial Targets & Milestones",
      createdAt: "2025-02-19T15:20:00.000Z",
      updatedAt: "2025-02-19T15:20:00.000Z"
    },
    {
      id: "med_word_1",
      title: "Client Service Level Agreement & Terms.docx",
      description: "Official corporate template specifying SLA response thresholds, incident escalation matrices, and data protection compliance clauses.",
      type: "word",
      fileUrl: "https://view.officeapps.live.com/op/view.aspx?src=sample.docx",
      thumbnailUrl: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "1.2 MB",
      pageCount: 8,
      previewContent: "MASTER SERVICES AGREEMENT\n\n1. SCOPE OF SERVICES: The Provider covenants to deliver 99.95% portal availability across all regional endpoints.\n2. DATA PRIVACY & COMPLIANCE: User credentials shall be salted and hashed with modern cryptographic primitives. Plaintext secrets are strictly prohibited.\n3. TERMINATION & MODERATION: Administrators retain explicit purview to moderate or remove media found in breach of compliance standards.",
      createdAt: "2025-02-20T11:00:00.000Z",
      updatedAt: "2025-02-20T11:00:00.000Z"
    },
    {
      id: "med_doc_1",
      title: "Infrastructure Deployment Checklist.md",
      description: "Technical manifest containing database migration procedures, environment variable configurations, and automated CI/CD triggers.",
      type: "document",
      fileUrl: "https://example.com/docs/checklist.txt",
      thumbnailUrl: "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80",
      uploadedBy: "usr_admin_1",
      uploadedByName: "System Administrator",
      fileSize: "340 KB",
      pageCount: 3,
      previewContent: "# Vercel & Cloud Deployment Guide\n\n1. Configure DATABASE_URL in Vercel Environment variables.\n2. Set JWT_SECRET with at least 32 cryptographically random bytes.\n3. Execute `npx prisma db push` to generate all relational tables.\n4. Verify /api/health returns 200 OK before routing production traffic.",
      createdAt: "2025-02-21T09:15:00.000Z",
      updatedAt: "2025-02-21T09:15:00.000Z"
    }
  ],
  comments: [
    {
      id: "comm_1",
      userId: "usr_user_1",
      userName: "Sarah Connor",
      userEmail: "sarah.connor@example.com",
      mediaId: "med_vid_1",
      text: "The drone cinematography in this 4K clip is breathtaking! The color grading on the lake reflections is top notch.",
      createdAt: "2025-02-11T09:30:00.000Z",
      updatedAt: "2025-02-11T09:30:00.000Z"
    },
    {
      id: "comm_2",
      userId: "usr_user_2",
      userName: "Michael Scott",
      userEmail: "michael.scott@example.com",
      mediaId: "med_vid_1",
      text: "Remarkable resolution. Works seamlessly on our conference displays.",
      createdAt: "2025-02-11T14:12:00.000Z",
      updatedAt: "2025-02-11T14:12:00.000Z"
    },
    {
      id: "comm_3",
      userId: "usr_user_3",
      userName: "Elena Rostova",
      userEmail: "elena.rostova@example.com",
      mediaId: "med_pdf_1",
      text: "Crucial reading for our infrastructure team. Section 2 regarding multi-master consensus is especially lucid.",
      createdAt: "2025-02-19T11:05:00.000Z",
      updatedAt: "2025-02-19T11:05:00.000Z"
    }
  ],
  reactions: [
    { id: "rx_1", userId: "usr_user_1", mediaId: "med_vid_1", type: "LIKE", createdAt: "2025-02-11T09:20:00.000Z" },
    { id: "rx_2", userId: "usr_user_2", mediaId: "med_vid_1", type: "LIKE", createdAt: "2025-02-11T14:10:00.000Z" },
    { id: "rx_3", userId: "usr_user_3", mediaId: "med_vid_1", type: "LIKE", createdAt: "2025-02-12T08:15:00.000Z" },
    { id: "rx_4", userId: "usr_user_1", mediaId: "med_photo_1", type: "LIKE", createdAt: "2025-02-14T12:00:00.000Z" },
    { id: "rx_5", userId: "usr_user_2", mediaId: "med_poster_1", type: "LIKE", createdAt: "2025-02-16T18:00:00.000Z" },
    { id: "rx_6", userId: "usr_user_3", mediaId: "med_pdf_1", type: "LIKE", createdAt: "2025-02-18T12:30:00.000Z" },
    { id: "rx_7", userId: "usr_user_2", mediaId: "med_pptx_1", type: "DISLIKE", createdAt: "2025-02-19T16:00:00.000Z" }
  ],
  loginActivities: [
    {
      id: "log_1",
      userId: "usr_admin_1",
      userName: "System Administrator",
      email: "admin@mediaportal.com",
      loginTime: "2025-02-22T08:00:00.000Z",
      logoutTime: null,
      status: "SUCCESS",
      ipAddress: "192.168.1.1",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    },
    {
      id: "log_2",
      userId: "usr_user_1",
      userName: "Sarah Connor",
      email: "sarah.connor@example.com",
      loginTime: "2025-02-22T09:14:00.000Z",
      logoutTime: "2025-02-22T10:45:00.000Z",
      status: "SUCCESS",
      ipAddress: "192.168.1.45",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)"
    },
    {
      id: "log_3",
      userId: "usr_unknown",
      userName: "Unknown User",
      email: "hacker@unauthorized.net",
      loginTime: "2025-02-22T03:22:00.000Z",
      logoutTime: null,
      status: "FAILED",
      ipAddress: "45.33.32.156",
      userAgent: "curl/7.68.0"
    }
  ]
};
var Database = class {
  constructor() {
    this.data = this.loadData();
  }
  loadData() {
    try {
      if (process.env.VERCEL && !fs.existsSync(DATA_FILE) && fs.existsSync(SEED_FILE)) {
        try {
          const seedContent = fs.readFileSync(SEED_FILE, "utf-8");
          fs.writeFileSync(DATA_FILE, seedContent, "utf-8");
        } catch {
        }
      }
      const fileToRead = fs.existsSync(DATA_FILE) ? DATA_FILE : fs.existsSync(SEED_FILE) ? SEED_FILE : null;
      if (fileToRead) {
        const raw = fs.readFileSync(fileToRead, "utf-8");
        const parsed = JSON.parse(raw);
        const loadedUsers = parsed.users || INITIAL_DATA.users;
        if (process.env.DEFAULT_ADMIN_EMAIL || process.env.DEFAULT_ADMIN_PASSWORD) {
          const adminIdx = loadedUsers.findIndex((u) => u.role === "ADMIN");
          if (adminIdx !== -1) {
            loadedUsers[adminIdx] = {
              ...loadedUsers[adminIdx],
              email: ENV_ADMIN_EMAIL,
              name: ENV_ADMIN_USERNAME === "admin" ? loadedUsers[adminIdx].name : ENV_ADMIN_USERNAME,
              passwordHash: DEFAULT_ADMIN_HASH
            };
          }
        }
        return {
          adminSettings: parsed.adminSettings || INITIAL_DATA.adminSettings,
          users: loadedUsers,
          media: parsed.media || INITIAL_DATA.media,
          comments: parsed.comments || INITIAL_DATA.comments,
          reactions: parsed.reactions || INITIAL_DATA.reactions,
          loginActivities: parsed.loginActivities || INITIAL_DATA.loginActivities
        };
      }
    } catch (e) {
      console.warn("Could not read persistent DB file, using in-memory state", e);
    }
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }
  saveData(data) {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), "utf-8");
    } catch (e) {
      console.warn("Could not write to persistent DB file", e);
    }
  }
  // --- USERS ---
  getUsers() {
    return this.data.users;
  }
  getSafeUsers() {
    return this.data.users.map(({ passwordHash, ...safe }) => safe);
  }
  findUserById(id) {
    return this.data.users.find((u) => u.id === id);
  }
  findUserByEmail(email) {
    return this.data.users.find((u) => u.email.toLowerCase() === email.toLowerCase());
  }
  findUserByUsernameOrEmail(identifier) {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      (u) => u.email.toLowerCase() === clean || u.role === "ADMIN" && this.data.adminSettings.adminUsername.toLowerCase() === clean
    );
  }
  createUser(user) {
    this.data.users.push(user);
    this.saveData(this.data);
    const { passwordHash, ...safe } = user;
    return safe;
  }
  updateUser(id, updates) {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveData(this.data);
    const { passwordHash, ...safe } = this.data.users[index];
    return safe;
  }
  deleteUser(id) {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter((u) => u.id !== id);
    if (this.data.users.length !== initialLen) {
      this.data.comments = this.data.comments.filter((c) => c.userId !== id);
      this.data.reactions = this.data.reactions.filter((r) => r.userId !== id);
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  // --- MEDIA ---
  getMediaList(filter) {
    let list = [...this.data.media];
    if (filter?.category && filter.category !== "all") {
      list = list.filter((m) => m.type.toLowerCase() === filter.category?.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (m) => m.title.toLowerCase().includes(q) || m.description.toLowerCase().includes(q) || m.uploadedByName.toLowerCase().includes(q)
      );
    }
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  getMediaById(id) {
    return this.data.media.find((m) => m.id === id);
  }
  createMedia(media) {
    this.data.media.unshift(media);
    this.saveData(this.data);
    return media;
  }
  updateMedia(id, updates) {
    const index = this.data.media.findIndex((m) => m.id === id);
    if (index === -1) return null;
    this.data.media[index] = {
      ...this.data.media[index],
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveData(this.data);
    return this.data.media[index];
  }
  deleteMedia(id) {
    const initialLen = this.data.media.length;
    this.data.media = this.data.media.filter((m) => m.id !== id);
    if (this.data.media.length !== initialLen) {
      this.data.comments = this.data.comments.filter((c) => c.mediaId !== id);
      this.data.reactions = this.data.reactions.filter((r) => r.mediaId !== id);
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  // --- COMMENTS ---
  getComments(mediaId) {
    if (mediaId) {
      return this.data.comments.filter((c) => c.mediaId === mediaId).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...this.data.comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  findCommentById(id) {
    return this.data.comments.find((c) => c.id === id);
  }
  addComment(comment) {
    this.data.comments.unshift(comment);
    this.saveData(this.data);
    return comment;
  }
  updateComment(id, text) {
    const index = this.data.comments.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.data.comments[index] = {
      ...this.data.comments[index],
      text,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveData(this.data);
    return this.data.comments[index];
  }
  deleteComment(id) {
    const initialLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter((c) => c.id !== id);
    if (this.data.comments.length !== initialLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }
  // --- REACTIONS ---
  getReactions(mediaId) {
    const itemReactions = this.data.reactions.filter((r) => r.mediaId === mediaId);
    const likes = itemReactions.filter((r) => r.type === "LIKE").length;
    const dislikes = itemReactions.filter((r) => r.type === "DISLIKE").length;
    return { likes, dislikes };
  }
  getUserReaction(mediaId, userId) {
    const r = this.data.reactions.find((rx) => rx.mediaId === mediaId && rx.userId === userId);
    return r ? r.type : null;
  }
  setReaction(mediaId, userId, type) {
    const existingIndex = this.data.reactions.findIndex(
      (r) => r.mediaId === mediaId && r.userId === userId
    );
    let newUserReaction = type;
    if (existingIndex !== -1) {
      const existing = this.data.reactions[existingIndex];
      if (existing.type === type) {
        this.data.reactions.splice(existingIndex, 1);
        newUserReaction = null;
      } else {
        this.data.reactions[existingIndex].type = type;
      }
    } else {
      this.data.reactions.push({
        id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        mediaId,
        userId,
        type,
        createdAt: (/* @__PURE__ */ new Date()).toISOString()
      });
    }
    this.saveData(this.data);
    const stats = this.getReactions(mediaId);
    return {
      likes: stats.likes,
      dislikes: stats.dislikes,
      userReaction: newUserReaction
    };
  }
  // --- LOGIN ACTIVITY ---
  recordLoginActivity(record) {
    this.data.loginActivities.unshift(record);
    if (this.data.loginActivities.length > 200) {
      this.data.loginActivities = this.data.loginActivities.slice(0, 200);
    }
    this.saveData(this.data);
  }
  recordLogout(userId) {
    const latest = this.data.loginActivities.find(
      (l) => l.userId === userId && l.logoutTime === null && l.status === "SUCCESS"
    );
    if (latest) {
      latest.logoutTime = (/* @__PURE__ */ new Date()).toISOString();
      this.saveData(this.data);
    }
  }
  getLoginActivities() {
    return [...this.data.loginActivities].sort(
      (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
    );
  }
  // --- ADMIN SETTINGS ---
  getAdminSettings() {
    return this.data.adminSettings;
  }
  updateAdminSettings(settings) {
    this.data.adminSettings = {
      ...this.data.adminSettings,
      ...settings,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.saveData(this.data);
    return this.data.adminSettings;
  }
  // --- DASHBOARD METRICS ---
  getDashboardStats() {
    const media = this.data.media;
    const users = this.data.users;
    const comments = this.data.comments;
    const reactions = this.data.reactions;
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1e3).toISOString();
    const onlineUsers = users.filter((u) => u.lastLoginAt && u.lastLoginAt >= fifteenMinsAgo).length;
    return {
      totalUsers: users.length,
      onlineUsers: Math.max(onlineUsers, 1),
      // at least the admin
      totalVideos: media.filter((m) => m.type === "video").length,
      totalPhotos: media.filter((m) => m.type === "photo").length,
      totalPosters: media.filter((m) => m.type === "poster").length,
      totalPDFs: media.filter((m) => m.type === "pdf").length,
      totalPPTX: media.filter((m) => m.type === "presentation").length,
      totalWordDocs: media.filter((m) => m.type === "word").length,
      totalOtherDocs: media.filter((m) => m.type === "document").length,
      totalComments: comments.length,
      totalLikes: reactions.filter((r) => r.type === "LIKE").length,
      totalDislikes: reactions.filter((r) => r.type === "DISLIKE").length
    };
  }
  // Activity stats per user for Admin User table
  getUserMetrics(userId) {
    const commentsCount = this.data.comments.filter((c) => c.userId === userId).length;
    const likesCount = this.data.reactions.filter((r) => r.userId === userId && r.type === "LIKE").length;
    const dislikesCount = this.data.reactions.filter((r) => r.userId === userId && r.type === "DISLIKE").length;
    return { commentsCount, likesCount, dislikesCount };
  }
};
var db = new Database();

// server/auth.ts
import jwt from "jsonwebtoken";
import bcrypt2 from "bcryptjs";
var JWT_SECRET = process.env.JWT_SECRET || "media_portal_jwt_secret_super_secure_key_2025";
function signToken(user) {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      status: user.status
    },
    JWT_SECRET,
    { expiresIn: "7d" }
  );
}
function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (err) {
    return null;
  }
}
async function hashPassword(plainText) {
  const salt = await bcrypt2.genSalt(10);
  return bcrypt2.hash(plainText, salt);
}
async function comparePassword(plainText, hash) {
  return bcrypt2.compare(plainText, hash);
}
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (!token) {
    res.status(401).json({ error: "Authentication token required" });
    return;
  }
  const decodedUser = verifyToken(token);
  if (!decodedUser) {
    res.status(403).json({ error: "Invalid or expired token" });
    return;
  }
  const liveUser = db.findUserById(decodedUser.id);
  if (liveUser) {
    if (liveUser.status === "SUSPENDED" || liveUser.status === "BLOCKED") {
      res.status(403).json({ error: `This account (ID: ${liveUser.id}) has been blocked by the administrator.` });
      return;
    }
    const { passwordHash, ...safe } = liveUser;
    req.user = safe;
  } else {
    if (decodedUser.status === "SUSPENDED" || decodedUser.status === "BLOCKED") {
      res.status(403).json({ error: "Your account has been blocked by the administrator." });
      return;
    }
    req.user = decodedUser;
  }
  next();
}
function optionalAuthenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;
  if (token) {
    const decodedUser = verifyToken(token);
    if (decodedUser) {
      const liveUser = db.findUserById(decodedUser.id);
      if (liveUser && liveUser.status !== "SUSPENDED" && liveUser.status !== "BLOCKED") {
        const { passwordHash, ...safe } = liveUser;
        req.user = safe;
      } else if (!liveUser && decodedUser.status !== "SUSPENDED" && decodedUser.status !== "BLOCKED") {
        req.user = decodedUser;
      }
    }
  }
  next();
}
function requireAdmin(req, res, next) {
  if (!req.user) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  if (req.user.role !== "ADMIN") {
    res.status(403).json({ error: "Access denied: Administrator privileges required" });
    return;
  }
  next();
}

// server/routes/api.ts
var router = express.Router();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
  // 50MB
});
function generateId(prefix) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
router.post("/auth/register", async (req, res) => {
  try {
    const { name, email, password, confirmPassword } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: "All fields are required" });
      return;
    }
    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match" });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }
    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: "An account with this email already exists" });
      return;
    }
    const passwordHash = await hashPassword(password);
    const newUser = {
      id: generateId("usr"),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: "USER",
      status: "ACTIVE",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lastLoginAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const safeUser = db.createUser(newUser);
    const token = signToken(safeUser);
    db.recordLoginActivity({
      id: generateId("log"),
      userId: safeUser.id,
      userName: safeUser.name,
      email: safeUser.email,
      loginTime: (/* @__PURE__ */ new Date()).toISOString(),
      logoutTime: null,
      status: "SUCCESS",
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Browser"
    });
    res.status(201).json({
      message: "Account created successfully",
      user: safeUser,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ error: "Email and password are required" });
      return;
    }
    const user = db.findUserByEmail(email);
    if (!user) {
      db.recordLoginActivity({
        id: generateId("log"),
        userId: "unregistered",
        userName: "Unknown User",
        email: email.toLowerCase(),
        loginTime: (/* @__PURE__ */ new Date()).toISOString(),
        logoutTime: null,
        status: "FAILED",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "Browser"
      });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    if (user.status === "SUSPENDED" || user.status === "BLOCKED") {
      res.status(403).json({
        error: `This account (ID: ${user.id}) has been blocked by Administrator. You cannot log in.`
      });
      return;
    }
    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      db.recordLoginActivity({
        id: generateId("log"),
        userId: user.id,
        userName: user.name,
        email: user.email,
        loginTime: (/* @__PURE__ */ new Date()).toISOString(),
        logoutTime: null,
        status: "FAILED",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "Browser"
      });
      res.status(401).json({ error: "Invalid email or password" });
      return;
    }
    db.updateUser(user.id, { lastLoginAt: (/* @__PURE__ */ new Date()).toISOString() });
    const { passwordHash, ...safeUser } = user;
    const token = signToken(safeUser);
    db.recordLoginActivity({
      id: generateId("log"),
      userId: user.id,
      userName: user.name,
      email: user.email,
      loginTime: (/* @__PURE__ */ new Date()).toISOString(),
      logoutTime: null,
      status: "SUCCESS",
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Browser"
    });
    res.json({
      message: "Login successful",
      user: safeUser,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router.post("/auth/admin-login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      res.status(400).json({ error: "Admin username and password are required" });
      return;
    }
    const adminUser = db.findUserByUsernameOrEmail(username);
    if (!adminUser || adminUser.role !== "ADMIN") {
      db.recordLoginActivity({
        id: generateId("log"),
        userId: adminUser?.id || "unauthorized",
        userName: adminUser?.name || "Unauthorized Admin Attempt",
        email: username,
        loginTime: (/* @__PURE__ */ new Date()).toISOString(),
        logoutTime: null,
        status: "FAILED",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "Browser"
      });
      res.status(401).json({ error: "Invalid administrator credentials" });
      return;
    }
    if (adminUser.status === "SUSPENDED") {
      res.status(403).json({ error: "Admin account has been deactivated." });
      return;
    }
    const isValid = await comparePassword(password, adminUser.passwordHash);
    if (!isValid) {
      db.recordLoginActivity({
        id: generateId("log"),
        userId: adminUser.id,
        userName: adminUser.name,
        email: adminUser.email,
        loginTime: (/* @__PURE__ */ new Date()).toISOString(),
        logoutTime: null,
        status: "FAILED",
        ipAddress: req.ip || "127.0.0.1",
        userAgent: req.headers["user-agent"] || "Browser"
      });
      res.status(401).json({ error: "Invalid administrator credentials" });
      return;
    }
    db.updateUser(adminUser.id, { lastLoginAt: (/* @__PURE__ */ new Date()).toISOString() });
    const { passwordHash, ...safeAdmin } = adminUser;
    const token = signToken(safeAdmin);
    db.recordLoginActivity({
      id: generateId("log"),
      userId: adminUser.id,
      userName: adminUser.name,
      email: adminUser.email,
      loginTime: (/* @__PURE__ */ new Date()).toISOString(),
      logoutTime: null,
      status: "SUCCESS",
      ipAddress: req.ip || "127.0.0.1",
      userAgent: req.headers["user-agent"] || "Browser"
    });
    res.json({
      message: "Admin authorization granted",
      user: safeAdmin,
      token
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});
router.post("/auth/logout", authenticateToken, (req, res) => {
  if (req.user) {
    db.recordLogout(req.user.id);
  }
  res.json({ message: "Logged out successfully" });
});
router.get("/auth/me", authenticateToken, (req, res) => {
  res.json({ user: req.user });
});
router.get("/media", optionalAuthenticateToken, (req, res) => {
  const { category, search } = req.query;
  const mediaList = db.getMediaList({ category, search });
  const allMedia = db.getMediaList();
  const userId = req.user?.id;
  const counts = {
    all: allMedia.length,
    video: 0,
    photo: 0,
    poster: 0,
    pdf: 0,
    presentation: 0,
    word: 0,
    document: 0
  };
  allMedia.forEach((m) => {
    if (counts[m.type] !== void 0) {
      counts[m.type]++;
    }
  });
  const enriched = mediaList.map((item) => {
    const rx = db.getReactions(item.id);
    const comments = db.getComments(item.id);
    const userReaction = userId ? db.getUserReaction(item.id, userId) : null;
    return {
      ...item,
      likes: rx.likes,
      dislikes: rx.dislikes,
      commentCount: comments.length,
      userReaction
    };
  });
  res.json({ media: enriched, counts });
});
router.get("/media/:id", optionalAuthenticateToken, (req, res) => {
  const { id } = req.params;
  const media = db.getMediaById(id);
  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }
  const rx = db.getReactions(id);
  const comments = db.getComments(id);
  const userReaction = req.user?.id ? db.getUserReaction(id, req.user.id) : null;
  res.json({
    media: {
      ...media,
      likes: rx.likes,
      dislikes: rx.dislikes,
      commentCount: comments.length,
      userReaction
    },
    comments
  });
});
router.post("/media", authenticateToken, requireAdmin, (req, res) => {
  try {
    const {
      title,
      description,
      type,
      fileUrl,
      thumbnailUrl,
      fileSize,
      duration,
      pageCount,
      slideCount,
      previewContent
    } = req.body;
    if (!title || !type || !fileUrl) {
      res.status(400).json({ error: "Title, category type, and file are required" });
      return;
    }
    const newMedia = db.createMedia({
      id: generateId("med"),
      title: title.trim(),
      description: (description || "").trim(),
      type,
      fileUrl: fileUrl.trim(),
      thumbnailUrl: (thumbnailUrl || "").trim() || getDefaultThumbnail(type),
      uploadedBy: req.user.id,
      uploadedByName: req.user.name,
      fileSize: fileSize || "5.0 MB",
      duration,
      pageCount: pageCount ? Number(pageCount) : void 0,
      slideCount: slideCount ? Number(slideCount) : void 0,
      previewContent: previewContent || "",
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    res.status(201).json({
      message: "Media created successfully",
      media: newMedia
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error creating media" });
  }
});
router.put("/media/:id", authenticateToken, requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const updated = db.updateMedia(id, {
      ...updates,
      updatedAt: (/* @__PURE__ */ new Date()).toISOString()
    });
    if (!updated) {
      res.status(404).json({ error: "Media not found" });
      return;
    }
    res.json({
      message: "Media updated successfully",
      media: updated
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error updating media" });
  }
});
router.delete("/media/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteMedia(id);
  if (!deleted) {
    res.status(404).json({ error: "Media item not found" });
    return;
  }
  res.json({ message: "Media removed successfully" });
});
router.post("/upload", authenticateToken, requireAdmin, upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No file uploaded" });
      return;
    }
    const { originalname, mimetype, size, buffer } = req.file;
    const detectedType = detectMediaType(originalname, mimetype);
    const base64 = buffer.toString("base64");
    const dataUrl = `data:${mimetype};base64,${base64}`;
    const formattedSize = formatBytes(size);
    res.json({
      message: "File processed successfully",
      fileUrl: dataUrl,
      fileName: originalname,
      fileSize: formattedSize,
      detectedType,
      thumbnailUrl: getDefaultThumbnail(detectedType)
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error processing file" });
  }
});
router.post("/media/:id/react", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { type } = req.body;
  if (type !== "LIKE" && type !== "DISLIKE") {
    res.status(400).json({ error: "Reaction must be LIKE or DISLIKE" });
    return;
  }
  const media = db.getMediaById(id);
  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }
  const result = db.setReaction(id, req.user.id, type);
  res.json(result);
});
router.post("/media/:id/comments", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Comment text cannot be empty" });
    return;
  }
  const media = db.getMediaById(id);
  if (!media) {
    res.status(404).json({ error: "Media not found" });
    return;
  }
  const newComment = db.addComment({
    id: generateId("comm"),
    userId: req.user.id,
    userName: req.user.name,
    userEmail: req.user.email,
    mediaId: id,
    text: text.trim(),
    createdAt: (/* @__PURE__ */ new Date()).toISOString(),
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.status(201).json({
    message: "Comment added",
    comment: newComment
  });
});
router.put("/comments/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  if (!text || !text.trim()) {
    res.status(400).json({ error: "Comment text cannot be empty" });
    return;
  }
  const existing = db.findCommentById(id);
  if (!existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  if (existing.userId !== req.user.id) {
    res.status(403).json({ error: "You can only edit your own comments" });
    return;
  }
  const updated = db.updateComment(id, text.trim());
  res.json({ message: "Comment updated", comment: updated });
});
router.delete("/comments/:id", authenticateToken, (req, res) => {
  const { id } = req.params;
  const existing = db.findCommentById(id);
  if (!existing) {
    res.status(404).json({ error: "Comment not found" });
    return;
  }
  const isAuthor = existing.userId === req.user.id;
  const isAdmin = req.user.role === "ADMIN";
  if (!isAuthor && !isAdmin) {
    res.status(403).json({ error: "Permission denied: Cannot delete this comment" });
    return;
  }
  db.deleteComment(id);
  res.json({ message: "Comment deleted successfully" });
});
router.get("/admin/stats", authenticateToken, requireAdmin, (req, res) => {
  const stats = db.getDashboardStats();
  res.json({ stats });
});
router.get("/admin/users", authenticateToken, requireAdmin, (req, res) => {
  const users = db.getUsers();
  const enrichedUsers = users.map((u) => {
    const metrics = db.getUserMetrics(u.id);
    const { passwordHash, ...safe } = u;
    return {
      ...safe,
      ...metrics
    };
  });
  res.json({ users: enrichedUsers });
});
router.put("/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const { name, email, status, role } = req.body;
  const target = db.findUserById(id);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const updated = db.updateUser(id, {
    ...name ? { name: name.trim() } : {},
    ...email ? { email: email.trim().toLowerCase() } : {},
    ...status ? { status } : {},
    ...role ? { role } : {}
  });
  res.json({ message: "User updated successfully", user: updated });
});
router.post("/admin/users/:id/reset-password", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: "Password must be at least 6 characters long" });
      return;
    }
    const target = db.findUserById(id);
    if (!target) {
      res.status(404).json({ error: "User not found" });
      return;
    }
    const passwordHash = await hashPassword(newPassword);
    db.updateUser(id, { passwordHash, updatedAt: (/* @__PURE__ */ new Date()).toISOString() });
    res.json({ message: `Password changed successfully for ${target.name} (ID: ${target.id})` });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error changing password" });
  }
});
router.post("/admin/users/:id/toggle-block", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  if (req.user?.id === id) {
    res.status(400).json({ error: "Administrators cannot block their own account" });
    return;
  }
  const target = db.findUserById(id);
  if (!target) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  const newStatus = target.status === "BLOCKED" || target.status === "SUSPENDED" ? "ACTIVE" : "BLOCKED";
  const updated = db.updateUser(id, {
    status: newStatus,
    updatedAt: (/* @__PURE__ */ new Date()).toISOString()
  });
  res.json({
    message: newStatus === "BLOCKED" ? `User ID ${id} (${target.name}) has been BLOCKED.` : `User ID ${id} (${target.name}) has been UNBLOCKED and activated.`,
    user: updated,
    status: newStatus
  });
});
router.delete("/admin/users/:id", authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  if (req.user?.id === id) {
    res.status(400).json({ error: "Administrators cannot delete their own active account" });
    return;
  }
  const deleted = db.deleteUser(id);
  if (!deleted) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ message: "User account and associated content deleted" });
});
router.get("/admin/comments", authenticateToken, requireAdmin, (req, res) => {
  const allComments = db.getComments();
  const enriched = allComments.map((c) => {
    const media = db.getMediaById(c.mediaId);
    return {
      ...c,
      mediaTitle: media?.title || "Removed media item",
      mediaType: media?.type || "document"
    };
  });
  res.json({ comments: enriched });
});
router.get("/admin/login-activity", authenticateToken, requireAdmin, (req, res) => {
  const activities = db.getLoginActivities();
  res.json({ activities });
});
router.get("/admin/settings", authenticateToken, requireAdmin, (req, res) => {
  const settings = db.getAdminSettings();
  res.json({ settings });
});
router.put("/admin/settings", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { currentPassword, adminUsername, adminEmail, newPassword, portalName, maxUploadSizeMb } = req.body;
    if (!currentPassword) {
      res.status(400).json({ error: "Current password is required to save administrative changes" });
      return;
    }
    const currentAdmin = db.findUserById(req.user.id);
    if (!currentAdmin) {
      res.status(404).json({ error: "Admin account not found" });
      return;
    }
    const isValid = await comparePassword(currentPassword, currentAdmin.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: "Incorrect current password" });
      return;
    }
    const userUpdates = {};
    if (adminEmail && adminEmail !== currentAdmin.email) {
      userUpdates.email = adminEmail.trim().toLowerCase();
    }
    if (adminUsername && adminUsername !== currentAdmin.name) {
      userUpdates.name = adminUsername.trim();
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        res.status(400).json({ error: "New password must be at least 6 characters" });
        return;
      }
      userUpdates.passwordHash = await hashPassword(newPassword);
    }
    if (Object.keys(userUpdates).length > 0) {
      db.updateUser(currentAdmin.id, userUpdates);
    }
    const updatedSettings = db.updateAdminSettings({
      ...adminUsername ? { adminUsername: adminUsername.trim() } : {},
      ...adminEmail ? { adminEmail: adminEmail.trim().toLowerCase() } : {},
      ...portalName ? { portalName: portalName.trim() } : {},
      ...maxUploadSizeMb ? { maxUploadSizeMb: Number(maxUploadSizeMb) } : {}
    });
    res.json({
      message: "Admin settings updated successfully",
      settings: updatedSettings
    });
  } catch (err) {
    res.status(500).json({ error: err.message || "Error updating settings" });
  }
});
function detectMediaType(fileName, mime) {
  const ext = fileName.split(".").pop()?.toLowerCase() || "";
  if (mime.startsWith("video/") || ["mp4", "webm", "mov", "avi", "mkv"].includes(ext)) {
    return "video";
  }
  if (["pptx", "ppt", "keynote", "odp"].includes(ext) || mime.includes("presentation")) {
    return "presentation";
  }
  if (["pdf"].includes(ext) || mime.includes("pdf")) {
    return "pdf";
  }
  if (["docx", "doc", "pages", "odt"].includes(ext) || mime.includes("word") || mime.includes("officedocument.wordprocessingml")) {
    return "word";
  }
  if (mime.startsWith("image/")) {
    if (fileName.toLowerCase().includes("poster") || ["svg", "ai", "eps"].includes(ext)) {
      return "poster";
    }
    return "photo";
  }
  return "document";
}
function getDefaultThumbnail(type) {
  switch (type) {
    case "video":
      return "https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80";
    case "photo":
      return "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80";
    case "poster":
      return "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80";
    case "pdf":
      return "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80";
    case "presentation":
      return "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80";
    case "word":
      return "https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80";
    default:
      return "https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80";
  }
}
function formatBytes(bytes, decimals = 1) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
}
var api_default = router;

// server/serverless.ts
var app = express2();
app.use(express2.json({ limit: "50mb" }));
app.use(express2.urlencoded({ extended: true, limit: "50mb" }));
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  if (req.method === "OPTIONS") {
    res.sendStatus(200);
    return;
  }
  next();
});
var healthCheck = (req, res) => {
  res.json({
    status: "ok",
    service: "Media Portal Serverless API",
    environment: process.env.VERCEL ? "vercel" : "standard",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  });
};
app.get("/api/health", healthCheck);
app.get("/health", healthCheck);
app.use("/api", api_default);
app.use("/", api_default);
app.use((err, req, res, next) => {
  console.error("[API Serverless Error]", err);
  res.status(err?.status || 500).json({
    error: err?.message || "Internal Server Error",
    status: err?.status || 500
  });
});
var serverless_default = app;
export {
  serverless_default as default
};
