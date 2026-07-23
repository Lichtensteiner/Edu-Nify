import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  onSnapshot, 
  serverTimestamp,
  orderBy 
} from 'firebase/firestore';

export interface CertificateRequest {
  id: string;
  studentId: string;
  studentName: string;
  studentMatricule?: string;
  className: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  gender?: string;
  schoolId: string;
  schoolName?: string;
  requestDate: any;
  status: 'pending' | 'approved' | 'rejected';
  reason?: string;
  academicYear: string;
  certificateRef?: string;
  approvedAt?: any;
  approvedBy?: string;
  rejectionReason?: string;
}

export const requestCertificate = async (studentData: {
  studentId: string;
  studentName: string;
  studentMatricule?: string;
  className: string;
  dateNaissance?: string;
  lieuNaissance?: string;
  gender?: string;
  schoolId?: string;
  reason?: string;
  academicYear?: string;
}) => {
  try {
    const payload = {
      studentId: studentData.studentId,
      studentName: studentData.studentName,
      studentMatricule: studentData.studentMatricule || 'N/A',
      className: studentData.className || 'N/A',
      dateNaissance: studentData.dateNaissance || 'N/A',
      lieuNaissance: studentData.lieuNaissance || 'N/A',
      gender: studentData.gender || 'N/A',
      schoolId: studentData.schoolId || 'all',
      reason: studentData.reason || 'Dossier Administratif',
      academicYear: studentData.academicYear || '2025-2026',
      status: 'pending',
      requestDate: serverTimestamp(),
      createdAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(db, 'certificate_requests'), payload);

    // Notify administrators
    await addDoc(collection(db, 'notifications'), {
      title: 'Nouvelle demande de Certificat de Scolarité',
      message: `L'élève ${studentData.studentName} (${studentData.className}) demande un certificat de scolarité.`,
      targetRoles: ['admin', 'personnel administratif', 'secretaire'],
      targetSchoolId: studentData.schoolId || 'all',
      type: 'info',
      createdAt: serverTimestamp(),
      isRead: false
    });

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'certificate_requests');
    throw error;
  }
};

export const subscribeToStudentCertificates = (
  studentId: string, 
  callback: (requests: CertificateRequest[]) => void
) => {
  const q = query(
    collection(db, 'certificate_requests'), 
    where('studentId', '==', studentId)
  );

  return onSnapshot(q, (snapshot) => {
    const list = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as CertificateRequest[];

    // Sort client side by date descending
    list.sort((a, b) => {
      const timeA = a.requestDate?.toDate ? a.requestDate.toDate().getTime() : 0;
      const timeB = b.requestDate?.toDate ? b.requestDate.toDate().getTime() : 0;
      return timeB - timeA;
    });

    callback(list);
  }, (err) => {
    console.error("Error subscribing to student certificates:", err);
  });
};

export const subscribeToAllCertificateRequests = (
  schoolId: string,
  callback: (requests: CertificateRequest[]) => void
) => {
  const q = query(collection(db, 'certificate_requests'));

  return onSnapshot(q, (snapshot) => {
    let list = snapshot.docs.map(docSnap => ({
      id: docSnap.id,
      ...docSnap.data()
    })) as CertificateRequest[];

    if (schoolId && schoolId !== 'all') {
      list = list.filter(r => r.schoolId === 'all' || r.schoolId === schoolId || !r.schoolId);
    }

    list.sort((a, b) => {
      const timeA = a.requestDate?.toDate ? a.requestDate.toDate().getTime() : 0;
      const timeB = b.requestDate?.toDate ? b.requestDate.toDate().getTime() : 0;
      return timeB - timeA;
    });

    callback(list);
  }, (err) => {
    console.error("Error subscribing to all certificate requests:", err);
  });
};

export const approveCertificateRequest = async (
  requestId: string,
  studentId: string,
  studentName: string,
  adminUser: any
) => {
  try {
    const certRef = `CERT-2026-${Math.floor(100000 + Math.random() * 900000)}`;
    const docRef = doc(db, 'certificate_requests', requestId);

    await updateDoc(docRef, {
      status: 'approved',
      certificateRef: certRef,
      approvedAt: serverTimestamp(),
      approvedBy: `${adminUser?.prenom || ''} ${adminUser?.nom || ''}`.trim() || 'Administration'
    });

    // Send direct notification to the student
    await addDoc(collection(db, 'notifications'), {
      user_id: studentId,
      title: ' Certificat de Scolarité Disponible !',
      message: `Votre certificat de scolarité (Réf: ${certRef}) a été validé par la direction. Vous pouvez le télécharger dès maintenant.`,
      type: 'success',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
      read: false
    });

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `certificate_requests/${requestId}`);
    throw error;
  }
};

export const rejectCertificateRequest = async (
  requestId: string,
  studentId: string,
  reason: string,
  adminUser: any
) => {
  try {
    const docRef = doc(db, 'certificate_requests', requestId);

    await updateDoc(docRef, {
      status: 'rejected',
      rejectionReason: reason || 'Non conformité des informations',
      approvedAt: serverTimestamp(),
      approvedBy: `${adminUser?.prenom || ''} ${adminUser?.nom || ''}`.trim() || 'Administration'
    });

    // Send direct notification to the student
    await addDoc(collection(db, 'notifications'), {
      user_id: studentId,
      title: ' Demande de Certificat Non Validée',
      message: `Votre demande de certificat de scolarité a été refusée. Motif : ${reason || 'Contactez le secrétariat'}.`,
      type: 'warning',
      timestamp: new Date().toISOString(),
      createdAt: serverTimestamp(),
      read: false
    });

  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `certificate_requests/${requestId}`);
    throw error;
  }
};
