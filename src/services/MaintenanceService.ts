import { collection, getDocs, query, where, deleteDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

const MAINTENANCE_DOC_ID = 'system_resets';

export const runMaintenance = async (userRole: string) => {
  if (userRole !== 'admin') return;

  try {
    const maintenanceRef = doc(db, 'system_config', MAINTENANCE_DOC_ID);
    const maintenanceSnap = await getDoc(maintenanceRef);
    
    const now = new Date();
    const nowTime = now.getTime();

    if (!maintenanceSnap.exists()) {
      // Initialize if not exists
      await setDoc(maintenanceRef, {
        last_connections_reset: nowTime,
        last_reports_reset: nowTime,
        last_houses_reset: nowTime
      });
      return;
    }

    const data = maintenanceSnap.data();
    const lastConnectionsReset = data.last_connections_reset || 0;
    const lastReportsReset = data.last_reports_reset || 0;
    const lastHousesReset = data.last_houses_reset || 0;

    const ONE_DAY = 24 * 60 * 60 * 1000;
    const FIVE_DAYS = 5 * ONE_DAY;

    // 1. Reset / Clean Connections older than 24h
    try {
      const connectionsSnap = await getDocs(collection(db, 'connections'));
      const expiredConnections = connectionsSnap.docs.filter(d => {
        const connData = d.data();
        const ts = connData.timestamp;
        let tMs = 0;
        if (typeof ts === 'string') tMs = new Date(ts).getTime();
        else if (typeof ts === 'number') tMs = ts;
        else if (ts?.toDate) tMs = ts.toDate().getTime();
        else if (ts?.seconds) tMs = ts.seconds * 1000;
        else tMs = new Date(ts).getTime() || 0;

        return tMs === 0 || (nowTime - tMs) >= ONE_DAY;
      });

      if (expiredConnections.length > 0) {
        console.log(`Maintenance: Purging ${expiredConnections.length} expired connections history (>24h)...`);
        const deletePromises = expiredConnections.map(d => deleteDoc(doc(db, 'connections', d.id)));
        await Promise.all(deletePromises);
      }
      await updateDoc(maintenanceRef, { last_connections_reset: nowTime });
    } catch (connErr) {
      console.error("Error purging connections in maintenance:", connErr);
    }

    // 2. Report Archives are preserved per establishment for historical tracking
    // We update the timestamp without deleting historical reports
    if (nowTime - lastReportsReset >= ONE_DAY) {
      await updateDoc(maintenanceRef, { last_reports_reset: nowTime });
    }

    // 3. Reset Houses System (5 days)
    if (nowTime - lastHousesReset >= FIVE_DAYS) {
      console.log("Maintenance: Resetting houses points (5 days)...");
      
      // Reset house totals
      const housesSnap = await getDocs(collection(db, 'houses'));
      const resetHousePromises = housesSnap.docs.map(d => updateDoc(doc(db, 'houses', d.id), { total_points: 0 }));
      await Promise.all(resetHousePromises);

      // Clear history
      const historySnap = await getDocs(collection(db, 'house_points_history'));
      const deleteHistoryPromises = historySnap.docs.map(d => deleteDoc(doc(db, 'house_points_history', d.id)));
      await Promise.all(deleteHistoryPromises);

      await updateDoc(maintenanceRef, { last_houses_reset: nowTime });
    }

  } catch (error: any) {
    const errMsg = error instanceof Error ? error.message : String(error);
    if (errMsg.includes('offline') || !navigator.onLine) {
      console.warn("Maintenance skipped: client is offline.");
    } else {
      console.error("Maintenance Error:", error);
    }
  }
};
