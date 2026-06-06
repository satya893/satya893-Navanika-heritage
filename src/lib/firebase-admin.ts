import admin from 'firebase-admin';

type AdminType = typeof admin;

let _admin: AdminType | null = null;

function getAdmin(): AdminType {
  if (!_admin) {
    _admin = admin;
    if (!_admin!.apps.length) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      if (!process.env.FIREBASE_PROJECT_ID || !process.env.FIREBASE_CLIENT_EMAIL || !privateKey) {
        throw new Error(
          'Firebase admin credentials are not configured. Check FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY in .env.local.'
        );
      }
      _admin!.initializeApp({
        credential: _admin!.credential.cert({
          projectId: process.env.FIREBASE_PROJECT_ID,
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
          privateKey,
        }),
      });
    }
  }
  return _admin!;
}

let _db: ReturnType<AdminType['firestore']> | null = null;

export function getDbAdmin() {
  if (!_db) {
    const db = getAdmin().firestore();
    const dbId = process.env.FIRESTORE_DATABASE_ID;
    if (dbId && dbId !== '(default)') {
      try {
        db.settings({ databaseId: dbId });
      } catch (error: any) {
        // Ignore the error if Firestore was already initialized (common in Next.js dev mode due to HMR)
        if (!error.message || !error.message.includes('already been initialized')) {
          throw error;
        }
      }
    }
    _db = db;
  }
  return _db;
}

export function getAuthAdmin() {
  return getAdmin().auth();
}

// Keep legacy named exports for backwards compatibility
export const dbAdmin = new Proxy({} as ReturnType<AdminType['firestore']>, {
  get(_target, prop) {
    return (getDbAdmin() as any)[prop];
  },
});

export const authAdmin = new Proxy({} as ReturnType<AdminType['auth']>, {
  get(_target, prop) {
    return (getAdmin().auth() as any)[prop];
  },
});

export async function verifyAuthToken(token: string): Promise<any> {
  try {
    const decoded = await getAuthAdmin().verifyIdToken(token);
    return decoded;
  } catch {
    throw new Error('Invalid token');
  }
}

export const sendUserNotificationAdmin = async (userId: string, notification: {
  title: string;
  message: string;
  type: 'order' | 'offer' | 'product' | 'system';
  link?: string;
  orderId?: string;
}) => {
  try {
    await dbAdmin.collection('users').doc(userId).collection('notifications').add({
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

export const sendAdminNotificationServer = async (notification: {
  title: string;
  message: string;
  type: 'order' | 'offer' | 'product' | 'system';
  link?: string;
  orderId?: string;
}) => {
  try {
    await dbAdmin.collection('admin_notifications').add({
      ...notification,
      isRead: false,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error sending server admin notification:', error);
  }
};
