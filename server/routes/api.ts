import express, { Response } from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { db } from '../db';
import { 
  AuthRequest, 
  authenticateToken, 
  optionalAuthenticateToken, 
  requireAdmin, 
  signToken, 
  hashPassword, 
  comparePassword 
} from '../auth';
import { MediaType, User } from '../types';

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (e) {
  console.warn('Could not create uploads directory in api router:', e);
}

// Configure multer for file uploads with 250MB max limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 250 * 1024 * 1024 } // 250MB
});

// Helper for generating unique ids without external package
function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

// -------------------------------------------------------------
// AUTH ROUTES
// -------------------------------------------------------------

// POST /api/auth/register
router.post('/auth/register', async (req, res): Promise<void> => {
  try {
    const { name, email, password, confirmPassword } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    if (password !== confirmPassword) {
      res.status(400).json({ error: 'Passwords do not match' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const existing = db.findUserByEmail(email);
    if (existing) {
      res.status(400).json({ error: 'An account with this email already exists' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const newUser: User = {
      id: generateId('usr'),
      name: name.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      role: 'USER',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };

    const safeUser = db.createUser(newUser);
    const token = signToken(safeUser);

    db.recordLoginActivity({
      id: generateId('log'),
      userId: safeUser.id,
      userName: safeUser.name,
      email: safeUser.email,
      loginTime: new Date().toISOString(),
      logoutTime: null,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    });

    res.status(201).json({
      message: 'Account created successfully',
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/auth/login', async (req, res): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = db.findUserByEmail(email);
    if (!user) {
      db.recordLoginActivity({
        id: generateId('log'),
        userId: 'unregistered',
        userName: 'Unknown User',
        email: email.toLowerCase(),
        loginTime: new Date().toISOString(),
        logoutTime: null,
        status: 'FAILED',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Browser'
      });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    if (user.status === 'SUSPENDED' || user.status === 'BLOCKED') {
      db.recordLoginActivity({
        id: generateId('log'),
        userId: user.id,
        userName: user.name,
        email: user.email,
        loginTime: new Date().toISOString(),
        logoutTime: null,
        status: 'BLOCKED',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: (req.headers['user-agent'] as string) || 'Browser'
      });
      res.status(403).json({ 
        error: `This account (ID: ${user.id}) has been blocked by Administrator. You cannot log in.` 
      });
      return;
    }

    const isValid = await comparePassword(password, user.passwordHash);
    if (!isValid) {
      db.recordLoginActivity({
        id: generateId('log'),
        userId: user.id,
        userName: user.name,
        email: user.email,
        loginTime: new Date().toISOString(),
        logoutTime: null,
        status: 'FAILED',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Browser'
      });
      res.status(401).json({ error: 'Invalid email or password' });
      return;
    }

    // Update last login
    db.updateUser(user.id, { lastLoginAt: new Date().toISOString() });
    const { passwordHash, ...safeUser } = user;
    const token = signToken(safeUser);

    db.recordLoginActivity({
      id: generateId('log'),
      userId: user.id,
      userName: user.name,
      email: user.email,
      loginTime: new Date().toISOString(),
      logoutTime: null,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    });

    res.json({
      message: 'Login successful',
      user: safeUser,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/admin-login (Hidden shortcut endpoint)
router.post('/auth/admin-login', async (req, res): Promise<void> => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      res.status(400).json({ error: 'Admin username and password are required' });
      return;
    }

    const adminUser = db.findUserByUsernameOrEmail(username);

    if (!adminUser || adminUser.role !== 'ADMIN') {
      db.recordLoginActivity({
        id: generateId('log'),
        userId: adminUser?.id || 'unauthorized',
        userName: adminUser?.name || 'Unauthorized Admin Attempt',
        email: username,
        loginTime: new Date().toISOString(),
        logoutTime: null,
        status: 'FAILED',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Browser'
      });
      res.status(401).json({ error: 'Invalid administrator credentials' });
      return;
    }

    if (adminUser.status === 'SUSPENDED' || adminUser.status === 'BLOCKED') {
      db.recordLoginActivity({
        id: generateId('log'),
        userId: adminUser.id,
        userName: adminUser.name,
        email: adminUser.email,
        loginTime: new Date().toISOString(),
        logoutTime: null,
        status: 'BLOCKED',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: (req.headers['user-agent'] as string) || 'Browser'
      });
      res.status(403).json({ error: 'Admin account has been deactivated or blocked.' });
      return;
    }

    const isValid = await comparePassword(password, adminUser.passwordHash);
    if (!isValid) {
      db.recordLoginActivity({
        id: generateId('log'),
        userId: adminUser.id,
        userName: adminUser.name,
        email: adminUser.email,
        loginTime: new Date().toISOString(),
        logoutTime: null,
        status: 'FAILED',
        ipAddress: req.ip || '127.0.0.1',
        userAgent: req.headers['user-agent'] || 'Browser'
      });
      res.status(401).json({ error: 'Invalid administrator credentials' });
      return;
    }

    db.updateUser(adminUser.id, { lastLoginAt: new Date().toISOString() });
    const { passwordHash, ...safeAdmin } = adminUser;
    const token = signToken(safeAdmin);

    db.recordLoginActivity({
      id: generateId('log'),
      userId: adminUser.id,
      userName: adminUser.name,
      email: adminUser.email,
      loginTime: new Date().toISOString(),
      logoutTime: null,
      status: 'SUCCESS',
      ipAddress: req.ip || '127.0.0.1',
      userAgent: req.headers['user-agent'] || 'Browser'
    });

    res.json({
      message: 'Admin authorization granted',
      user: safeAdmin,
      token
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
});

// POST /api/auth/logout
router.post('/auth/logout', authenticateToken, (req: AuthRequest, res) => {
  if (req.user) {
    db.recordLogout(req.user.id);
  }
  res.json({ message: 'Logged out successfully' });
});

// GET /api/auth/me
router.get('/auth/me', authenticateToken, (req: AuthRequest, res) => {
  res.json({ user: req.user });
});

// -------------------------------------------------------------
// MEDIA ROUTES
// -------------------------------------------------------------

// GET /api/media (public or authenticated)
router.get('/media', optionalAuthenticateToken, (req: AuthRequest, res) => {
  const { category, search } = req.query as { category?: string; search?: string };
  const mediaList = db.getMediaList({ category, search });
  const allMedia = db.getMediaList();
  const userId = req.user?.id;

  const counts: Record<string, number> = {
    all: allMedia.length,
    video: 0,
    photo: 0,
    poster: 0,
    pdf: 0,
    presentation: 0,
    spreadsheet: 0,
    word: 0,
    psd: 0,
    document: 0
  };

  allMedia.forEach(m => {
    if (counts[m.type] !== undefined) {
      counts[m.type]++;
    }
  });

  const enriched = mediaList.map(item => {
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

// GET /api/media/:id
router.get('/media/:id', optionalAuthenticateToken, (req: AuthRequest, res): void => {
  const { id } = req.params;
  const media = db.getMediaById(id);

  if (!media) {
    res.status(404).json({ error: 'Media not found' });
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

// Helper to safely write base64 Data URLs to disk so data.json stays lightweight and fast
function persistDataUrlIfPresent(inputUrl: string, prefix = 'media'): string {
  if (!inputUrl || typeof inputUrl !== 'string' || !inputUrl.startsWith('data:')) {
    return inputUrl;
  }
  try {
    const match = inputUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (match) {
      const mime = match[1];
      const base64Content = match[2];
      const buffer = Buffer.from(base64Content, 'base64');
      let ext = '.bin';
      if (mime.includes('video/mp4')) ext = '.mp4';
      else if (mime.includes('video/webm')) ext = '.webm';
      else if (mime.includes('video/ogg')) ext = '.ogv';
      else if (mime.includes('video/quicktime')) ext = '.mov';
      else if (mime.includes('image/png')) ext = '.png';
      else if (mime.includes('image/jpeg')) ext = '.jpg';
      else if (mime.includes('image/webp')) ext = '.webp';
      else if (mime.includes('image/gif')) ext = '.gif';
      else if (mime.includes('pdf')) ext = '.pdf';
      else if (mime.includes('sheet') || mime.includes('excel')) ext = '.xlsx';
      else if (mime.includes('presentation') || mime.includes('powerpoint')) ext = '.pptx';
      else if (mime.includes('word') || mime.includes('document')) ext = '.docx';
      else if (mime.includes('photoshop')) ext = '.psd';

      const diskFilename = `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const diskPath = path.join(uploadsDir, diskFilename);
      fs.writeFileSync(diskPath, buffer);
      return `/uploads/${diskFilename}`;
    }
  } catch (err) {
    console.warn('Failed to save data URL to disk, keeping data URL fallback:', err);
  }
  return inputUrl;
}

// POST /api/media (Admin only)
router.post('/media', authenticateToken, requireAdmin, (req: AuthRequest, res): void => {
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
      res.status(400).json({ error: 'Title, category type, and file are required' });
      return;
    }

    // Auto-persist large base64 URLs to uploads folder if needed
    const persistedFileUrl = persistDataUrlIfPresent(fileUrl.trim(), `med_${type}`);
    const persistedThumbUrl = thumbnailUrl ? persistDataUrlIfPresent(thumbnailUrl.trim(), 'thumb') : '';

    const newMedia = db.createMedia({
      id: generateId('med'),
      title: title.trim(),
      description: (description || '').trim(),
      type: type as MediaType,
      fileUrl: persistedFileUrl,
      thumbnailUrl: persistedThumbUrl || getDefaultThumbnail(type),
      uploadedBy: req.user!.id,
      uploadedByName: req.user!.name,
      fileSize: fileSize || '5.0 MB',
      duration,
      pageCount: pageCount ? Number(pageCount) : undefined,
      slideCount: slideCount ? Number(slideCount) : undefined,
      previewContent: previewContent || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });

    res.status(201).json({
      message: 'Media created successfully',
      media: newMedia
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error creating media' });
  }
});

// PUT /api/media/:id (Admin only)
router.put('/media/:id', authenticateToken, requireAdmin, (req: AuthRequest, res): void => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.fileUrl) {
      updates.fileUrl = persistDataUrlIfPresent(updates.fileUrl, 'med_updated');
    }
    if (updates.thumbnailUrl) {
      updates.thumbnailUrl = persistDataUrlIfPresent(updates.thumbnailUrl, 'thumb_updated');
    }

    const updated = db.updateMedia(id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });

    if (!updated) {
      res.status(404).json({ error: 'Media not found' });
      return;
    }

    res.json({
      message: 'Media updated successfully',
      media: updated
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating media' });
  }
});

// DELETE /api/media/:id (Admin only)
router.delete('/media/:id', authenticateToken, requireAdmin, (req: AuthRequest, res): void => {
  const { id } = req.params;
  const deleted = db.deleteMedia(id);

  if (!deleted) {
    res.status(404).json({ error: 'Media item not found' });
    return;
  }

  res.json({ message: 'Media removed successfully' });
});

// POST /api/upload (Admin file upload supporting large files & streaming)
router.post('/upload', authenticateToken, requireAdmin, upload.single('file'), (req: AuthRequest, res): void => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }

    const { originalname, mimetype, size, buffer } = req.file;

    // Detect media category from MIME type & extension
    const detectedType = detectMediaType(originalname, mimetype);

    let finalFileUrl: string;
    try {
      const ext = path.extname(originalname) || '.bin';
      const cleanBase = path.basename(originalname, ext).replace(/[^a-zA-Z0-9_-]/g, '_').substring(0, 40);
      const diskFilename = `file_${Date.now()}_${cleanBase}${ext}`;
      const diskPath = path.join(uploadsDir, diskFilename);
      fs.writeFileSync(diskPath, buffer);
      finalFileUrl = `/uploads/${diskFilename}`;
    } catch (diskErr) {
      console.warn('Could not write uploaded file to disk, falling back to data URL:', diskErr);
      const base64 = buffer.toString('base64');
      finalFileUrl = `data:${mimetype};base64,${base64}`;
    }

    const formattedSize = formatBytes(size);

    res.json({
      message: 'File processed successfully',
      fileUrl: finalFileUrl,
      fileName: originalname,
      fileSize: formattedSize,
      detectedType,
      thumbnailUrl: getDefaultThumbnail(detectedType)
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error processing file' });
  }
});

// -------------------------------------------------------------
// REACTIONS (LIKE / DISLIKE)
// -------------------------------------------------------------

router.post('/media/:id/react', authenticateToken, (req: AuthRequest, res): void => {
  const { id } = req.params;
  const { type } = req.body;

  if (type !== 'LIKE' && type !== 'DISLIKE') {
    res.status(400).json({ error: 'Reaction must be LIKE or DISLIKE' });
    return;
  }

  const media = db.getMediaById(id);
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const result = db.setReaction(id, req.user!.id, type);
  res.json(result);
});

// -------------------------------------------------------------
// COMMENTS
// -------------------------------------------------------------

// POST /api/media/:id/comments
router.post('/media/:id/comments', authenticateToken, (req: AuthRequest, res): void => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Comment text cannot be empty' });
    return;
  }

  const media = db.getMediaById(id);
  if (!media) {
    res.status(404).json({ error: 'Media not found' });
    return;
  }

  const newComment = db.addComment({
    id: generateId('comm'),
    userId: req.user!.id,
    userName: req.user!.name,
    userEmail: req.user!.email,
    mediaId: id,
    text: text.trim(),
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  res.status(201).json({
    message: 'Comment added',
    comment: newComment
  });
});

// PUT /api/comments/:id (edit own comment)
router.put('/comments/:id', authenticateToken, (req: AuthRequest, res): void => {
  const { id } = req.params;
  const { text } = req.body;

  if (!text || !text.trim()) {
    res.status(400).json({ error: 'Comment text cannot be empty' });
    return;
  }

  const existing = db.findCommentById(id);
  if (!existing) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }

  // Only author can edit text
  if (existing.userId !== req.user!.id) {
    res.status(403).json({ error: 'You can only edit your own comments' });
    return;
  }

  const updated = db.updateComment(id, text.trim());
  res.json({ message: 'Comment updated', comment: updated });
});

// DELETE /api/comments/:id (author or admin)
router.delete('/comments/:id', authenticateToken, (req: AuthRequest, res): void => {
  const { id } = req.params;
  const existing = db.findCommentById(id);

  if (!existing) {
    res.status(404).json({ error: 'Comment not found' });
    return;
  }

  const isAuthor = existing.userId === req.user!.id;
  const isAdmin = req.user!.role === 'ADMIN';

  if (!isAuthor && !isAdmin) {
    res.status(403).json({ error: 'Permission denied: Cannot delete this comment' });
    return;
  }

  db.deleteComment(id);
  res.json({ message: 'Comment deleted successfully' });
});

// -------------------------------------------------------------
// ADMIN DASHBOARD & MANAGEMENT
// -------------------------------------------------------------

// GET /api/admin/stats
router.get('/admin/stats', authenticateToken, requireAdmin, (req, res) => {
  const stats = db.getDashboardStats();
  res.json({ stats });
});

// GET /api/admin/users
router.get('/admin/users', authenticateToken, requireAdmin, (req, res) => {
  const users = db.getUsers();
  const enrichedUsers = users.map(u => {
    const metrics = db.getUserMetrics(u.id);
    const { passwordHash, ...safe } = u;
    return {
      ...safe,
      ...metrics
    };
  });

  res.json({ users: enrichedUsers });
});

// POST /api/admin/users - Admin directly creates a new user account
router.post('/admin/users', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { name, email, password, role = 'USER', status = 'ACTIVE' } = req.body;
    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required' });
      return;
    }
    if (password.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }
    const cleanEmail = email.trim().toLowerCase();
    const existing = db.findUserByEmail(cleanEmail);
    if (existing) {
      res.status(409).json({ error: 'A user account with this email address already exists' });
      return;
    }
    const passwordHash = await hashPassword(password);
    const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const created = db.createUser({
      id: newId,
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: role === 'ADMIN' ? 'ADMIN' : 'USER',
      status: (status === 'BLOCKED' || status === 'SUSPENDED') ? 'BLOCKED' : 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      lastLoginAt: null
    });
    res.status(201).json({ message: `User account created successfully with ID: ${created.id}`, user: created });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Failed to create user account' });
  }
});

// PUT /api/admin/users/:id
router.put('/admin/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res): void => {
  const { id } = req.params;
  const { name, email, status, role } = req.body;

  const target = db.findUserById(id);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const updated = db.updateUser(id, {
    ...(name ? { name: name.trim() } : {}),
    ...(email ? { email: email.trim().toLowerCase() } : {}),
    ...(status ? { status } : {}),
    ...(role ? { role } : {})
  });

  res.json({ message: 'User updated successfully', user: updated });
});

// POST /api/admin/users/:id/reset-password
router.post('/admin/users/:id/reset-password', authenticateToken, requireAdmin, async (req, res): Promise<void> => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword || newPassword.length < 6) {
      res.status(400).json({ error: 'Password must be at least 6 characters long' });
      return;
    }

    const target = db.findUserById(id);
    if (!target) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    db.updateUser(id, { passwordHash, updatedAt: new Date().toISOString() });

    res.json({ message: `Password changed successfully for ${target.name} (ID: ${target.id})` });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error changing password' });
  }
});

// POST /api/admin/users/:id/toggle-block
router.post('/admin/users/:id/toggle-block', authenticateToken, requireAdmin, (req: AuthRequest, res): void => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ error: 'Administrators cannot block their own account' });
    return;
  }

  const target = db.findUserById(id);
  if (!target) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const newStatus = (target.status === 'BLOCKED' || target.status === 'SUSPENDED') ? 'ACTIVE' : 'BLOCKED';
  const updated = db.updateUser(id, { 
    status: newStatus,
    updatedAt: new Date().toISOString()
  });

  res.json({ 
    message: newStatus === 'BLOCKED' 
      ? `User ID ${id} (${target.name}) has been BLOCKED.` 
      : `User ID ${id} (${target.name}) has been UNBLOCKED and activated.`,
    user: updated,
    status: newStatus
  });
});

// DELETE /api/admin/users/:id
router.delete('/admin/users/:id', authenticateToken, requireAdmin, (req: AuthRequest, res): void => {
  const { id } = req.params;

  if (req.user?.id === id) {
    res.status(400).json({ error: 'Administrators cannot delete their own active account' });
    return;
  }

  const deleted = db.deleteUser(id);
  if (!deleted) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  res.json({ message: 'User account and associated content deleted' });
});

// GET /api/admin/comments (all comments with media title)
router.get('/admin/comments', authenticateToken, requireAdmin, (req, res) => {
  const allComments = db.getComments();
  const enriched = allComments.map(c => {
    const media = db.getMediaById(c.mediaId);
    return {
      ...c,
      mediaTitle: media?.title || 'Removed media item',
      mediaType: media?.type || 'document'
    };
  });

  res.json({ comments: enriched });
});

// GET /api/admin/login-activity
router.get('/admin/login-activity', authenticateToken, requireAdmin, (req, res) => {
  const activities = db.getLoginActivities();
  const allUsers = db.getUsers();

  // Enrich each record with current user status and block capability
  const enriched = activities.map(act => {
    const user = allUsers.find(
      u => u.id === act.userId || (act.email && u.email.toLowerCase() === act.email.toLowerCase())
    );

    return {
      ...act,
      userEmail: act.email,
      userStatus: user ? user.status : (act.status === 'BLOCKED' ? 'BLOCKED' : 'UNKNOWN'),
      userRole: user?.role,
      canBlock: Boolean(user && user.role !== 'ADMIN')
    };
  });

  // Return both 'activities' and 'logs' keys so frontend callers succeed regardless of naming
  res.json({ 
    activities: enriched, 
    logs: enriched,
    total: enriched.length 
  });
});

// DELETE /api/admin/login-activity (Clear all login activity logs)
router.delete('/admin/login-activity', authenticateToken, requireAdmin, (req, res) => {
  db.clearLoginActivities();
  res.json({ message: 'All login activity audit records have been cleared successfully' });
});

// DELETE /api/admin/login-activity/:id (Delete a single log entry)
router.delete('/admin/login-activity/:id', authenticateToken, requireAdmin, (req, res) => {
  const { id } = req.params;
  const deleted = db.deleteLoginActivity(id);
  if (!deleted) {
    res.status(404).json({ error: 'Audit record not found' });
    return;
  }
  res.json({ message: 'Audit record removed' });
});

// GET /api/admin/settings
router.get('/admin/settings', authenticateToken, requireAdmin, (req, res) => {
  const settings = db.getAdminSettings();
  res.json({ settings });
});

// PUT /api/admin/settings (Requires current password verification)
router.put('/admin/settings', authenticateToken, requireAdmin, async (req: AuthRequest, res): Promise<void> => {
  try {
    const { currentPassword, adminUsername, adminEmail, newPassword, portalName, maxUploadSizeMb } = req.body;

    if (!currentPassword) {
      res.status(400).json({ error: 'Current password is required to save administrative changes' });
      return;
    }

    const currentAdmin = db.findUserById(req.user!.id);
    if (!currentAdmin) {
      res.status(404).json({ error: 'Admin account not found' });
      return;
    }

    const isValid = await comparePassword(currentPassword, currentAdmin.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: 'Incorrect current password' });
      return;
    }

    const userUpdates: Partial<User> = {};
    if (adminEmail && adminEmail !== currentAdmin.email) {
      userUpdates.email = adminEmail.trim().toLowerCase();
    }
    if (adminUsername && adminUsername !== currentAdmin.name) {
      userUpdates.name = adminUsername.trim();
    }
    if (newPassword) {
      if (newPassword.length < 6) {
        res.status(400).json({ error: 'New password must be at least 6 characters' });
        return;
      }
      userUpdates.passwordHash = await hashPassword(newPassword);
    }

    if (Object.keys(userUpdates).length > 0) {
      db.updateUser(currentAdmin.id, userUpdates);
    }

    const updatedSettings = db.updateAdminSettings({
      ...(adminUsername ? { adminUsername: adminUsername.trim() } : {}),
      ...(adminEmail ? { adminEmail: adminEmail.trim().toLowerCase() } : {}),
      ...(portalName ? { portalName: portalName.trim() } : {}),
      ...(maxUploadSizeMb ? { maxUploadSizeMb: Number(maxUploadSizeMb) } : {})
    });

    res.json({
      message: 'Admin settings updated successfully',
      settings: updatedSettings
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Error updating settings' });
  }
});

// -------------------------------------------------------------
// HELPER UTILITIES
// -------------------------------------------------------------

function detectMediaType(fileName: string, mime: string): MediaType {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';

  // Video formats
  if (mime.startsWith('video/') || ['mp4', 'webm', 'mov', 'avi', 'mkv', 'flv', 'wmv', 'm4v'].includes(ext)) {
    return 'video';
  }
  // Presentation (PowerPoint / PPTX / PPT)
  if (['pptx', 'ppt', 'pps', 'ppsx', 'keynote', 'odp', 'potx'].includes(ext) || mime.includes('presentation') || mime.includes('powerpoint')) {
    return 'presentation';
  }
  // Spreadsheets (Excel / XLSX / XLS / CSV)
  if (['xlsx', 'xls', 'csv', 'xlsm', 'xlsb', 'ods', 'numbers', 'tsv'].includes(ext) || mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv')) {
    return 'spreadsheet';
  }
  // Word / Text Processing
  if (['docx', 'doc', 'pages', 'odt', 'rtf'].includes(ext) || mime.includes('word') || mime.includes('officedocument.wordprocessingml')) {
    return 'word';
  }
  // PDF
  if (['pdf'].includes(ext) || mime.includes('pdf')) {
    return 'pdf';
  }
  // Photoshop & Creative Design Assets (PSD, PSB, AI, EPS, FIGMA)
  if (['psd', 'psb', 'ai', 'eps', 'figma', 'fig', 'sketch', 'xd'].includes(ext) || mime.includes('photoshop') || mime.includes('illustrator')) {
    return 'psd';
  }
  // Photos & Posters
  if (mime.startsWith('image/')) {
    if (fileName.toLowerCase().includes('poster') || ['svg'].includes(ext)) {
      return 'poster';
    }
    return 'photo';
  }
  return 'document';
}

function getDefaultThumbnail(type: MediaType): string {
  switch (type) {
    case 'video':
      return 'https://images.unsplash.com/photo-1574717024653-61fd2cf4d44d?w=800&auto=format&fit=crop&q=80';
    case 'photo':
      return 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&auto=format&fit=crop&q=80';
    case 'poster':
      return 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&auto=format&fit=crop&q=80';
    case 'pdf':
      return 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80';
    case 'presentation':
      return 'https://images.unsplash.com/photo-1557804506-669a67965ba0?w=800&auto=format&fit=crop&q=80';
    case 'spreadsheet':
      return 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&auto=format&fit=crop&q=80';
    case 'word':
      return 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=800&auto=format&fit=crop&q=80';
    case 'psd':
      return 'https://images.unsplash.com/photo-1626785774573-4b799315345d?w=800&auto=format&fit=crop&q=80';
    default:
      return 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800&auto=format&fit=crop&q=80';
  }
}

function formatBytes(bytes: number, decimals = 1): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default router;
