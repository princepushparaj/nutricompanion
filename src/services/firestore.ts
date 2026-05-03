import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  Timestamp,
  updateDoc,
  addDoc,
  limit
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, auth } from '../lib/firebase';

export const UserProfileService = {
  async getProfile(userId: string) {
    try {
      const docRef = doc(db, 'users', userId);
      const snap = await getDoc(docRef);
      return snap.exists() ? snap.data() : null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${userId}`);
    }
  },
  async updateProfile(userId: string, data: any) {
    try {
      const docRef = doc(db, 'users', userId);
      await setDoc(docRef, { ...data, uid: userId }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}`);
    }
  }
};

export const DietService = {
  async savePlan(userId: string, plan: any, items: any[]) {
    try {
      const plansRef = collection(db, 'users', userId, 'dietPlans');
      const planDoc = await addDoc(plansRef, {
        ...plan,
        userId,
        createdAt: Timestamp.now()
      });
      
      const itemsRef = collection(db, 'users', userId, 'dietPlans', planDoc.id, 'items');
      for (const item of items) {
        await addDoc(itemsRef, { ...item, planId: planDoc.id });
      }
      return planDoc.id;
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}/dietPlans`);
    }
  },
  
  subscribeToActivePlan(userId: string, callback: (plan: any, items: any[]) => void) {
    const q = query(collection(db, 'users', userId, 'dietPlans'), where('active', '==', true));
    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const planDoc = snapshot.docs[0];
        const plan = { id: planDoc.id, ...planDoc.data() };
        const itemsRef = collection(db, 'users', userId, 'dietPlans', plan.id, 'items');
        getDocs(query(itemsRef, orderBy('time'))).then(itemSnaps => {
          const items = itemSnaps.docs.map(d => ({ id: d.id, ...d.data() }));
          callback(plan, items);
        });
      } else {
        callback(null, []);
      }
    }, (e) => handleFirestoreError(e, OperationType.LIST, `users/${userId}/dietPlans`));
  }
};

export const LogService = {
  async getLogForDate(userId: string, dateStr: string) {
    try {
      const q = query(collection(db, 'users', userId, 'logs'), where('date', '==', dateStr));
      const snap = await getDocs(q);
      if (!snap.empty) {
        return { id: snap.docs[0].id, ...snap.docs[0].data() };
      }
      return null;
    } catch (e) {
      handleFirestoreError(e, OperationType.GET, `users/${userId}/logs`);
    }
  },
  
  async saveLog(userId: string, data: any) {
    try {
      const logsRef = collection(db, 'users', userId, 'logs');
      if (data.id) {
        const docRef = doc(db, 'users', userId, 'logs', data.id);
        await updateDoc(docRef, data);
      } else {
        await addDoc(logsRef, { ...data, userId });
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}/logs`);
    }
  },

  async logActivity(userId: string, date: string, activity: { type: string, duration: number, caloriesBurned: number }) {
    try {
      const logRef = doc(db, 'users', userId, 'logs', date);
      const logSnap = await getDoc(logRef);
      
      const currentLog = logSnap.exists() ? logSnap.data() : { 
        userId, 
        date, 
        waterIntakeMl: 0, 
        waterGoalMl: 2500, 
        mealsLogged: {},
        activities: [] 
      };

      const activities = currentLog.activities || [];
      activities.push({ ...activity, timestamp: new Date().toISOString() });
      
      await setDoc(logRef, { ...currentLog, activities }, { merge: true });
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `users/${userId}/logs`);
    }
  },
  
  async getRecentLogs(userId: string, limitCount: number = 7) {
    try {
      const q = query(
        collection(db, 'users', userId, 'logs'), 
        orderBy('date', 'desc'),
        limit(limitCount)
      );
      const snap = await getDocs(q);
      return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) {
      handleFirestoreError(e, OperationType.LIST, `users/${userId}/logs`);
    }
  }
};
