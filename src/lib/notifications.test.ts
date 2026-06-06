import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  sendUserNotification,
  markAsRead,
  markAllAsRead,
  sendAdminNotification,
  markAdminAsRead,
  broadcastNotification
} from './notifications';
import { db } from '../firebase';
import {
  collection,
  addDoc,
  query,
  where,
  updateDoc,
  doc,
  serverTimestamp,
  getDocs
} from 'firebase/firestore';

// Mock dependencies
vi.mock('../firebase', () => ({
  db: {}
}));

vi.mock('firebase/firestore', () => ({
  collection: vi.fn(),
  addDoc: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  updateDoc: vi.fn(),
  doc: vi.fn(),
  serverTimestamp: vi.fn(() => 'mocked-timestamp'),
  getDocs: vi.fn()
}));

describe('Notifications Helpers', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('sendUserNotification', () => {
    it('should add a notification to the correct user collection', async () => {
      const userId = 'user123';
      const notification = {
        title: 'Test Title',
        message: 'Test Message',
        type: 'system' as const,
      };

      await sendUserNotification(userId, notification);

      expect(collection).toHaveBeenCalledWith(db, 'users', userId, 'notifications');
      expect(addDoc).toHaveBeenCalledWith(undefined, {
        ...notification,
        isRead: false,
        createdAt: 'mocked-timestamp'
      });
    });

    it('should log an error if addDoc fails', async () => {
      const error = new Error('Firestore error');
      vi.mocked(addDoc).mockRejectedValueOnce(error);

      await sendUserNotification('user123', {
        title: 'Test Title',
        message: 'Test Message',
        type: 'system' as const,
      });

      expect(console.error).toHaveBeenCalledWith('Error sending notification:', error);
    });
  });

  describe('markAsRead', () => {
    it('should update the notification to isRead: true', async () => {
      const userId = 'user123';
      const notificationId = 'notif123';

      await markAsRead(userId, notificationId);

      expect(doc).toHaveBeenCalledWith(db, 'users', userId, 'notifications', notificationId);
      expect(updateDoc).toHaveBeenCalledWith(undefined, { isRead: true });
    });

    it('should log an error if updateDoc fails', async () => {
      const error = new Error('Firestore error');
      vi.mocked(updateDoc).mockRejectedValueOnce(error);

      await markAsRead('user123', 'notif123');

      expect(console.error).toHaveBeenCalledWith('Error marking as read:', error);
    });
  });

  describe('markAllAsRead', () => {
    it('should query unread notifications and update them to isRead: true', async () => {
      const userId = 'user123';
      const mockDocs = {
        docs: [
          { ref: 'ref1' },
          { ref: 'ref2' },
        ]
      };

      vi.mocked(query).mockReturnValueOnce('mock-query' as any);
      vi.mocked(getDocs).mockResolvedValueOnce(mockDocs as any);

      await markAllAsRead(userId);

      expect(collection).toHaveBeenCalledWith(db, 'users', userId, 'notifications');
      expect(where).toHaveBeenCalledWith('isRead', '==', false);
      expect(query).toHaveBeenCalledWith(undefined, undefined); // undefined because collection/where are mocked to return undefined by default
      expect(getDocs).toHaveBeenCalledWith('mock-query');
      expect(updateDoc).toHaveBeenCalledTimes(2);
      expect(updateDoc).toHaveBeenNthCalledWith(1, 'ref1', { isRead: true });
      expect(updateDoc).toHaveBeenNthCalledWith(2, 'ref2', { isRead: true });
    });

    it('should log an error if getDocs fails', async () => {
      const error = new Error('Firestore error');
      vi.mocked(getDocs).mockRejectedValueOnce(error);

      await markAllAsRead('user123');

      expect(console.error).toHaveBeenCalledWith('Error marking all as read:', error);
    });
  });

  describe('sendAdminNotification', () => {
    it('should add a notification to the admin_notifications collection', async () => {
      const notification = {
        title: 'Admin Title',
        message: 'Admin Message',
        type: 'system' as const,
      };

      await sendAdminNotification(notification);

      expect(collection).toHaveBeenCalledWith(db, 'admin_notifications');
      expect(addDoc).toHaveBeenCalledWith(undefined, {
        ...notification,
        isRead: false,
        createdAt: 'mocked-timestamp'
      });
    });

    it('should log an error if addDoc fails', async () => {
      const error = new Error('Firestore error');
      vi.mocked(addDoc).mockRejectedValueOnce(error);

      await sendAdminNotification({
        title: 'Admin Title',
        message: 'Admin Message',
        type: 'system' as const,
      });

      expect(console.error).toHaveBeenCalledWith('Error sending admin notification:', error);
    });
  });

  describe('markAdminAsRead', () => {
    it('should update the admin notification to isRead: true', async () => {
      const notificationId = 'adminNotif123';

      await markAdminAsRead(notificationId);

      expect(doc).toHaveBeenCalledWith(db, 'admin_notifications', notificationId);
      expect(updateDoc).toHaveBeenCalledWith(undefined, { isRead: true });
    });

    it('should log an error if updateDoc fails', async () => {
      const error = new Error('Firestore error');
      vi.mocked(updateDoc).mockRejectedValueOnce(error);

      await markAdminAsRead('adminNotif123');

      expect(console.error).toHaveBeenCalledWith('Error marking admin notification as read:', error);
    });
  });

  describe('broadcastNotification', () => {
    it('should fetch all users and add a notification for each', async () => {
      const notification = {
        title: 'Broadcast',
        message: 'Hello everyone',
        type: 'system' as const,
      };

      const mockUsers = {
        docs: [
          { id: 'user1' },
          { id: 'user2' },
        ]
      };

      vi.mocked(getDocs).mockResolvedValueOnce(mockUsers as any);

      await broadcastNotification(notification);

      expect(collection).toHaveBeenCalledWith(db, 'users');
      expect(getDocs).toHaveBeenCalledWith(undefined); // undefined because collection is mocked

      expect(collection).toHaveBeenCalledWith(db, 'users', 'user1', 'notifications');
      expect(collection).toHaveBeenCalledWith(db, 'users', 'user2', 'notifications');

      expect(addDoc).toHaveBeenCalledTimes(2);
      expect(addDoc).toHaveBeenNthCalledWith(1, undefined, {
        ...notification,
        isRead: false,
        createdAt: 'mocked-timestamp'
      });
      expect(addDoc).toHaveBeenNthCalledWith(2, undefined, {
        ...notification,
        isRead: false,
        createdAt: 'mocked-timestamp'
      });
    });

    it('should log an error if getDocs fails', async () => {
      const error = new Error('Firestore error');
      vi.mocked(getDocs).mockRejectedValueOnce(error);

      await broadcastNotification({
        title: 'Broadcast',
        message: 'Hello everyone',
        type: 'system' as const,
      });

      expect(console.error).toHaveBeenCalledWith('Error broadcasting notification:', error);
    });
  });
});
