import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';
import { User, SafeUser, Media, Comment, Reaction, LoginActivity, AdminSettings, DashboardStats } from './types';

interface DatabaseSchema {
  users: User[];
  media: Media[];
  comments: Comment[];
  reactions: Reaction[];
  loginActivities: LoginActivity[];
  adminSettings: AdminSettings;
}

const SEED_FILE = path.join(process.cwd(), 'server', 'data.json');
const BACKUP_FILE = path.join(process.cwd(), 'server', 'data.backup.json');
// In Vercel serverless or AWS Lambda, the root deployment directory is read-only.
// Use /tmp on Vercel so state writes succeed gracefully during serverless invocations.
const DATA_FILE = process.env.VERCEL
  ? path.join('/tmp', 'mediaportal_data.json')
  : SEED_FILE;

// Configurable Admin credentials from environment variables
const ENV_ADMIN_USERNAME = process.env.DEFAULT_ADMIN_USERNAME || 'admin';
const ENV_ADMIN_EMAIL = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@mediaportal.com').trim().toLowerCase();
const ENV_ADMIN_PASSWORD = process.env.DEFAULT_ADMIN_PASSWORD || 'Admin@12345';

// Default initial Admin hashed password
const DEFAULT_ADMIN_HASH = bcrypt.hashSync(ENV_ADMIN_PASSWORD, 10);
const DEFAULT_USER_HASH = bcrypt.hashSync('User@12345', 10);

const INITIAL_DATA: DatabaseSchema = {
  adminSettings: {
    id: 'settings_1',
    adminUsername: ENV_ADMIN_USERNAME,
    adminEmail: ENV_ADMIN_EMAIL,
    portalName: 'Media Portal',
    maxUploadSizeMb: 50,
    allowRegistration: true,
    updatedAt: new Date().toISOString()
  },
  users: [
    {
      id: 'usr_admin_1',
      name: ENV_ADMIN_USERNAME === 'admin' ? 'System Administrator' : ENV_ADMIN_USERNAME,
      email: ENV_ADMIN_EMAIL,
      passwordHash: DEFAULT_ADMIN_HASH,
      role: 'ADMIN',
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00.000Z',
      updatedAt: '2025-01-01T00:00:00.000Z',
      lastLoginAt: new Date().toISOString()
    },
    {
      id: 'usr_user_1',
      name: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      passwordHash: DEFAULT_USER_HASH,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: '2025-01-15T10:20:00.000Z',
      updatedAt: '2025-01-15T10:20:00.000Z',
      lastLoginAt: '2025-02-18T14:30:00.000Z'
    },
    {
      id: 'usr_user_2',
      name: 'Michael Scott',
      email: 'michael.scott@example.com',
      passwordHash: DEFAULT_USER_HASH,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: '2025-01-20T09:15:00.000Z',
      updatedAt: '2025-01-20T09:15:00.000Z',
      lastLoginAt: '2025-02-20T11:45:00.000Z'
    },
    {
      id: 'usr_user_3',
      name: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      passwordHash: DEFAULT_USER_HASH,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: '2025-02-01T12:00:00.000Z',
      updatedAt: '2025-02-01T12:00:00.000Z',
      lastLoginAt: '2025-02-22T16:10:00.000Z'
    }
  ],
  media: [
    {
      id: 'med_vid_1',
      title: 'Cinematic Nature & Wildlife 4K Reel',
      description: 'An aerial and close-up cinematic compilation capturing the untamed wilderness, alpine lakes, and alpine wildlife in stunning clarity.',
      type: 'video',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '34.2 MB',
      duration: '09:56',
      createdAt: '2025-02-10T08:00:00.000Z',
      updatedAt: '2025-02-10T08:00:00.000Z'
    },
    {
      id: 'med_vid_2',
      title: 'Next-Gen Quantum Computing Explained',
      description: 'Educational overview detailing qubit mechanics, cryo-cooling frameworks, and real-world cryptographic implications.',
      type: 'video',
      fileUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
      thumbnailUrl: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '48.1 MB',
      duration: '10:54',
      createdAt: '2025-02-12T14:30:00.000Z',
      updatedAt: '2025-02-12T14:30:00.000Z'
    },
    {
      id: 'med_photo_1',
      title: 'Neon Cyberpunk Metropolis at Twilight',
      description: 'Ultra high-definition night photography of Shinjuku crossing with rain reflections, glowing neon signs, and atmospheric haze.',
      type: 'photo',
      fileUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '6.4 MB',
      createdAt: '2025-02-14T11:20:00.000Z',
      updatedAt: '2025-02-14T11:20:00.000Z'
    },
    {
      id: 'med_photo_2',
      title: 'Emerald Alpine Glacial Basin',
      description: 'Crystal-clear high alpine lake surrounded by snow-capped peaks in the Canadian Rockies under morning sunlight.',
      type: 'photo',
      fileUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '8.2 MB',
      createdAt: '2025-02-15T09:40:00.000Z',
      updatedAt: '2025-02-15T09:40:00.000Z'
    },
    {
      id: 'med_poster_1',
      title: 'Design Forward 2025 Festival Poster',
      description: 'Official promotional poster for the annual International Modern Typography and Digital Design Symposium.',
      type: 'poster',
      fileUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '11.5 MB',
      createdAt: '2025-02-16T16:00:00.000Z',
      updatedAt: '2025-02-16T16:00:00.000Z'
    },
    {
      id: 'med_poster_2',
      title: 'Solar Odyssey: Deep Space Missions Poster',
      description: 'Minimalist retro-futuristic vector poster celebrating deep space solar exploration missions and gravitational assist trajectories.',
      type: 'poster',
      fileUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1600&auto=format&fit=crop&q=85',
      thumbnailUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '9.1 MB',
      createdAt: '2025-02-17T13:10:00.000Z',
      updatedAt: '2025-02-17T13:10:00.000Z'
    },
    {
      id: 'med_pdf_1',
      title: 'Global Engineering Architecture Whitepaper.pdf',
      description: 'Comprehensive technical whitepaper exploring cloud-native microservices, zero-trust security boundaries, and low-latency storage replication.',
      type: 'pdf',
      fileUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      thumbnailUrl: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '4.8 MB',
      pageCount: 32,
      previewContent: 'Section 1: Executive Summary\nCloud modernization requires balancing elasticity with observable SLAs. This whitepaper sets the foundational metrics for cross-region disaster recovery and continuous data integrity validation.\n\nSection 2: High Availability Topologies\n- Multi-master consensus clusters\n- Edge-cached static content deliveries\n- Zero-downtime database migration pipelines\n\nSection 3: Security & Governance Compliance\nAll ingress traffic is subjected to TLS 1.3 encryption, automatic JWT validation, and RBAC token evaluation at the gateway level.',
      createdAt: '2025-02-18T10:00:00.000Z',
      updatedAt: '2025-02-18T10:00:00.000Z'
    },
    {
      id: 'med_pptx_1',
      title: 'Q3 Enterprise Product Strategy & Roadmap.pptx',
      description: 'Executive pitch deck outlining product milestones, active customer retention metrics, engineering OKRs, and market penetration plans.',
      type: 'presentation',
      fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=sample.pptx',
      thumbnailUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '18.4 MB',
      slideCount: 14,
      previewContent: 'Slide 1: Executive Vision - Delivering Unified Media Workflows\nSlide 2: Market Opportunity & Growth Tailwinds\nSlide 3: User Engagement Metrics (42% Increase MoM)\nSlide 4: System Architecture & Vercel Global Edge Latency\nSlide 5: Enterprise Security & Role-Based Access Control\nSlide 6: Q4 Financial Targets & Milestones',
      createdAt: '2025-02-19T15:20:00.000Z',
      updatedAt: '2025-02-19T15:20:00.000Z'
    },
    {
      id: 'med_word_1',
      title: 'Client Service Level Agreement & Terms.docx',
      description: 'Official corporate template specifying SLA response thresholds, incident escalation matrices, and data protection compliance clauses.',
      type: 'word',
      fileUrl: 'https://view.officeapps.live.com/op/view.aspx?src=sample.docx',
      thumbnailUrl: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '1.2 MB',
      pageCount: 8,
      previewContent: 'MASTER SERVICES AGREEMENT\n\n1. SCOPE OF SERVICES: The Provider covenants to deliver 99.95% portal availability across all regional endpoints.\n2. DATA PRIVACY & COMPLIANCE: User credentials shall be salted and hashed with modern cryptographic primitives. Plaintext secrets are strictly prohibited.\n3. TERMINATION & MODERATION: Administrators retain explicit purview to moderate or remove media found in breach of compliance standards.',
      createdAt: '2025-02-20T11:00:00.000Z',
      updatedAt: '2025-02-20T11:00:00.000Z'
    },
    {
      id: 'med_doc_1',
      title: 'Infrastructure Deployment Checklist.md',
      description: 'Technical manifest containing database migration procedures, environment variable configurations, and automated CI/CD triggers.',
      type: 'document',
      fileUrl: 'https://example.com/docs/checklist.txt',
      thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '340 KB',
      pageCount: 3,
      previewContent: '# Vercel & Cloud Deployment Guide\n\n1. Configure DATABASE_URL in Vercel Environment variables.\n2. Set JWT_SECRET with at least 32 cryptographically random bytes.\n3. Execute `npx prisma db push` to generate all relational tables.\n4. Verify /api/health returns 200 OK before routing production traffic.',
      createdAt: '2025-02-21T09:15:00.000Z',
      updatedAt: '2025-02-21T09:15:00.000Z'
    },
    {
      id: 'med_sheet_1',
      title: 'Q3 Financial Model & Revenue Projections.xlsx',
      description: 'Comprehensive financial forecasting model with revenue breakdown, EBITDA analysis, burn rate scenarios, and departmental budget allocations.',
      type: 'spreadsheet',
      fileUrl: 'https://example.com/spreadsheets/Q3_financial_model.xlsx',
      thumbnailUrl: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '4.8 MB',
      previewContent: 'MONTH | REVENUE | MRR GROWTH | EXPENSES | NET PROFIT\nJan   | $124,500| +12.4%     | $82,300  | +$42,200\nFeb   | $138,200| +11.0%     | $85,100  | +$53,100\nMar   | $156,900| +13.5%     | $89,400  | +$67,500\nApr   | $172,400| +9.8%      | $93,200  | +$79,200\nMay   | $191,800| +11.2%     | $97,500  | +$94,300\nJun   | $215,000| +12.1%     | $102,000 | +$113,000',
      createdAt: '2025-02-22T10:00:00.000Z',
      updatedAt: '2025-02-22T10:00:00.000Z'
    },
    {
      id: 'med_psd_1',
      title: 'Brand Identity Mockup & Mobile UI Kit.psd',
      description: 'Multi-layer Adobe Photoshop production design containing smart object mockups, typography styles, vector logo assets, and mobile app screens.',
      type: 'psd',
      fileUrl: 'https://example.com/assets/brand_identity_mockup.psd',
      thumbnailUrl: 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80',
      uploadedBy: 'usr_admin_1',
      uploadedByName: 'System Administrator',
      fileSize: '24.6 MB',
      previewContent: 'CANVAS: 3840 x 2160 (4K UHD) · COLOR PROFILE: sRGB IEC61966-2.1 · RESOLUTION: 300 DPI\nLAYERS (14 Groups):\n▶ Hero Device Mockups (Smart Objects)\n▶ Typography & Primary Branding (Inter / Display)\n▶ Dynamic Color Palette Swatches (HEX & Pantone)\n▶ App Screen Overlays & Drop Shadows',
      createdAt: '2025-02-23T14:15:00.000Z',
      updatedAt: '2025-02-23T14:15:00.000Z'
    }
  ],
  comments: [
    {
      id: 'comm_1',
      userId: 'usr_user_1',
      userName: 'Sarah Connor',
      userEmail: 'sarah.connor@example.com',
      mediaId: 'med_vid_1',
      text: 'The drone cinematography in this 4K clip is breathtaking! The color grading on the lake reflections is top notch.',
      createdAt: '2025-02-11T09:30:00.000Z',
      updatedAt: '2025-02-11T09:30:00.000Z'
    },
    {
      id: 'comm_2',
      userId: 'usr_user_2',
      userName: 'Michael Scott',
      userEmail: 'michael.scott@example.com',
      mediaId: 'med_vid_1',
      text: 'Remarkable resolution. Works seamlessly on our conference displays.',
      createdAt: '2025-02-11T14:12:00.000Z',
      updatedAt: '2025-02-11T14:12:00.000Z'
    },
    {
      id: 'comm_3',
      userId: 'usr_user_3',
      userName: 'Elena Rostova',
      userEmail: 'elena.rostova@example.com',
      mediaId: 'med_pdf_1',
      text: 'Crucial reading for our infrastructure team. Section 2 regarding multi-master consensus is especially lucid.',
      createdAt: '2025-02-19T11:05:00.000Z',
      updatedAt: '2025-02-19T11:05:00.000Z'
    }
  ],
  reactions: [
    { id: 'rx_1', userId: 'usr_user_1', mediaId: 'med_vid_1', type: 'LIKE', createdAt: '2025-02-11T09:20:00.000Z' },
    { id: 'rx_2', userId: 'usr_user_2', mediaId: 'med_vid_1', type: 'LIKE', createdAt: '2025-02-11T14:10:00.000Z' },
    { id: 'rx_3', userId: 'usr_user_3', mediaId: 'med_vid_1', type: 'LIKE', createdAt: '2025-02-12T08:15:00.000Z' },
    { id: 'rx_4', userId: 'usr_user_1', mediaId: 'med_photo_1', type: 'LIKE', createdAt: '2025-02-14T12:00:00.000Z' },
    { id: 'rx_5', userId: 'usr_user_2', mediaId: 'med_poster_1', type: 'LIKE', createdAt: '2025-02-16T18:00:00.000Z' },
    { id: 'rx_6', userId: 'usr_user_3', mediaId: 'med_pdf_1', type: 'LIKE', createdAt: '2025-02-18T12:30:00.000Z' },
    { id: 'rx_7', userId: 'usr_user_2', mediaId: 'med_pptx_1', type: 'DISLIKE', createdAt: '2025-02-19T16:00:00.000Z' }
  ],
  loginActivities: [
    {
      id: 'log_1',
      userId: 'usr_admin_1',
      userName: 'System Administrator',
      email: 'admin@mediaportal.com',
      loginTime: '2025-02-22T08:00:00.000Z',
      logoutTime: null,
      status: 'SUCCESS',
      ipAddress: '192.168.1.1',
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
    },
    {
      id: 'log_2',
      userId: 'usr_user_1',
      userName: 'Sarah Connor',
      email: 'sarah.connor@example.com',
      loginTime: '2025-02-22T09:14:00.000Z',
      logoutTime: '2025-02-22T10:45:00.000Z',
      status: 'SUCCESS',
      ipAddress: '192.168.1.45',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)'
    },
    {
      id: 'log_3',
      userId: 'usr_unknown',
      userName: 'Unknown User',
      email: 'hacker@unauthorized.net',
      loginTime: '2025-02-22T03:22:00.000Z',
      logoutTime: null,
      status: 'FAILED',
      ipAddress: '45.33.32.156',
      userAgent: 'curl/7.68.0'
    }
  ]
};

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.data = this.loadData();
  }

  private loadData(): DatabaseSchema {
    try {
      // In Vercel serverless functions, seed /tmp/mediaportal_data.json from bundled SEED_FILE if needed
      if (process.env.VERCEL && !fs.existsSync(DATA_FILE)) {
        if (fs.existsSync(SEED_FILE)) {
          try {
            const seedContent = fs.readFileSync(SEED_FILE, 'utf-8');
            fs.writeFileSync(DATA_FILE, seedContent, 'utf-8');
          } catch {}
        } else if (fs.existsSync(BACKUP_FILE)) {
          try {
            const backupContent = fs.readFileSync(BACKUP_FILE, 'utf-8');
            fs.writeFileSync(DATA_FILE, backupContent, 'utf-8');
          } catch {}
        }
      }

      const fileToRead = fs.existsSync(DATA_FILE) 
        ? DATA_FILE 
        : (fs.existsSync(SEED_FILE) ? SEED_FILE : (fs.existsSync(BACKUP_FILE) ? BACKUP_FILE : null));

      if (fileToRead) {
        const raw = fs.readFileSync(fileToRead, 'utf-8');
        const parsed = JSON.parse(raw);
        const loadedUsers: User[] = parsed.users || INITIAL_DATA.users;

        // If custom admin credentials are provided via Vercel env, sync them to the primary admin record
        if (process.env.DEFAULT_ADMIN_EMAIL || process.env.DEFAULT_ADMIN_PASSWORD) {
          const adminIdx = loadedUsers.findIndex(u => u.role === 'ADMIN');
          if (adminIdx !== -1) {
            loadedUsers[adminIdx] = {
              ...loadedUsers[adminIdx],
              email: ENV_ADMIN_EMAIL,
              name: ENV_ADMIN_USERNAME === 'admin' ? loadedUsers[adminIdx].name : ENV_ADMIN_USERNAME,
              passwordHash: DEFAULT_ADMIN_HASH
            };
          }
        }

        const loadedData: DatabaseSchema = {
          adminSettings: parsed.adminSettings || INITIAL_DATA.adminSettings,
          users: loadedUsers,
          media: parsed.media || INITIAL_DATA.media,
          comments: parsed.comments || INITIAL_DATA.comments,
          reactions: parsed.reactions || INITIAL_DATA.reactions,
          loginActivities: parsed.loginActivities || INITIAL_DATA.loginActivities
        };

        // Ensure backup file is also in sync
        this.saveData(loadedData);
        return loadedData;
      }
    } catch (e) {
      console.warn('Could not read persistent DB file, using in-memory state', e);
    }
    this.saveData(INITIAL_DATA);
    return INITIAL_DATA;
  }

  private saveData(data: DatabaseSchema) {
    try {
      const jsonContent = JSON.stringify(data, null, 2);

      // Primary file write
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, jsonContent, 'utf-8');

      // Secondary backup write (always kept updated for persistence)
      if (DATA_FILE !== SEED_FILE && fs.existsSync(path.dirname(SEED_FILE))) {
        try {
          fs.writeFileSync(SEED_FILE, jsonContent, 'utf-8');
        } catch {}
      }
      try {
        fs.writeFileSync(BACKUP_FILE, jsonContent, 'utf-8');
      } catch {}
    } catch (e) {
      console.warn('Could not write to persistent DB file', e);
    }
  }

  // --- USERS ---
  public getUsers(): User[] {
    return this.data.users;
  }

  public getSafeUsers(): SafeUser[] {
    return this.data.users.map(({ passwordHash, ...safe }) => safe);
  }

  public findUserById(id: string): User | undefined {
    return this.data.users.find(u => u.id === id);
  }

  public findUserByEmail(email: string): User | undefined {
    return this.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  public findUserByUsernameOrEmail(identifier: string): User | undefined {
    const clean = identifier.trim().toLowerCase();
    return this.data.users.find(
      u => u.email.toLowerCase() === clean || 
      (u.role === 'ADMIN' && this.data.adminSettings.adminUsername.toLowerCase() === clean)
    );
  }

  public createUser(user: User): SafeUser {
    this.data.users.push(user);
    this.saveData(this.data);
    const { passwordHash, ...safe } = user;
    return safe;
  }

  public updateUser(id: string, updates: Partial<User>): SafeUser | null {
    const index = this.data.users.findIndex(u => u.id === id);
    if (index === -1) return null;

    this.data.users[index] = {
      ...this.data.users[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);
    const { passwordHash, ...safe } = this.data.users[index];
    return safe;
  }

  public deleteUser(id: string): boolean {
    const initialLen = this.data.users.length;
    this.data.users = this.data.users.filter(u => u.id !== id);
    if (this.data.users.length !== initialLen) {
      // also cascade delete comments and reactions
      this.data.comments = this.data.comments.filter(c => c.userId !== id);
      this.data.reactions = this.data.reactions.filter(r => r.userId !== id);
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- MEDIA ---
  public getMediaList(filter?: { category?: string; search?: string }): Media[] {
    let list = [...this.data.media];

    if (filter?.category && filter.category !== 'all') {
      list = list.filter(m => m.type.toLowerCase() === filter.category?.toLowerCase());
    }

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        m => m.title.toLowerCase().includes(q) || 
             m.description.toLowerCase().includes(q) ||
             m.uploadedByName.toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getMediaById(id: string): Media | undefined {
    return this.data.media.find(m => m.id === id);
  }

  public createMedia(media: Media): Media {
    this.data.media.unshift(media);
    this.saveData(this.data);
    return media;
  }

  public updateMedia(id: string, updates: Partial<Media>): Media | null {
    const index = this.data.media.findIndex(m => m.id === id);
    if (index === -1) return null;

    this.data.media[index] = {
      ...this.data.media[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);
    return this.data.media[index];
  }

  public deleteMedia(id: string): boolean {
    const initialLen = this.data.media.length;
    this.data.media = this.data.media.filter(m => m.id !== id);
    if (this.data.media.length !== initialLen) {
      // cascade comments and reactions
      this.data.comments = this.data.comments.filter(c => c.mediaId !== id);
      this.data.reactions = this.data.reactions.filter(r => r.mediaId !== id);
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- COMMENTS ---
  public getComments(mediaId?: string): Comment[] {
    if (mediaId) {
      return this.data.comments
        .filter(c => c.mediaId === mediaId)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }
    return [...this.data.comments].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  public findCommentById(id: string): Comment | undefined {
    return this.data.comments.find(c => c.id === id);
  }

  public addComment(comment: Comment): Comment {
    this.data.comments.unshift(comment);
    this.saveData(this.data);
    return comment;
  }

  public updateComment(id: string, text: string): Comment | null {
    const index = this.data.comments.findIndex(c => c.id === id);
    if (index === -1) return null;

    this.data.comments[index] = {
      ...this.data.comments[index],
      text,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);
    return this.data.comments[index];
  }

  public deleteComment(id: string): boolean {
    const initialLen = this.data.comments.length;
    this.data.comments = this.data.comments.filter(c => c.id !== id);
    if (this.data.comments.length !== initialLen) {
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- REACTIONS ---
  public getReactions(mediaId: string): { likes: number; dislikes: number; userReaction?: 'LIKE' | 'DISLIKE' } {
    const itemReactions = this.data.reactions.filter(r => r.mediaId === mediaId);
    const likes = itemReactions.filter(r => r.type === 'LIKE').length;
    const dislikes = itemReactions.filter(r => r.type === 'DISLIKE').length;
    return { likes, dislikes };
  }

  public getUserReaction(mediaId: string, userId: string): 'LIKE' | 'DISLIKE' | null {
    const r = this.data.reactions.find(rx => rx.mediaId === mediaId && rx.userId === userId);
    return r ? r.type : null;
  }

  public setReaction(mediaId: string, userId: string, type: 'LIKE' | 'DISLIKE'): { likes: number; dislikes: number; userReaction: 'LIKE' | 'DISLIKE' | null } {
    const existingIndex = this.data.reactions.findIndex(
      r => r.mediaId === mediaId && r.userId === userId
    );

    let newUserReaction: 'LIKE' | 'DISLIKE' | null = type;

    if (existingIndex !== -1) {
      const existing = this.data.reactions[existingIndex];
      if (existing.type === type) {
        // Toggle off if clicking the same reaction again!
        this.data.reactions.splice(existingIndex, 1);
        newUserReaction = null;
      } else {
        // Switch reaction (e.g. from dislike to like)
        this.data.reactions[existingIndex].type = type;
      }
    } else {
      // New reaction
      this.data.reactions.push({
        id: `rx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        mediaId,
        userId,
        type,
        createdAt: new Date().toISOString()
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
  public recordLoginActivity(record: LoginActivity): void {
    this.data.loginActivities.unshift(record);
    // Keep last 200 logs
    if (this.data.loginActivities.length > 200) {
      this.data.loginActivities = this.data.loginActivities.slice(0, 200);
    }
    this.saveData(this.data);
  }

  public recordLogout(userId: string): void {
    const latest = this.data.loginActivities.find(
      l => l.userId === userId && l.logoutTime === null && l.status === 'SUCCESS'
    );
    if (latest) {
      latest.logoutTime = new Date().toISOString();
      this.saveData(this.data);
    }
  }

  public getLoginActivities(): LoginActivity[] {
    return [...this.data.loginActivities].sort(
      (a, b) => new Date(b.loginTime).getTime() - new Date(a.loginTime).getTime()
    );
  }

  public clearLoginActivities(): void {
    this.data.loginActivities = [];
    this.saveData(this.data);
  }

  public deleteLoginActivity(id: string): boolean {
    const idx = this.data.loginActivities.findIndex(l => l.id === id);
    if (idx !== -1) {
      this.data.loginActivities.splice(idx, 1);
      this.saveData(this.data);
      return true;
    }
    return false;
  }

  // --- ADMIN SETTINGS ---
  public getAdminSettings(): AdminSettings {
    return this.data.adminSettings;
  }

  public updateAdminSettings(settings: Partial<AdminSettings>): AdminSettings {
    this.data.adminSettings = {
      ...this.data.adminSettings,
      ...settings,
      updatedAt: new Date().toISOString()
    };
    this.saveData(this.data);
    return this.data.adminSettings;
  }

  // --- DASHBOARD METRICS ---
  public getDashboardStats(): DashboardStats {
    const media = this.data.media;
    const users = this.data.users;
    const comments = this.data.comments;
    const reactions = this.data.reactions;

    // Users active within last 15 minutes or recent login
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
    const onlineUsers = users.filter(u => u.lastLoginAt && u.lastLoginAt >= fifteenMinsAgo).length;

    return {
      totalUsers: users.length,
      onlineUsers: Math.max(onlineUsers, 1), // at least the admin
      totalVideos: media.filter(m => m.type === 'video').length,
      totalPhotos: media.filter(m => m.type === 'photo').length,
      totalPosters: media.filter(m => m.type === 'poster').length,
      totalPDFs: media.filter(m => m.type === 'pdf').length,
      totalPPTX: media.filter(m => m.type === 'presentation').length,
      totalWordDocs: media.filter(m => m.type === 'word').length,
      totalOtherDocs: media.filter(m => m.type === 'document').length,
      totalComments: comments.length,
      totalLikes: reactions.filter(r => r.type === 'LIKE').length,
      totalDislikes: reactions.filter(r => r.type === 'DISLIKE').length
    };
  }

  // Activity stats per user for Admin User table
  public getUserMetrics(userId: string) {
    const commentsCount = this.data.comments.filter(c => c.userId === userId).length;
    const likesCount = this.data.reactions.filter(r => r.userId === userId && r.type === 'LIKE').length;
    const dislikesCount = this.data.reactions.filter(r => r.userId === userId && r.type === 'DISLIKE').length;
    return { commentsCount, likesCount, dislikesCount };
  }
}

export const db = new Database();
