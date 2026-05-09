import { db } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  serverTimestamp,
  getDocs,
  limit
} from 'firebase/firestore';

export type NotificationType = 'order' | 'offer' | 'product' | 'system';

export interface UserNotification {
  id?: string;
  title: string;
  message: string;
  type: NotificationType;
  link?: string;
  isRead: boolean;
  createdAt: any;
  orderId?: string;
}

export const sendUserNotification = async (userId: string, notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    await addDoc(notificationsRef, {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending notification:', error);
  }
};

export const markAsRead = async (userId: string, notificationId: string) => {
  try {
    const docRef = doc(db, 'users', userId, 'notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
  } catch (error) {
    console.error('Error marking as read:', error);
  }
};

export const markAllAsRead = async (userId: string) => {
  try {
    const notificationsRef = collection(db, 'users', userId, 'notifications');
    const q = query(notificationsRef, where('isRead', '==', false));
    const snapshot = await getDocs(q);
    
    const promises = snapshot.docs.map(d => updateDoc(d.ref, { isRead: true }));
    await Promise.all(promises);
  } catch (error) {
    console.error('Error marking all as read:', error);
  }
};

export const sendAdminNotification = async (notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>) => {
  try {
    const adminNotificationsRef = collection(db, 'admin_notifications');
    await addDoc(adminNotificationsRef, {
      ...notification,
      isRead: false,
      createdAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error sending admin notification:', error);
  }
};

export const markAdminAsRead = async (notificationId: string) => {
  try {
    const docRef = doc(db, 'admin_notifications', notificationId);
    await updateDoc(docRef, { isRead: true });
  } catch (error) {
    console.error('Error marking admin notification as read:', error);
  }
};

export const broadcastNotification = async (notification: Omit<UserNotification, 'id' | 'createdAt' | 'isRead'>) => {
  try {
    const usersRef = collection(db, 'users');
    const snapshot = await getDocs(usersRef);
    
    const promises = snapshot.docs.map(userDoc => {
      const userNotifRef = collection(db, 'users', userDoc.id, 'notifications');
      return addDoc(userNotifRef, {
        ...notification,
        isRead: false,
        createdAt: serverTimestamp(),
      });
    });
    
    await Promise.all(promises);
  } catch (error) {
    console.error('Error broadcasting notification:', error);
  }
};
